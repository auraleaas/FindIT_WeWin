"use client"

import { useState, useRef, useEffect } from 'react';
import BackButton from '~/components/ui/BackButton';
import { FaMicrophone } from 'react-icons/fa';
import Image from "next/image";
import OrioEyes from '~/../public/images/orion-eyes.svg';
import { api } from '~/trpc/react';

export default function AiVoice() {
const [listening, setListening] = useState(false);
const [processing, setProcessing] = useState(false);
const [transcript, setTranscript] = useState('');
const [aiResponse, setAiResponse] = useState('');
const [hasRecordingSupport, setHasRecordingSupport] = useState(true);
const [textInput, setTextInput] = useState('');

const mediaRecorder = useRef<MediaRecorder | null>(null);
const audioChunks = useRef<Blob[]>([]);

// Function to handle text submission
const handleTextSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!textInput.trim() || processing) return;
  
  setProcessing(true);
  setTranscript(textInput);
  setAiResponse('');
  
  // Send to server via tRPC
  voiceMutation.mutate({
    textInput: textInput
  });
  
  // Clear input field
  setTextInput('');
};

// tRPC mutation
const voiceMutation = api.voice.processVoice.useMutation({
  onSuccess: (data) => {
    setTranscript(data.transcript);
    setAiResponse(data.answer);
    
    // Play the audio response
    const audio = new Audio(data.audioDataUrl);
    audio.play();
    
    setProcessing(false);
  },
  onError: (error) => {
    console.error("Error processing voice:", error);
    setAiResponse("Sorry, I couldn't process that. Please try again.");
    setProcessing(false);
  }
});

// Polyfill for getUserMedia to support older browsers
const getMediaStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
  // Check for modern API first
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  
  // Fallback to older APIs
  const legacyGetUserMedia = navigator.getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia;
    
  if (legacyGetUserMedia) {
    return new Promise((resolve, reject) => {
      legacyGetUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
  
  throw new Error("getUserMedia is not supported in this browser");
};

const handleMicClick = async () => {
  if (processing) return; // Prevent clicks while processing
  
  if (!listening) {
    try {
      // Test if any recording method is available
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
          !(navigator.getUserMedia || 
            (navigator as any).webkitGetUserMedia || 
            (navigator as any).mozGetUserMedia || 
            (navigator as any).msGetUserMedia)) {
        
        setAiResponse("Voice recording is not supported in this browser or app. Please try using the latest version of Chrome, Safari, or Firefox on a device with a microphone.");
        return;
      }

      // Clear previous data
      audioChunks.current = [];
      setTranscript('');
      setAiResponse('');
      
      // Start recording with our polyfill function
      const stream = await getMediaStream({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === 'undefined') {
        setAiResponse("Your browser supports microphone access but not audio recording. Please try a modern browser like Chrome or Safari.");
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Set up MediaRecorder with fallback options
      const options: MediaRecorderOptions = {};
      
      // Try to find a supported MIME type
      const mimeTypes = [
        'audio/webm', 
        'audio/mp4',
        'audio/ogg',
        'audio/wav',
        ''  // Empty string = browser default
      ];
      
      for (const type of mimeTypes) {
        if (!type || MediaRecorder.isTypeSupported(type)) {
          if (type) options.mimeType = type;
          break;
        }
      }
      
      mediaRecorder.current = new MediaRecorder(stream, options);
      
      // Collect audio data
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      // When recording stops, process the audio
      mediaRecorder.current.onstop = async () => {
        setListening(false);
        setProcessing(true);
        
        try {
          // Create audio blob and convert to base64
          const audioBlob = new Blob(audioChunks.current);
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              
              // Send to server via tRPC
              voiceMutation.mutate({
                audioBase64: base64Audio
              });
            } catch (err) {
              console.error("Error processing audio data:", err);
              setProcessing(false);
              setAiResponse("Sorry, there was a problem processing your voice. Please try again.");
            }
          };
          
          reader.onerror = () => {
            console.error("FileReader error:", reader.error);
            setProcessing(false);
            setAiResponse("Error reading audio data. Please try again.");
          };
          
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error("Error in onstop handler:", err);
          setProcessing(false);
          setAiResponse("An error occurred while processing your voice.");
        }
        
        // Stop the tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.current.start();
      setListening(true);
      
      // Auto-stop after 30 seconds (to stay well under the 10MB limit)
      setTimeout(() => {
        if (mediaRecorder.current?.state === 'recording') {
          mediaRecorder.current.stop();
        }
      }, 30000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      
      // Handle specific permission errors
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setAiResponse("I need permission to use your microphone. Please allow access in your browser settings.");
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        setAiResponse("No microphone detected. Please connect a microphone and try again.");
      } else if (error instanceof DOMException && error.name === 'NotReadableError') {
        setAiResponse("Your microphone is busy or not working properly. Please try again later.");
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        setAiResponse("Something interrupted the microphone access. Please try again.");
      } else {
        setAiResponse("Unable to access the microphone. Please make sure your device has a working microphone and try again.");
      }
    }
  } else {
    // Stop recording
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
  }
};

// Check if microphone is supported when component mounts
useEffect(() => {
  // Check for browser compatibility and display appropriate message
  if (typeof window !== 'undefined') {
    // Test for modern API
    const hasModernMediaAPI = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Test for legacy API (older browsers)
    const hasLegacyMediaAPI = !!(
      navigator.getUserMedia || 
      (navigator as any).webkitGetUserMedia || 
      (navigator as any).mozGetUserMedia || 
      (navigator as any).msGetUserMedia
    );

    if (!hasModernMediaAPI && !hasLegacyMediaAPI) {
      console.log("No voice recording API detected");
      setHasRecordingSupport(false);
      setAiResponse("Your browser doesn't support voice recording. You can use the text input instead.");
    } else if (!hasModernMediaAPI && hasLegacyMediaAPI) {
      console.log("Only legacy recording API available");
      // Still allow recording but with a warning
      setAiResponse("Your browser has limited support for voice recording. For the best experience, try Chrome or Safari.");
    }
  }
  
  // Clean up on unmount
  return () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
  };
}, []);

return (
  <div className="min-h-screen bg-white flex flex-col">
    {/* Top bar */}
    <div className="flex items-center bg-[#6ED6D6] px-4 py-3 rounded-b-3xl shadow">
      <BackButton />
      <h1 className="flex-1 text-center text-lg font-semibold text-white -ml-8">Chat Me!</h1>
    </div>

    {/* Main content */}
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
      <div className="flex justify-center my-6">
        <Image 
          src={OrioEyes} 
          alt="Illustration" 
          width={200} 
          height={200} 
          className={`rounded-full ${listening ? 'animate-pulse' : ''}`} 
        />
      </div>
      <div className="text-center mt-4 mb-8">
        {!aiResponse ? (
          <div className="text-2xl font-medium text-black">
            {processing ? "Processing..." : "Hi, I'm orio!\nHow could\nI help you?"}
          </div>
        ) : (
          <div className="text-2xl max-w-xs mx-auto rounded-xl p-3 text-black text-center">
            {aiResponse}
          </div>
        )}
      </div>
      
      {/* Transcript (user input) */}
      {transcript && (
        <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-xl p-3 mb-2 text-gray-800 text-center text-base shadow">
          {transcript}
        </div>
      )}
      
      {/* Text input fallback for browsers without voice support */}
      {!hasRecordingSupport && (
        <form onSubmit={handleTextSubmit} className="w-full max-w-xs mx-auto mb-4">
          <div className="flex items-center border-2 border-[#6ED6D6] rounded-lg overflow-hidden">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 outline-none"
              disabled={processing}
            />
            <button
              type="submit"
              className={`bg-[#6ED6D6] px-4 py-2 text-white ${processing ? 'opacity-50' : 'hover:bg-[#4CD6C1]'}`}
              disabled={processing}
            >
              Send
            </button>
          </div>
        </form>
      )}
      
      {/* Mic button - only show if recording is supported */}
      {hasRecordingSupport && (
        <button
          className={`mt-12 w-68 h-16 rounded-3xl text-sm flex items-center justify-center shadow-lg transition-all duration-200 
            ${processing ? 'bg-gray-400 cursor-not-allowed' : 
              listening ? 'bg-red-500' : 'bg-[#6ED6D6] hover:bg-[#4CD6C1]'}`}
          onClick={handleMicClick}
          disabled={processing}
        >
          {processing ? (
            <div className="flex items-center justify-center w-full px-8">
              <span className="text-lg font-medium text-white">Processing...</span>
            </div>
          ) : listening ? (
            <div className="flex items-center justify-center w-full px-8">
              <FaMicrophone className="text-2xl text-white animate-pulse" />
              <span className="ml-3 text-lg font-medium text-white">Tap to stop</span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full px-8">
              <span className="flex-1 text-left text-white">Tap here to start a dialog</span>
              <FaMicrophone className="text-2xl text-white ml-2" />
            </div>
          )}
        </button>
      )}
    </div>
  </div>
);
}
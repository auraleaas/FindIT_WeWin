"use client"

import { useState, useRef, useEffect } from 'react';
import BackButton from '~/components/ui/BackButton';
import { FaMicrophone } from 'react-icons/fa';
import Image from "next/image";
import OrioEyes from '~/../public/images/orion-eyes.svg';
import { api } from '~/trpc/react';
import { type RouterOutputs } from '~/trpc/react';

// Define type for the voice processing result
type VoiceResult = RouterOutputs['voice']['processVoice'];

export default function AiVoice() {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  // tRPC mutation
  const voiceMutation = api.voice.processVoice.useMutation({
    onSuccess: (data: VoiceResult) => {
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

  const handleMicClick = async () => {
    if (processing) return; // Prevent clicks while processing
    
    if (!listening) {
      try {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Clear previous data
        audioChunks.current = [];
        setTranscript('');
        setAiResponse('');
        
        // Set up MediaRecorder with WebM format
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        
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
          
          // Create audio blob and convert to base64
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
          const reader = new FileReader();
          
          reader.onloadend = () => {
            const result = reader.result as string | null;
            
            if (result) {
              // Extract just the base64 part without the data URL prefix
              const base64Audio = result.split(',')[1];
              
              // Send to server via tRPC
              if (base64Audio) {
                voiceMutation.mutate({
                  audioBase64: base64Audio
                });
              } else {
                console.error("Failed to extract base64 audio data");
                setAiResponse("Sorry, failed to process audio data.");
                setProcessing(false);
              }
            } else {
              console.error("FileReader result is null");
              setAiResponse("Sorry, failed to read audio data.");
              setProcessing(false);
            }
          };
          
          reader.readAsDataURL(audioBlob);
          
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
        setAiResponse("I need microphone permission to hear you.");
      }
    } else {
      // Stop recording
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop();
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
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
        
        {/* Mic button */}
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
      </div>
    </div>
  );
}
"use client"

import  { useState } from 'react';
import BackButton from '~/components/ui/BackButton';
import { FaMicrophone } from 'react-icons/fa';
import Image from "next/image"
import OrioEyes from '~/../public/images/orion-eyes.svg';

export default function AiVoice () {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const handleMicClick = () => {
    if (!listening) {
      setListening(true);
      setTranscript('');
      setAiResponse('');
      // Simulate listening and AI response for demo
      setTimeout(() => {
        setTranscript('What is the weather today?');
        setTimeout(() => {
          setAiResponse('The weather today is sunny with a high of 25°C.');
          setListening(false);
        }, 1500);
      }, 1500);
    } else {
      setListening(false);
    }
  };

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
          <Image src={OrioEyes} alt="Illustration" width={200} height={200} className="rounded-full" />
        </div>
        <div className="text-center mt-4 mb-8">
          {!aiResponse ? (
            <div className="text-2xl font-medium text-black">Hi, I'm orio!<br/>How could<br/>I help you?</div>
          ) : (
            <div className="text-2xl -full max-w-xs mx-auto rounded-xl p-3 text-black text-center">
              {aiResponse}
            </div>
          )}
        </div>
        {/* Transcript (user input) */}
        {transcript && !aiResponse && (
          <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-xl p-3 mb-2 text-gray-800 text-center text-base shadow">
            {transcript}
          </div>
        )}
        {/* Mic button */}
        <button
          className={`mt-12
             w-68 h-16 rounded-3xl text-sm flex items-center justify-center shadow-lg transition-all duration-200 ${listening ? 'bg-[#6ED6D6]' : 'bg-[#6ED6D6] hover:bg-[#4CD6C1]'}`}
          onClick={handleMicClick}
        >
          {listening ? (
            <div className="flex items-center justify-center w-full px-8">
              <FaMicrophone className="text-2xl text-white animate-pulse" />
              <span className="ml-3 text-lg font-medium text-white">listening...</span>
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
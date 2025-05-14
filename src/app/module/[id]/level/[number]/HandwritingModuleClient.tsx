"use client";

import dynamic from "next/dynamic";
import React from "react";

// This type represents the props accepted by the HandwritingModule component
interface HandwritingModuleProps {
  letter: string;
}

// Dynamically import the HandwritingModule to avoid SSR with no loading UI
const HandwritingModule = dynamic(
  () => import('~/components/tracing/HandwritingModule').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading handwriting module...</p>
        </div>
      </div>
    )
  }
);

export default function HandwritingModuleClient({
  letter
}: HandwritingModuleProps) {
  const handleCompletion = (level: number, score: number) => {
    console.log(`Completed level ${level} with score ${score}`);
    // Here you could save progress to localStorage or call an API
  };

  return (
    <div className="min-h-[400px]">
      <HandwritingModule 
        letter={letter} 
        onCompletion={handleCompletion}
      />
    </div>
  );
}

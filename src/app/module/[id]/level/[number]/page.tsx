import type { Metadata } from 'next';
import { ProgressCard } from "~/components/ui/ProgressCard";
import BackButton from "~/components/ui/BackButton";
import HandwritingModuleClient from './HandwritingModuleClient';

export const metadata: Metadata = {
  title: 'Learn to Write - Letter A',
  description: 'Interactive module to learn handwriting for blind and low-vision users',
};

export default function ModulePage({ 
  params 
}: { 
  params: { id: string; number: string }
}) {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-[#4CD6C1] px-4 pt-8 pb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-bold text-white ml-2">Learn to Write</h1>
      </div>
      
      {/* Main content */}
      <div className="px-4 py-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Letter A</h2>
          <p className="text-gray-600">
            Learn to write the letter A through interactive exercises.
          </p>
        </div>
        
        {/* Progress card */}
        <div className="mb-8">
          <ProgressCard 
            title="Letter A"
            progress={0}
            totalLevels={3}
            currentLevel={1}
          />
        </div>
        
        {/* Handwriting module */}
        <section aria-labelledby="handwriting-module" className="mb-8">
          <h2 id="handwriting-module" className="sr-only">Handwriting Practice</h2>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <HandwritingModuleClient letter="A" />
          </div>
        </section>
        
        {/* Accessibility notes */}
        <section aria-labelledby="accessibility-notes" className="mb-8">
          <h2 id="accessibility-notes" className="text-xl font-bold mb-2">Accessibility Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Haptic feedback provides directional guidance while writing</li>
            <li>Spatial audio cues help navigate the letter shape</li>
            <li>Screen reader compatible with live regions for status updates</li>
            <li>High-contrast design for low-vision users</li>
            <li>Works offline via Progressive Web App capabilities</li>
          </ul>
        </section>
        
        {/* Tips section */}
        <section aria-labelledby="writing-tips" className="mb-8">
          <h2 id="writing-tips" className="text-xl font-bold mb-2">Tips for Writing Letter A</h2>
          <div className="prose text-gray-700">
            <p>The letter A consists of three strokes:</p>
            <ol className="list-decimal list-inside">
              <li>Draw a diagonal line from bottom left to top center</li>
              <li>Draw a diagonal line from top center to bottom right</li>
              <li>Draw a horizontal line across the middle, connecting the two diagonal lines</li>
            </ol>
            <p className="mt-2">
              Take your time and focus on the shape. The vibration patterns and audio cues will guide you.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

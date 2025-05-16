'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSpatialAudio } from './useSpatialAudio';
import { useHaptic } from './useHaptic';

interface HandwritingModuleProps {
  letter: string;
  onCompletion?: (level: number, score: number) => void;
}

// Dynamically import TraceCanvas to ensure it's only loaded on the client
const TraceCanvas = dynamic(() => import('./TraceCanvas.client'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-lg flex items-center justify-center" 
         style={{ width: '300px', height: '300px' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading canvas...</p>
      </div>
    </div>
  )
});

// Stage-specific colors and styles
const stageStyles = {
  template: {
    color: 'bg-blue-600',
    border: 'border-blue-600',
    text: 'text-blue-600',
    light: 'bg-blue-100'
  },
  guided: {
    color: 'bg-purple-600',
    border: 'border-purple-600',
    text: 'text-purple-600',
    light: 'bg-purple-100'
  }
};

// Stage content with detailed instructions
const stageContent = {
  template: {
    title: 'Stage 1: Template Tracing',
    shortInstructions: 'Trace the letter outline with your finger',
    fullInstructions: 'Follow the dotted outline with your finger. Your device will vibrate to confirm you are on the correct path. This helps your body memorize the shape.',
    icon: '✏️',
    goal: 'Goal: Trace all 3 strokes to complete the letter'
  },
  guided: {
    title: 'Stage 2: Guided Practice',
    shortInstructions: 'Draw from memory with guidance',
    fullInstructions: 'Now draw the letter from memory. You wll receive vibration and sound cues when you deviate from the correct path. Follow these cues to stay on track.',
    icon: '👆',
    goal: 'Goal: Draw all 3 strokes with guidance'
  }
};

const HandwritingModule: React.FC<HandwritingModuleProps> = ({
  letter = 'A',
  onCompletion
}) => {
  const [currentStage, setCurrentStage] = useState<'template' | 'guided'>('template');
  const [scores, setScores] = useState<Record<string, number>>({
    template: 0,
    guided: 0
  });
  const [showInstructions, setShowInstructions] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [stageTransition, setStageTransition] = useState(false);
  
  const audio = useSpatialAudio();
  const haptic = useHaptic();
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Effect to ensure we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Force initialize audio context and unlock it for mobile
  const initializeAudio = () => {
    if (audioInitialized) return;
    
    try {
      // Create and unlock audio context
      if (!audioContextRef.current) {
        // Create the audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Attempt to resume the audio context (required for iOS)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Play a silent sound to unlock audio
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0.3; // Louder - more likely to work on mobile
      oscillator.frequency.value = 440; // A4 note
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
      
      // Call the audio hook's init function
      audio.initAudio();
      
      setAudioInitialized(true);
      console.log('Audio context initialized and unlocked');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };
  
  // Play audio instructions using tones instead of speech
  const playStageAudioInstructions = (stage: 'template' | 'guided') => {
    try {
      if (!audioContextRef.current) {
        initializeAudio();
        if (!audioContextRef.current) return;
      }
      
      // Make sure audio context is running
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0.3; // Louder for mobile
      gainNode.connect(audioContextRef.current.destination);
      
      // Play a pattern of tones to indicate the stage
      if (stage === 'template') {
        // Stage 1: Play three ascending tones
        const notes = [262, 330, 392]; // C4, E4, G4 - a major triad
        
        notes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = audioContextRef.current!.createOscillator();
            osc.frequency.value = freq;
            osc.connect(gainNode);
            osc.start();
            osc.stop(audioContextRef.current!.currentTime + 0.15);
          }, i * 200);
        });
        
        // After the chord, play two short beeps to indicate "trace"
        setTimeout(() => {
          const osc = audioContextRef.current!.createOscillator();
          osc.frequency.value = 440; // A4
          osc.connect(gainNode);
          osc.start();
          osc.stop(audioContextRef.current!.currentTime + 0.1);
          
          setTimeout(() => {
            const osc2 = audioContextRef.current!.createOscillator();
            osc2.frequency.value = 440;
            osc2.connect(gainNode);
            osc2.start();
            osc2.stop(audioContextRef.current!.currentTime + 0.1);
          }, 150);
        }, 800);
      } else {
        // Stage 2: Play three descending tones
        const notes = [392, 330, 262]; // G4, E4, C4 - a major triad in reverse
        
        notes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = audioContextRef.current!.createOscillator();
            osc.frequency.value = freq;
            osc.connect(gainNode);
            osc.start();
            osc.stop(audioContextRef.current!.currentTime + 0.15);
          }, i * 200);
        });
        
        // After the chord, play a long-short pattern to indicate "guided"
        setTimeout(() => {
          const osc = audioContextRef.current!.createOscillator();
          osc.frequency.value = 440; // A4
          osc.connect(gainNode);
          osc.start();
          osc.stop(audioContextRef.current!.currentTime + 0.2);
          
          setTimeout(() => {
            const osc2 = audioContextRef.current!.createOscillator();
            osc2.frequency.value = 440;
            osc2.connect(gainNode);
            osc2.start();
            osc2.stop(audioContextRef.current!.currentTime + 0.1);
          }, 250);
        }, 800);
      }
      
      // Vibrate in a pattern that indicates the stage
      if (haptic.isSupported) {
        if (stage === 'template') {
          haptic.vibrate([100, 50, 100]); // Short pattern for template stage
        } else {
          haptic.vibrate([200, 100, 200]); // Longer pattern for guided stage
        }
      }
      
    } catch (error) {
      console.error('Error playing audio instruction tones:', error);
    }
  };
  
  // Effect to initialize audio on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initializeAudio();
    };
    
    // Add listeners for common user interactions
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);
  
  // Play stage audio when instructions are shown
  useEffect(() => {
    if (showInstructions) {
      // Try to initialize audio first
      initializeAudio();
      
      // Small delay to ensure audio context is ready
      const timer = setTimeout(() => {
        playStageAudioInstructions(currentStage);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showInstructions, currentStage]);
  
  // Handle completion of a stage
  const handleStageComplete = (score: number) => {
    // Update scores
    setScores(prev => ({
      ...prev,
      [currentStage]: score
    }));
    
    // Show transition screen
    setStageTransition(true);
    
    // Provide feedback
    if (haptic.isSupported) {
      haptic.vibrateSuccess();
    }
    
    // Force audio initialization and try to play audio
    initializeAudio();
    
    // Play success sounds
    try {
      if (audioContextRef.current) {
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0.3;
        gainNode.connect(audioContextRef.current.destination);
        
        // Play a success arpeggio
        const successNotes = [262, 330, 392, 523]; // C4, E4, G4, C5 - major arpeggio
        
        successNotes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = audioContextRef.current!.createOscillator();
            osc.frequency.value = freq;
            osc.connect(gainNode);
            osc.start();
            osc.stop(audioContextRef.current!.currentTime + 0.1);
          }, i * 100);
        });
      }
    } catch (error) {
      console.error('Error playing success sounds:', error);
    }
    
    // Move to the next stage after a delay
    setTimeout(() => {
      if (currentStage === 'template') {
        setCurrentStage('guided');
        setShowInstructions(true);
        
        setTimeout(() => {
          try {
            if (audioContextRef.current) {
              const gainNode = audioContextRef.current.createGain();
              gainNode.gain.value = 0.3;
              gainNode.connect(audioContextRef.current.destination);
              
              // Play a pattern to indicate moving to next stage
              const transitionNotes = [330, 392, 440, 494]; // E4, G4, A4, B4 - ascending scale
              
              transitionNotes.forEach((freq, i) => {
                setTimeout(() => {
                  const osc = audioContextRef.current!.createOscillator();
                  osc.frequency.value = freq;
                  osc.connect(gainNode);
                  osc.start();
                  osc.stop(audioContextRef.current!.currentTime + 0.1);
                }, i * 150);
              });
            }
          } catch (error) {
            console.error('Error playing transition sounds:', error);
          }
        }, 300);
      } else {
        // Completed all stages
        // Play completion fanfare
        try {
          if (audioContextRef.current) {
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = 0.3;
            gainNode.connect(audioContextRef.current.destination);
            
            // Play a triumphant fanfare
            const fanfareNotes = [
              { note: 392, duration: 0.15 }, // G4
              { note: 392, duration: 0.15 }, // G4 
              { note: 440, duration: 0.3 },  // A4
              { note: 392, duration: 0.3 },  // G4
              { note: 523, duration: 0.3 },  // C5
              { note: 494, duration: 0.45 }  // B4
            ];
            
            let timeOffset = 0;
            fanfareNotes.forEach((noteInfo) => {
              setTimeout(() => {
                const osc = audioContextRef.current!.createOscillator();
                osc.frequency.value = noteInfo.note;
                osc.connect(gainNode);
                osc.start();
                osc.stop(audioContextRef.current!.currentTime + noteInfo.duration);
              }, timeOffset * 1000);
              
              timeOffset += noteInfo.duration + 0.05; // Small gap between notes
            });
          }
        } catch (error) {
          console.error('Error playing completion fanfare:', error);
        }
        
        // Calculate final score (weighted average)
        const finalScore = (
          scores.template * 0.4 + 
          score * 0.6
        );
        
        // Notify parent component
        if (onCompletion) {
          onCompletion(2, finalScore);
        }
      }
      
      setStageTransition(false);
    }, 2000);
  };
  
  const styles = stageStyles[currentStage];
  const content = stageContent[currentStage];
  
  // Initialize audio when instructions are closed
  const handleStartStage = () => {
    setShowInstructions(false);
    
    // Force audio initialization and try to play a sound
    initializeAudio();
    
    // Try to play a start sound
    try {
      if (audioContextRef.current) {
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0.3;
        gainNode.connect(audioContextRef.current.destination);
        
        // Play a "start" sound - short ascending pattern
        const startNotes = [330, 392, 440]; // E4, G4, A4
        
        startNotes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = audioContextRef.current!.createOscillator();
            osc.frequency.value = freq;
            osc.connect(gainNode);
            osc.start();
            osc.stop(audioContextRef.current!.currentTime + 0.1);
          }, i * 100);
        });
      }
    } catch (error) {
      console.error('Error playing start sound:', error);
    }
    
    // Provide haptic feedback
    if (haptic.isSupported) {
      haptic.vibrateCorrect();
    }
  };
  
  const handleAudioButtonClick = () => {
    // First initialize audio
    initializeAudio();
    
    // Play stage audio instructions
    playStageAudioInstructions(currentStage);
    
    // Vibrate to acknowledge the button press
    if (haptic.isSupported) {
      haptic.vibrateCorrect();
    }
  };
  
  if (!isClient) {
    return (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading handwriting module...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Audio initializer button - hidden but helps unlock audio */}
      <button 
        className="sr-only" 
        onClick={initializeAudio}
        aria-hidden="true"
      >
        Initialize Audio
      </button>
      
      {/* Stage indicator */}
      <div className={`w-full mb-6 rounded-lg overflow-hidden ${styles.light} shadow-sm`}>
        <div className={`${styles.color} py-2 px-4 text-white font-semibold flex items-center justify-between`}>
          <h2 className="text-lg font-bold">{content.icon} {content.title}</h2>
          <span className="text-sm opacity-90">Stage {currentStage === 'template' ? '1/2' : '2/2'}</span>
        </div>
        <div className="p-3">
          <p className="text-gray-700 font-medium">{content.shortInstructions}</p>
          <div className="flex items-center mt-2">
            <button 
              onClick={handleAudioButtonClick}
              className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-300 flex items-center"
              aria-label="Hear instructions"
            >
              <span className="mr-1 text-blue-500">🔊</span> 
              <span className="text-gray-700">Hear sound cue</span>
            </button>
            <div className={`ml-2 w-2 h-2 rounded-full ${audioInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>
      </div>
      
      {/* Instructions overlay */}
      {showInstructions && (
        <div className={`w-full ${styles.light} p-6 rounded-lg mb-6 shadow-md`}>
          <div className="flex items-center mb-4">
            <div className={`${styles.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl mr-4`}>
              {content.icon}
            </div>
            <div>
              <h3 className={`font-bold text-xl ${styles.text}`}>{content.title}</h3>
              <p className="text-gray-600 text-sm">{content.goal}</p>
            </div>
          </div>
          
          <div className="mb-6 space-y-3">
            <p className="text-gray-700">{content.fullInstructions}</p>
            
            {currentStage === 'template' && (
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mt-2">
                <li>Follow the dotted blue lines</li>
                <li>Complete all three strokes of the letter A</li>
                <li>The letter will vibrate when you're on the correct path</li>
              </ul>
            )}
            
            {currentStage === 'guided' && (
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mt-2">
                <li>Draw the letter from memory without the template</li>
                <li>You'll feel vibrations if you go off course</li>
                <li>Listen for audio cues for direction guidance</li>
                <li>Try to complete all three strokes of the letter A</li>
              </ul>
            )}
            
            <button 
              onClick={handleAudioButtonClick}
              className="w-full mt-3 py-2 bg-gray-100 border border-gray-300 rounded flex items-center justify-center gap-2 text-gray-700"
            >
              <span className="text-lg">🔊</span>
              Hear Sound Cue
            </button>
          </div>
          
          <button
            onClick={handleStartStage}
            className={`w-full py-3 ${styles.color} text-white rounded-lg font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center`}
            aria-label={`Start ${content.title}`}
          >
            Start {currentStage === 'template' ? 'Tracing' : 'Practice'}
          </button>
        </div>
      )}
      
      {/* Stage transition overlay */}
      {stageTransition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Stage Complete!</h3>
            <p className="text-gray-600 mb-3">Your score: {Math.round(scores[currentStage])}%</p>
            <p className="text-gray-600 mb-4">
              {currentStage === 'template' ? 'Moving to guided practice...' : 'All stages complete!'}
            </p>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full animate-progress-bar" style={{width: '100%'}}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Canvas component */}
      {!showInstructions && !stageTransition && (
        <div className="w-full">
          <TraceCanvas
            letter={letter}
            mode={currentStage}
            onComplete={handleStageComplete}
            width={300}
            height={300}
          />
        </div>
      )}
      
      {/* Progress indicators */}
      <div className="flex justify-center gap-4 mt-8 w-full max-w-xs">
        <div className={`flex-1 h-3 rounded-full ${currentStage === 'template' ? styles.color : scores.template > 0 ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden="true"></div>
        <div className={`flex-1 h-3 rounded-full ${currentStage === 'guided' ? styles.color : scores.guided > 0 ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden="true"></div>
      </div>
      
      {/* Accessible progress status for screen readers */}
      <div className="sr-only" aria-live="polite">
        {`Currently in ${content.title}. Progress: ${
          currentStage === 'template' ? '1 of 2' : '2 of 2'
        } stages.`}
      </div>
      
      {/* Audio controls */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center text-xs text-gray-500">
          <span className={`inline-block w-2 h-2 rounded-full ${audioInitialized ? 'bg-green-500' : 'bg-red-500'} mr-1`}></span>
          Sound: {audioInitialized ? 'Working' : 'Not working'}
          {!audioInitialized && (
            <button 
              onClick={initializeAudio}
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Enable Sound
            </button>
          )}
        </div>
        
        <button 
          onClick={handleAudioButtonClick}
          className="mt-2 px-3 py-1 bg-gray-100 border border-gray-300 rounded text-xs flex items-center"
        >
          <span className="mr-1">🔊</span> Play Sound Cue
        </button>
      </div>
    </div>
  );
};

export default HandwritingModule;

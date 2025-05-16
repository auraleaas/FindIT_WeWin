'use client';

// Haptic feedback patterns based on the research - INCREASED INTENSITY
export const HAPTIC_PATTERNS = {
  UP: [120, 30, 120], // Doubled from [60, 20, 60]
  DOWN: [200, 30, 200], // Increased from [120, 20, 120]
  LEFT: [120, 30, 200], // Increased from [60, 20, 120]
  RIGHT: [200, 30, 120], // Increased from [120, 20, 60]
  CORRECT: [80], // Increased from 30 - stronger feedback for correct moves
  ERROR: [150, 50, 150, 50, 150], // Increased from [100, 50, 100, 50, 100]
  SUCCESS: [100, 50, 100, 50, 200, 50, 100, 50, 100], // Increased from [50, 30, 50, 30, 100, 30, 50, 30, 50]
};

export type DirectionType = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * Hook to use haptic feedback on supported devices with stronger vibration
 */
export function useHaptic() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = (pattern: number[] | number) => {
    if (isSupported) {
      try {
        navigator.vibrate(pattern);
        
        // For iOS devices that partially support vibration
        // Add a double attempt with a slight delay
        setTimeout(() => {
          try {
            navigator.vibrate(0); // Stop any existing vibration
            navigator.vibrate(pattern); // Try again
          } catch (error) {
            // Ignore errors on second attempt
          }
        }, 10);
      } catch (error) {
        console.error('Failed to vibrate:', error);
      }
    }
  };

  const vibrateDirection = (direction: DirectionType) => {
    vibrate(HAPTIC_PATTERNS[direction]);
  };

  const vibrateCorrect = () => {
    vibrate(HAPTIC_PATTERNS.CORRECT);
  };

  const vibrateError = () => {
    vibrate(HAPTIC_PATTERNS.ERROR);
  };

  const vibrateSuccess = () => {
    vibrate(HAPTIC_PATTERNS.SUCCESS);
  };

  return {
    isSupported,
    vibrate,
    vibrateDirection,
    vibrateCorrect,
    vibrateError,
    vibrateSuccess,
  };
}

'use client';

import { useEffect, useRef, useState } from 'react';

type Position = {
  x: number;
  y: number;
  z: number;
};

type SpatialAudioOptions = {
  enableSpeech?: boolean;
};

/**
 * Hook to create spatial audio cues
 */
export function useSpatialAudio(options: SpatialAudioOptions = {}) {
  const { enableSpeech = true } = options;
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioInitializedRef = useRef<boolean>(false);
  
  // Cache for pre-compiled speech utterances
  const speechCacheRef = useRef<Record<string, SpeechSynthesisUtterance>>({});
  const [isSupported, setIsSupported] = useState(false);

  // Initialize audio on first interaction
  const initAudio = () => {
    if (audioInitializedRef.current) return true;
    
    try {
      // Check for AudioContext support
      if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) {
        return false;
      }
      
      // Create the audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Force resume (needed for iOS)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Attempt to actually play a sound to unlock audio (needed for mobile browsers)
      const buffer = audioContextRef.current.createBuffer(1, 441, 44100);
      const bufferSource = audioContextRef.current.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect(audioContextRef.current.destination);
      bufferSource.start();
      
      // Create panner node for spatial positioning
      pannerRef.current = audioContextRef.current.createPanner();
      pannerRef.current.panningModel = 'HRTF'; // Head-related transfer function for realistic 3D sound
      pannerRef.current.distanceModel = 'inverse'; // Volume decreases with distance
      pannerRef.current.refDistance = 1;
      pannerRef.current.maxDistance = 10000;
      pannerRef.current.rolloffFactor = 1;
      pannerRef.current.coneInnerAngle = 360;
      pannerRef.current.coneOuterAngle = 360;
      pannerRef.current.coneOuterGain = 0;
      
      // Set initial position (directly in front of listener)
      pannerRef.current.positionX.value = 0;
      pannerRef.current.positionY.value = 0;
      pannerRef.current.positionZ.value = -1; // 1 meter in front
      
      // Create gain node to control volume
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.5; // 50% volume
      
      // Connect nodes
      pannerRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      // Initialize speech synthesis if enabled
      if (enableSpeech && 'speechSynthesis' in window) {
        speechSynthRef.current = new SpeechSynthesisUtterance();
        speechSynthRef.current.volume = 1;
        speechSynthRef.current.rate = 1;
        speechSynthRef.current.pitch = 1;
        
        // Force speech synthesis to initialize with an empty utterance
        const emptyUtterance = new SpeechSynthesisUtterance(' ');
        window.speechSynthesis.speak(emptyUtterance);
      }
      
      audioInitializedRef.current = true;
      setIsSupported(true);
      console.log('Audio context successfully initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  };
  
  useEffect(() => {
    initAudio();
    const unlockAudio = () => {
      initAudio();
    };
    
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [enableSpeech]);
  
  // Play a click at the specified 3D position
  const playClickAt = (position: Position) => {
    if (!initAudio()) return;
    
    // Resume audio context if it's suspended (needed for iOS/Safari)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    try {
      // Set panner position
      if (pannerRef.current) {
        pannerRef.current.positionX.value = position.x;
        pannerRef.current.positionY.value = position.y;
        pannerRef.current.positionZ.value = position.z;
      }
      
      // Create and connect oscillator
      if (audioContextRef.current) {
        // Create a higher volume oscillator
        const oscillator = audioContextRef.current.createOscillator();
        oscillatorRef.current = oscillator;
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 note
        
        // Create a gain node for this sound with higher volume
        const soundGain = audioContextRef.current.createGain();
        soundGain.gain.value = 0.8; // Louder for mobile
        
        // Connect through both gain nodes
        oscillator.connect(soundGain);
        if (pannerRef.current) {
          soundGain.connect(pannerRef.current);
        } else {
          soundGain.connect(audioContextRef.current.destination);
        }
        
        // Start and stop after short duration (click sound)
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.1);
      }
    } catch (error) {
      console.error('Error playing click sound:', error);
    }
  };
  
  // Play directional audio cue
  const playDirectionalCue = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!initAudio()) return;
    
    let position: Position = { x: 0, y: 0, z: -1 };
    
    switch (direction) {
      case 'up':
        position = { x: 0, y: 1, z: -1 };
        break;
      case 'down':
        position = { x: 0, y: -1, z: -1 };
        break;
      case 'left':
        position = { x: -1, y: 0, z: -1 };
        break;
      case 'right':
        position = { x: 1, y: 0, z: -1 };
        break;
    }
    
    playClickAt(position);
    
    if (enableSpeech && window.speechSynthesis) {
      speak(direction);
    }
    
    try {
      if (audioContextRef.current) {
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0.8; // Higher volume
        
        // Different frequencies for different directions
        switch (direction) {
          case 'up': oscillator.frequency.value = 880; break; // Higher pitch
          case 'down': oscillator.frequency.value = 220; break; // Lower pitch
          case 'left': oscillator.frequency.value = 330; break; // Mid-low pitch
          case 'right': oscillator.frequency.value = 660; break; // Mid-high pitch
        }
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.2);
      }
    } catch (error) {
      console.error('Error playing directional tone:', error);
    }
  };
  
  // Speak text using speech synthesis
  const speak = (text: string, priority = false) => {
    if (!enableSpeech || !('speechSynthesis' in window)) return;
    
    // First try to initialize audio if not already done
    initAudio();
    
    try {
      // Use cached utterance or create a new one
      let utterance: SpeechSynthesisUtterance;
      
      if (speechCacheRef.current[text]) {
        utterance = speechCacheRef.current[text];
      } else {
        utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1;
        utterance.rate = 1;
        utterance.pitch = 1;
        
        // Cache for future use
        speechCacheRef.current[text] = utterance;
      }
      
      // Cancel current speech if this is high priority
      if (priority && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      window.speechSynthesis.speak(utterance);
      
      // Also play a tone to ensure some audio feedback happens
      try {
        if (audioContextRef.current) {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 0.3;
          oscillator.frequency.value = 440; // A4 note
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          oscillator.start();
          oscillator.stop(audioContextRef.current.currentTime + 0.1);
        }
      } catch (e) {
        // Ignore errors with the audio context
      }
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };
  
  return {
    playClickAt,
    playDirectionalCue,
    speak,
    isSupported: isSupported,
    initAudio
  };
}

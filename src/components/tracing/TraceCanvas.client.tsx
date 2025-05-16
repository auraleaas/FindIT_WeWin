'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useHaptic } from './useHaptic';
import { useSpatialAudio } from './useSpatialAudio';

interface TraceCanvasProps {
  letter: string;
  mode: 'template' | 'guided';
  onComplete?: (score: number) => void;
  width?: number;
  height?: number;
}

// SVG paths for each letter - CENTERED
const LETTER_PATHS: Record<string, string> = {
  'A': `
    <path d="M150,50 L100,200" fill="none" stroke="#4CD6C1" stroke-width="8" stroke-linecap="round" />
    <path d="M150,50 L200,200" fill="none" stroke="#4CD6C1" stroke-width="8" stroke-linecap="round" />
    <path d="M115,140 L185,140" fill="none" stroke="#4CD6C1" stroke-width="8" stroke-linecap="round" />
  `
};

// Reference paths for each letter - CENTERED
const REFERENCE_PATHS: Record<string, any[][]> = {
  'A': [
    // Main diagonal stroke from bottom left to top center
    [
      { x: 100, y: 200 }, // Bottom left
      { x: 125, y: 125 }, // Middle point
      { x: 150, y: 50 },  // Top center
    ],
    // Main diagonal stroke from top center to bottom right
    [
      { x: 150, y: 50 },  // Top center
      { x: 175, y: 125 }, // Middle point
      { x: 200, y: 200 }, // Bottom right
    ],
    // Horizontal crossing stroke
    [
      { x: 115, y: 140 }, // Middle left
      { x: 150, y: 140 }, // Center
      { x: 185, y: 140 }, // Middle right
    ]
  ]
};

export const TraceCanvas: React.FC<TraceCanvasProps> = ({
  letter = 'A',
  mode = 'template',
  onComplete,
  width = 300,
  height = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const canvasTransferredRef = useRef<boolean>(false);
  const currentStrokeIdRef = useRef<string | null>(null);
  const currentStrokePointsRef = useRef<{x: number, y: number, timestamp: number}[]>([]);
  const allStrokesRef = useRef<{x: number, y: number, timestamp: number}[][]>([]);
  const completedPathsRef = useRef<number[]>([]);
  const pathCoverageRef = useRef<Record<number, number[]>>({0: [], 1: [], 2: []});
  const lastVibrationTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [strokeCount, setStrokeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [usingFallback, setUsingFallback] = useState(true); // Default to fallback mode
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastPosition, setLastPosition] = useState<{x: number, y: number} | null>(null);
  const [eventsFired, setEventsFired] = useState<{type: string, timestamp: number}[]>([]);
  const [pathVisibility, setPathVisibility] = useState<boolean[]>([true, true, true]);
  const [lastDeviation, setLastDeviation] = useState<string | null>(null);
  
  const haptic = useHaptic();
  const audio = useSpatialAudio();

  // Add a debug log
  const addDebugLog = (message: string) => {
    setDebugLogs(prev => {
      const newLogs = [...prev, message];
      if (newLogs.length > 5) {
        return newLogs.slice(newLogs.length - 5);
      }
      return newLogs;
    });
    console.log(`[TraceCanvas] ${message}`);
  };
  
  // Initialize audio context to help with mobile audio
  const initializeAudio = () => {
    try {
      if (!audioContextRef.current && typeof window !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Attempt to resume the audio context (required for iOS)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        
        // Play a test sound to unlock audio
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0.2;
        oscillator.frequency.value = 440; // A4 note
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.2);
        
        // Also initialize the audio hook
        audio.initAudio();
        
        if (showDebug) {
          addDebugLog('Audio context initialized');
        }
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  // Check if a point is on any path
  const isPointOnAnyPath = (point: {x: number, y: number}): {
    onPath: boolean;
    distance: number;
    direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
  } => {
    // Skip for template mode
    if (mode === 'template') {
      return { onPath: true, distance: 0, direction: null };
    }
    
    const paths = REFERENCE_PATHS[letter] || [];
    let minDistance = Infinity;
    let closestDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;
    
    // Scale factor for the canvas
    const scaleX = width / 300;
    const scaleY = height / 300;
    
    // Scaled point
    const scaledPoint = {
      x: point.x / scaleX,
      y: point.y / scaleY
    };
    
    // Check distance to each path
    paths.forEach((path, pathIndex) => {
      // Skip completed paths
      if (completedPathsRef.current.includes(pathIndex)) return;
      
      // Check distance to each segment of the path
      for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i + 1];
        
        // Calculate distance to this segment
        const distance = distanceToSegment(scaledPoint, start, end);
        
        if (distance < minDistance) {
          minDistance = distance;
          
          // Calculate direction to guide towards the path if we're off
          if (distance > 15) { // Threshold for "off path" - LOWERED from 20 to 15
            const dirVec = closestPointOnSegment(scaledPoint, start, end);
            const dx = dirVec.x - scaledPoint.x;
            const dy = dirVec.y - scaledPoint.y;
            
            // Determine primary direction
            if (Math.abs(dx) > Math.abs(dy)) {
              closestDirection = dx > 0 ? 'RIGHT' : 'LEFT';
            } else {
              closestDirection = dy > 0 ? 'DOWN' : 'UP';
            }
          } else {
            closestDirection = null;
          }
        }
      }
    });
    
    // Consider on path if close enough
    const onPath = minDistance <= 15; // Threshold for "on path" - LOWERED from 20 to 15
    
    return {
      onPath,
      distance: minDistance,
      direction: closestDirection
    };
  };
  
  // Calculate distance from point to line segment
  const distanceToSegment = (
    point: {x: number, y: number},
    start: {x: number, y: number},
    end: {x: number, y: number}
  ): number => {
    const lineLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    if (lineLength === 0) return Infinity;
    
    // Calculate the projection of the point onto the line
    const t = (
      ((point.x - start.x) * (end.x - start.x)) + 
      ((point.y - start.y) * (end.y - start.y))
    ) / (lineLength * lineLength);
    
    // Clamp t to the segment
    const tClamped = Math.max(0, Math.min(1, t));
    
    // Calculate the closest point on the segment
    const closestX = start.x + tClamped * (end.x - start.x);
    const closestY = start.y + tClamped * (end.y - start.y);
    
    // Calculate distance from the point to the closest point on the segment
    return Math.sqrt(
      Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
    );
  };
  
  // Find closest point on segment
  const closestPointOnSegment = (
    point: {x: number, y: number},
    start: {x: number, y: number},
    end: {x: number, y: number}
  ): {x: number, y: number} => {
    const lineLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    if (lineLength === 0) return start;
    
    // Calculate the projection of the point onto the line
    const t = (
      ((point.x - start.x) * (end.x - start.x)) + 
      ((point.y - start.y) * (end.y - start.y))
    ) / (lineLength * lineLength);
    
    // Clamp t to the segment
    const tClamped = Math.max(0, Math.min(1, t));
    
    // Calculate the closest point on the segment
    return {
      x: start.x + tClamped * (end.x - start.x),
      y: start.y + tClamped * (end.y - start.y)
    };
  };

  // Calculate whether a point is close to a specific reference path segment
  const isPointNearPathSegment = (
    point: {x: number, y: number}, 
    start: {x: number, y: number}, 
    end: {x: number, y: number}
  ): boolean => {
    // Calculate the distance to the segment
    const distance = distanceToSegment(point, start, end);
    
    // Consider the point near the segment if the distance is less than a threshold
    return distance < 15; // 15px threshold (lowered from 20)
  };

  // Calculate stroke coverage of a reference path
  const calculatePathCoverage = (
    pathIndex: number, 
    stroke: {x: number, y: number, timestamp: number}[]
  ): number => {
    if (!stroke.length) return 0;
    
    const referencePath = REFERENCE_PATHS[letter][pathIndex];
    if (!referencePath || referencePath.length < 2) return 0;
    
    // Create segments from reference path
    const segments: Array<[{x: number, y: number}, {x: number, y: number}]> = [];
    for (let i = 0; i < referencePath.length - 1; i++) {
      segments.push([referencePath[i], referencePath[i + 1]]);
    }
    
    // Mark each segment as covered or not
    const segmentsCovered = new Array(segments.length).fill(false);
    
    // Check each point in the stroke
    stroke.forEach(point => {
      segments.forEach((segment, segmentIndex) => {
        if (isPointNearPathSegment(point, segment[0], segment[1])) {
          segmentsCovered[segmentIndex] = true;
          
          // Add segment coverage to the path coverage tracking
          if (!pathCoverageRef.current[pathIndex].includes(segmentIndex)) {
            pathCoverageRef.current[pathIndex].push(segmentIndex);
          }
        }
      });
    });
    
    // Calculate coverage percentage
    const coverageRatio = pathCoverageRef.current[pathIndex].length / segments.length;
    return coverageRatio * 100;
  };

  // Function to provide haptic and audio feedback for path deviation
  const provideDeviationFeedback = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const now = Date.now();
    
    // Only vibrate if enough time has passed since last vibration (150ms)
    if (now - lastVibrationTimeRef.current > 150) {
      if (showDebug) {
        addDebugLog(`Vibrating for direction: ${direction}`);
      }
      
      // Update last vibration time
      lastVibrationTimeRef.current = now;
      
      // Store last deviation for visualization
      setLastDeviation(direction);
      
      // Initialize audio if needed
      initializeAudio();
      
      // Provide haptic feedback
      if (haptic.isSupported) {
        haptic.vibrateDirection(direction);
        
        // Force a second vibration for emphasis
        setTimeout(() => {
          haptic.vibrateDirection(direction);
        }, 50);
      }
      
      // Provide audio feedback - play both a tone and speak the direction
      try {
        // Play a directional tone using the Web Audio API directly
        if (audioContextRef.current) {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 0.3; // Louder for mobile
          
          // Different frequencies for different directions
          switch (direction) {
            case 'UP': oscillator.frequency.value = 880; break; // Higher pitch
            case 'DOWN': oscillator.frequency.value = 220; break; // Lower pitch
            case 'LEFT': oscillator.frequency.value = 330; break; // Mid-low pitch
            case 'RIGHT': oscillator.frequency.value = 660; break; // Mid-high pitch
          }
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          oscillator.start();
          oscillator.stop(audioContextRef.current.currentTime + 0.2);
        }
      } catch (error) {
        console.error('Error playing tone:', error);
      }
      
      // Also use the spatial audio hook for speaking
      if (audio.isSupported) {
        audio.playDirectionalCue(direction.toLowerCase() as any);
        
        // Also speak the direction after a small delay
        setTimeout(() => {
          audio.speak(direction.toLowerCase(), false);
        }, 100);
      }
    }
  };

  // Fallback rendering function when OffscreenCanvas is not supported
  const renderFallback = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      addDebugLog('Failed to get 2D context');
      return;
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Scale coordinates for different canvas sizes
    const scaleX = width / 300;
    const scaleY = height / 300;
    
    // Draw reference paths if in template mode
    if (mode === 'template') {
      ctx.save();
      ctx.strokeStyle = '#4CD6C1';
      ctx.lineWidth = 8 * Math.min(scaleX, scaleY);
      ctx.lineCap = 'round';
      ctx.setLineDash([10, 10]);
      
      const paths = REFERENCE_PATHS[letter] || [];
      
      paths.forEach((path, index) => {
        // Skip drawing this path if it's already completed or should be hidden
        if (completedPathsRef.current.includes(index) || !pathVisibility[index]) return;
        
        ctx.beginPath();
        if (path.length > 0) {
          ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
          
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * scaleX, path[i].y * scaleY);
          }
          
          ctx.stroke();
        }
      });
      
      ctx.restore();
    }
    
    // Draw all completed strokes
    ctx.save();
    ctx.strokeStyle = mode === 'template' ? '#000000' : '#6B46C1'; // Purple for guided mode
    ctx.lineWidth = 6 * Math.min(scaleX, scaleY);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    allStrokesRef.current.forEach(points => {
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.stroke();
      }
    });
    ctx.restore();
    
    // Draw current stroke
    if (currentStrokePointsRef.current.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = mode === 'template' ? '#000000' : '#6B46C1'; // Purple for guided mode
      ctx.lineWidth = 6 * Math.min(scaleX, scaleY);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const points = currentStrokePointsRef.current;
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.stroke();
    }
    
    // Draw last touch/click position as a circle for debugging
    if (lastPosition && showDebug) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.arc(lastPosition.x, lastPosition.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Visualize direction arrow for deviation in debug mode
    if (lastDeviation && showDebug && lastPosition) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lastPosition.x, lastPosition.y);
      
      let dx = 0, dy = 0;
      switch (lastDeviation) {
        case 'UP': dy = -30; break;
        case 'DOWN': dy = 30; break;
        case 'LEFT': dx = -30; break;
        case 'RIGHT': dx = 30; break;
      }
      
      ctx.lineTo(lastPosition.x + dx, lastPosition.y + dy);
      ctx.stroke();
      
      // Draw arrowhead
      const arrowSize = 10;
      ctx.beginPath();
      if (lastDeviation === 'UP') {
        ctx.moveTo(lastPosition.x - arrowSize, lastPosition.y - arrowSize*1.5);
        ctx.lineTo(lastPosition.x, lastPosition.y - arrowSize*3);
        ctx.lineTo(lastPosition.x + arrowSize, lastPosition.y - arrowSize*1.5);
      } else if (lastDeviation === 'DOWN') {
        ctx.moveTo(lastPosition.x - arrowSize, lastPosition.y + arrowSize*1.5);
        ctx.lineTo(lastPosition.x, lastPosition.y + arrowSize*3);
        ctx.lineTo(lastPosition.x + arrowSize, lastPosition.y + arrowSize*1.5);
      } else if (lastDeviation === 'LEFT') {
        ctx.moveTo(lastPosition.x - arrowSize*3, lastPosition.y);
        ctx.lineTo(lastPosition.x - arrowSize*1.5, lastPosition.y - arrowSize);
        ctx.lineTo(lastPosition.x - arrowSize*1.5, lastPosition.y + arrowSize);
      } else if (lastDeviation === 'RIGHT') {
        ctx.moveTo(lastPosition.x + arrowSize*3, lastPosition.y);
        ctx.lineTo(lastPosition.x + arrowSize*1.5, lastPosition.y - arrowSize);
        ctx.lineTo(lastPosition.x + arrowSize*1.5, lastPosition.y + arrowSize);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fill();
      
      ctx.restore();
    }
    
    // Draw path coverage visualization for debugging
    if (showDebug) {
      ctx.save();
      Object.entries(pathCoverageRef.current).forEach(([pathIdx, segments]) => {
        const pathIndex = parseInt(pathIdx);
        const referencePath = REFERENCE_PATHS[letter][pathIndex];
        
        if (!referencePath || referencePath.length < 2) return;
        
        for (let i = 0; i < segments.length; i++) {
          const segmentIndex = segments[i];
          if (segmentIndex < referencePath.length - 1) {
            const start = referencePath[segmentIndex];
            const end = referencePath[segmentIndex + 1];
            
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 10 * Math.min(scaleX, scaleY);
            ctx.moveTo(start.x * scaleX, start.y * scaleY);
            ctx.lineTo(end.x * scaleX, end.y * scaleY);
            ctx.stroke();
          }
        }
      });
      ctx.restore();
    }
  };
  
  // Simple distance calculation for fallback mode
  const calculateDistance = (point1: {x: number, y: number}, point2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };
  
  // Improved stroke evaluation for fallback mode
  const evaluateStrokeFallback = () => {
    // Need at least 10 points for a valid stroke (prevents tapping)
    if (currentStrokePointsRef.current.length < 10) {
      return { score: 0, complete: false, pathIndex: -1 };
    }
    
    // Calculate stroke length to prevent simple taps
    let strokeLength = 0;
    for (let i = 1; i < currentStrokePointsRef.current.length; i++) {
      const p1 = currentStrokePointsRef.current[i-1];
      const p2 = currentStrokePointsRef.current[i];
      strokeLength += calculateDistance(p1, p2);
    }
    
    // Stroke must be at least 40px long to be valid
    if (strokeLength < 40) {
      return { score: 0, complete: false, pathIndex: -1 };
    }
    
    const userStroke = currentStrokePointsRef.current;
    const referencePaths = REFERENCE_PATHS[letter] || [];
    
    // Find the closest reference path that hasn't been completed yet
    let bestMatchIndex = -1;
    let bestMatchScore = 0; // Higher is better now
    
    referencePaths.forEach((referencePath, index) => {
      // Skip already completed paths
      if (completedPathsRef.current.includes(index)) return;
      
      // Calculate path coverage for this stroke
      const coverage = calculatePathCoverage(index, userStroke);
      
      // Find the best match based on coverage
      if (coverage > bestMatchScore) {
        bestMatchScore = coverage;
        bestMatchIndex = index;
      }
    });
    
    // No matching path found or all paths completed
    if (bestMatchIndex === -1) {
      return { score: 0, complete: false, pathIndex: -1 };
    }
    
    // Determine if the stroke completes a reference path (requires 70% coverage)
    const pathComplete = bestMatchScore >= 70;
    
    return {
      score: bestMatchScore,
      complete: pathComplete,
      pathIndex: bestMatchIndex
    };
  };

  // Effect for initializing the canvas in fallback mode
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Try to detect if OffscreenCanvas is supported
    try {
      const offscreenSupported = 
        typeof window !== 'undefined' && 
        'OffscreenCanvas' in window &&
        canvasRef.current && 
        'transferControlToOffscreen' in canvasRef.current;
      
      // Log the support status
      if (showDebug) {
        addDebugLog(`OffscreenCanvas supported: ${offscreenSupported}`);
      }
      
      if (!offscreenSupported) {
        setUsingFallback(true);
      }
    } catch (error) {
      if (showDebug) {
        addDebugLog(`Error detecting OffscreenCanvas: ${error instanceof Error ? error.message : String(error)}`);
      }
      setUsingFallback(true);
    }
    
    // Reset state on mount
    currentStrokeIdRef.current = null;
    currentStrokePointsRef.current = [];
    allStrokesRef.current = [];
    completedPathsRef.current = [];
    pathCoverageRef.current = {0: [], 1: [], 2: []};
    setStrokeCount(0);
    setIsComplete(false);
    setScore(0);
    setPathVisibility([true, true, true]);
    
    // Initialize canvas
    renderFallback();
    
    // Initialize audio
    initializeAudio();
    
  }, []);

  // Effect for initializing audio on first interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudio();
    };
    
    // Add event listeners for user interaction to initialize audio
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Effect for resetting state when mode changes
  useEffect(() => {
    // Reset state when mode changes
    currentStrokeIdRef.current = null;
    currentStrokePointsRef.current = [];
    allStrokesRef.current = [];
    completedPathsRef.current = [];
    pathCoverageRef.current = {0: [], 1: [], 2: []};
    setStrokeCount(0);
    setIsComplete(false);
    setScore(0);
    setPathVisibility([true, true, true]);
    
    if (usingFallback) {
      renderFallback();
    } else if (workerRef.current && canvasTransferredRef.current) {
      workerRef.current.postMessage({
        type: 'clear',
        data: {
          showTemplate: mode === 'template'
        }
      });
      
      workerRef.current.postMessage({
        type: 'setLetter',
        data: { letter }
      });
    }
  }, [mode, letter]);
  
  // Handle pointer events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default to ensure we capture all events
    
    if (isComplete) return;
    
    setIsDrawing(true);
    
    // Try to initialize audio on first interaction
    initializeAudio();
    
    // Log the event for debugging
    if (showDebug) {
      setEventsFired(prev => [...prev.slice(-4), { type: 'pointerdown', timestamp: Date.now() }]);
    }
    
    // Get the point relative to the canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
      timestamp: Date.now()
    };
    
    // Update last position for debugging
    setLastPosition({ x: point.x, y: point.y });
    
    if (showDebug) {
      addDebugLog(`Pointer down at ${Math.round(point.x)},${Math.round(point.y)}`);
    }
    
    if (usingFallback) {
      // Fallback handling
      currentStrokeIdRef.current = Math.random().toString(36).substring(2, 9);
      currentStrokePointsRef.current = [{ x: point.x, y: point.y, timestamp: point.timestamp }];
      renderFallback();
    } else if (workerRef.current) {
      // Worker-based handling
      // Generate a unique ID for this stroke
      currentStrokeIdRef.current = Math.random().toString(36).substring(2, 9);
      
      // Start the stroke in the worker
      workerRef.current.postMessage({
        type: 'startStroke',
        data: {
          id: currentStrokeIdRef.current,
          point
        }
      });
    }
    
    // Provide haptic feedback
    if (haptic.isSupported) {
      haptic.vibrateCorrect();
    }
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default to ensure we capture all events
    
    if (!isDrawing || !currentStrokeIdRef.current || isComplete) return;
    
    // Log the event for debugging (only occasionally to avoid spamming)
    if (showDebug && Math.random() < 0.1) {
      setEventsFired(prev => [...prev.slice(-4), { type: 'pointermove', timestamp: Date.now() }]);
    }
    
    // Get the point relative to the canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
      timestamp: Date.now()
    };
    
    // Update last position for debugging
    setLastPosition({ x: point.x, y: point.y });
    
    if (usingFallback) {
      // Fallback handling
      currentStrokePointsRef.current.push({ x: point.x, y: point.y, timestamp: point.timestamp });
      
      // In guided mode, check if the point is on the path
      if (mode === 'guided') {
        const pathStatus = isPointOnAnyPath(point);
        
        // If not on path and we have a direction, provide feedback
        if (!pathStatus.onPath && pathStatus.direction) {
          provideDeviationFeedback(pathStatus.direction);
        }
      }
      
      renderFallback();
    } else if (workerRef.current) {
      // Worker-based handling
      // Update the stroke in the worker
      workerRef.current.postMessage({
        type: 'updateStroke',
        data: {
          id: currentStrokeIdRef.current,
          point
        }
      });
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default to ensure we capture all events
    
    if (!isDrawing || !currentStrokeIdRef.current || isComplete) return;
    
    setIsDrawing(false);
    
    // Reset last deviation
    setLastDeviation(null);
    
    // Log the event for debugging
    if (showDebug) {
      setEventsFired(prev => [...prev.slice(-4), { type: 'pointerup', timestamp: Date.now() }]);
      addDebugLog(`Pointer up - stroke completed`);
    }
    
    if (usingFallback) {
      // Fallback handling - evaluate the stroke
      const result = evaluateStrokeFallback();
      
      // Add current stroke to all strokes if it has points
      if (currentStrokePointsRef.current.length > 0) {
        allStrokesRef.current.push([...currentStrokePointsRef.current]);
      }
      
      if (result.complete && result.pathIndex >= 0) {
        // Mark this path as completed
        if (!completedPathsRef.current.includes(result.pathIndex)) {
          completedPathsRef.current.push(result.pathIndex);
          
          // Hide the completed path in template mode
          if (mode === 'template') {
            setPathVisibility(prev => {
              const newVisibility = [...prev];
              newVisibility[result.pathIndex] = false;
              return newVisibility;
            });
          }
          
          setStrokeCount(prev => prev + 1);
          setScore(prev => (prev + result.score) / 2); // Average with previous score
          
          // Provide success feedback
          if (haptic.isSupported) {
            haptic.vibrateCorrect();
          }
          
          // Play a success sound
          try {
            if (audioContextRef.current) {
              const oscillator = audioContextRef.current.createOscillator();
              const gainNode = audioContextRef.current.createGain();
              gainNode.gain.value = 0.3;
              oscillator.frequency.value = 659.25; // E5 note - happy sound
              oscillator.connect(gainNode);
              gainNode.connect(audioContextRef.current.destination);
              oscillator.start();
              oscillator.stop(audioContextRef.current.currentTime + 0.2);
              
              // Play a second note for a happy sound
              setTimeout(() => {
                const oscillator2 = audioContextRef.current!.createOscillator();
                oscillator2.frequency.value = 783.99; // G5 note
                oscillator2.connect(gainNode);
                oscillator2.start();
                oscillator2.stop(audioContextRef.current!.currentTime + 0.2);
              }, 200);
            }
          } catch (error) {
            console.error('Error playing success sound:', error);
          }
          
          if (audio.isSupported) {
            audio.speak('Good stroke!', false);
          }
        }
        
        // Check if all strokes are complete (3 paths for letter A)
        if (completedPathsRef.current.length >= 3) {
          setIsComplete(true);
          
          if (haptic.isSupported) {
            haptic.vibrateSuccess();
          }
          
          // Play completion sound
          try {
            if (audioContextRef.current) {
              // Create a sequence of notes for completion
              const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
              const gainNode = audioContextRef.current.createGain();
              gainNode.gain.value = 0.3;
              gainNode.connect(audioContextRef.current.destination);
              
              notes.forEach((freq, i) => {
                setTimeout(() => {
                  const oscillator = audioContextRef.current!.createOscillator();
                  oscillator.frequency.value = freq;
                  oscillator.connect(gainNode);
                  oscillator.start();
                  oscillator.stop(audioContextRef.current!.currentTime + 0.2);
                }, i * 200);
              });
            }
          } catch (error) {
            console.error('Error playing completion sound:', error);
          }
          
          if (audio.isSupported) {
            audio.speak('Good job! Letter A complete.', true);
          }
          
          if (onComplete) {
            onComplete(result.score);
          }
        }
      }
      
      // Clear current stroke data for next stroke
      currentStrokeIdRef.current = null;
      currentStrokePointsRef.current = [];
      renderFallback();
    } else if (workerRef.current) {
      // Worker-based handling
      // End the stroke in the worker
      workerRef.current.postMessage({
        type: 'endStroke',
        data: {
          id: currentStrokeIdRef.current
        }
      });
      
      // Reset the current stroke ID
      currentStrokeIdRef.current = null;
    }
  };
  
  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Log the event for debugging
    if (showDebug) {
      setEventsFired(prev => [...prev.slice(-4), { type: 'pointercancel', timestamp: Date.now() }]);
      addDebugLog('Pointer cancelled');
    }
    
    setIsDrawing(false);
    currentStrokeIdRef.current = null;
    
    // Reset last deviation
    setLastDeviation(null);
    
    if (usingFallback) {
      currentStrokePointsRef.current = [];
      renderFallback();
    }
  };
  
  const handleReset = () => {
    if (showDebug) {
      addDebugLog('Reset button clicked');
    }
    
    // Reset last deviation
    setLastDeviation(null);
    
    if (usingFallback) {
      // Fallback handling
      currentStrokeIdRef.current = null;
      currentStrokePointsRef.current = [];
      allStrokesRef.current = [];
      completedPathsRef.current = [];
      pathCoverageRef.current = {0: [], 1: [], 2: []};
      setStrokeCount(0);
      setIsComplete(false);
      setScore(0);
      setPathVisibility([true, true, true]);
      renderFallback();
    } else if (workerRef.current) {
      // Worker-based handling
      // Clear the canvas and reset state
      workerRef.current.postMessage({
        type: 'clear',
        data: {
          showTemplate: mode === 'template'
        }
      });
      
      setStrokeCount(0);
      setIsComplete(false);
      setScore(0);
    }
    
    // Try to play a reset sound
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
    } catch (error) {
      console.error('Error playing reset sound:', error);
    }
    
    // Announce for screen readers
    if (audio.isSupported) {
      audio.speak('Canvas cleared. Try again.', true);
    }
  };

  // Get the button color based on the mode
  const getButtonColor = () => {
    switch (mode) {
      case 'template':
        return 'bg-blue-500';
      case 'guided':
        return 'bg-purple-600';
      default:
        return 'bg-blue-500';
    }
  };
  
  return (
    <section aria-live="polite" className="flex flex-col items-center gap-4">
      {/* Hidden audio initializer button */}
      <button 
        className="sr-only" 
        onClick={initializeAudio}
        aria-hidden="true"
      >
        Initialize Audio
      </button>
      
      <div className="relative">
        {/* Canvas for drawing */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-gray-300 rounded-lg touch-none"
          style={{ touchAction: 'none' }} // Disable browser-handled touch actions
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerUp}
          role="img"
          aria-label={`Drawing canvas for letter ${letter}`}
        />
        
        {/* Completion overlay */}
        {isComplete && (
          <div className="absolute inset-0 bg-green-100 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-green-600">Great job!</h3>
              <p className="text-gray-700">You completed letter {letter}!</p>
              <p className="text-gray-700">Score: {Math.round(score)}%</p>
              <button
                onClick={() => {
                  initializeAudio(); // Try to initialize audio
                  onComplete && onComplete(score);
                }}
                className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg w-full"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        {showDebug && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 max-h-40 overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>Mode: <span className="font-bold">{usingFallback ? 'Fallback' : 'Worker'}</span></div>
              <button 
                onClick={() => setShowDebug(false)}
                className="text-xs bg-red-500 px-2 py-0.5 rounded"
              >
                Close Debug
              </button>
            </div>
            <div className="mt-1">Drawing: {isDrawing ? 'Yes' : 'No'}</div>
            <div>Strokes: {strokeCount}</div>
            <div>Completed Paths: {completedPathsRef.current.join(', ')}</div>
            <div>Last Deviation: {lastDeviation || 'None'}</div>
            <div>Haptic Support: {haptic.isSupported ? 'Yes' : 'No'}</div>
            <div>Audio Context: {audioContextRef.current ? 'Created' : 'Not created'}</div>
            <div>Path Coverage: {
              Object.entries(pathCoverageRef.current).map(([pathIdx, segments]) => 
                `Path ${pathIdx}: ${segments.length} segments (${Math.round(segments.length / (REFERENCE_PATHS[letter][parseInt(pathIdx)].length - 1) * 100)}%)`
              ).join(', ')
            }</div>
            <div>Events:</div>
            <div className="text-xs text-gray-300 ml-2">
              {eventsFired.map((event, i) => (
                <div key={i}>{event.type} at {new Date(event.timestamp).toLocaleTimeString()}</div>
              ))}
            </div>
            <div>Logs:</div>
            <div className="text-xs text-gray-300 ml-2">
              {debugLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Debug toggle button (always visible) */}
        {!showDebug && (
          <button 
            onClick={() => setShowDebug(true)} 
            className="absolute bottom-0 right-0 bg-gray-800 text-white text-xs px-2 py-1 m-1 rounded-full opacity-50 hover:opacity-100"
          >
            Debug
          </button>
        )}
      </div>
      
      {/* Status and info */}
      <div className="w-full text-center">
        {mode === 'template' && (
          <p className="text-sm text-gray-600 mb-2">
            Trace along the dotted lines to complete the letter
          </p>
        )}
        {mode === 'guided' && (
          <p className="text-sm text-gray-600 mb-2">
            Draw from memory - you'll feel vibrations when you go off track
          </p>
        )}
        
        <p className="text-xs text-gray-500 mb-3">
          Strokes completed: {strokeCount}/3
        </p>
      </div>
      
      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handleReset}
          className={`px-4 py-2 ${getButtonColor()} text-white rounded-lg`}
          aria-label="Reset canvas"
        >
          Reset
        </button>
        
        {isComplete && onComplete && (
          <button
            onClick={() => {
              initializeAudio(); // Try to initialize audio
              onComplete(score);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg"
            aria-label="Continue to next level"
          >
            Continue
          </button>
        )}
      </div>
      
      {/* Status for screen readers */}
      <div className="sr-only" aria-live="polite">
        {isComplete 
          ? `Letter ${letter} completed with a score of ${Math.round(score)}%.` 
          : `Drawing letter ${letter}. ${3 - strokeCount} strokes remaining.`}
      </div>
    </section>
  );
};

export default TraceCanvas;

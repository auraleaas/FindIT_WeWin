// Interface for stroke points
export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

// Interface for stroke data
export interface Stroke {
  points: Point[];
  id: string;
}

// Reference paths (SVG path data simplified to points)
const REFERENCE_PATHS: Record<string, Point[][]> = {
  'A': [
    // Main diagonal stroke from bottom left to top
    [
      { x: 30, y: 100, timestamp: 0 },
      { x: 50, y: 50, timestamp: 100 },
      { x: 70, y: 0, timestamp: 200 },
    ],
    // Main diagonal stroke from top to bottom right
    [
      { x: 70, y: 0, timestamp: 0 },
      { x: 90, y: 50, timestamp: 100 },
      { x: 110, y: 100, timestamp: 200 },
    ],
    // Horizontal crossing stroke
    [
      { x: 40, y: 50, timestamp: 0 },
      { x: 70, y: 50, timestamp: 100 },
      { x: 100, y: 50, timestamp: 200 },
    ]
  ]
};

// Canvas and context for offscreen drawing
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// Store the current strokes
let currentStrokes: Stroke[] = [];
let currentLetter = 'A'; // Default to letter A

// Dynamic Time Warping algorithm for stroke comparison
function dtw(userPath: Point[], referencePath: Point[]): { 
  distance: number; 
  deviations: { point: Point, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' }[] 
} {
  // Simple DTW implementation
  // In a real implementation, this would be more complex and possibly compiled to WASM
  const matrix: number[][] = [];
  const deviations: { point: Point, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' }[] = [];
  
  // Initialize matrix
  for (let i = 0; i <= userPath.length; i++) {
    matrix[i] = [];
    for (let j = 0; j <= referencePath.length; j++) {
      if (matrix[i]) {
        // Use type assertion to assure TypeScript this is safe
        (matrix[i] as number[])[j] = i === 0 && j === 0 ? 0 : Infinity;
      }
    }
  }
  
  // Fill the matrix
  for (let i = 1; i <= userPath.length; i++) {
    for (let j = 1; j <= referencePath.length; j++) {
      const userPt = userPath[i-1];
      const refPt = referencePath[j-1];
      if (!userPt || !refPt || !matrix[i]) continue;
      
      const cost = Math.sqrt(
        Math.pow(userPt.x - refPt.x, 2) + 
        Math.pow(userPt.y - refPt.y, 2)
      );
      const minPrev = Math.min(
        matrix[i-1]?.[j] ?? Infinity,    // insertion
        matrix[i]?.[j-1] ?? Infinity,    // deletion
        matrix[i-1]?.[j-1] ?? Infinity   // match
      );
      
      // Ensure matrix[i] exists before assignment
      if (matrix[i]) {
        // Use type assertion to assure TypeScript this is safe
        (matrix[i] as number[])[j] = cost + minPrev;
      }
      
      // Check for significant deviation (more than 10px)
      if (cost > 20) {
        // Determine direction of deviation
        let direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
        const dx = refPt.x - userPt.x;
        const dy = refPt.y - userPt.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
          direction = dy > 0 ? 'DOWN' : 'UP';
        }
        deviations.push({ 
          point: userPt, 
          direction 
        });
      }
    }
  }
  return { 
    distance: matrix[userPath.length]?.[referencePath.length] ?? Infinity,
    deviations
  };
}

// Evaluate the user's stroke against the reference
function evaluateStroke(stroke: Stroke): {
  score: number;
  deviations: { point: Point, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' }[];
  complete: boolean;
} {
  // Determine which reference path this stroke is closest to
  let bestMatchIndex = 0;
  let bestMatchScore = Infinity;
  let bestDeviations: { point: Point, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' }[] = [];
  
  const referencePaths = REFERENCE_PATHS[currentLetter] || [];
  
  referencePaths.forEach((referencePath, index) => {
    const { distance, deviations } = dtw(stroke.points, referencePath);
    
    if (distance < bestMatchScore) {
      bestMatchScore = distance;
      bestMatchIndex = index;
      bestDeviations = deviations;
    }
  });
  
  // Normalize score to 0-100 range (lower distance = higher score)
  // This is a very simplified scoring - real implementation would be more sophisticated
  const normalizedScore = Math.max(0, 100 - bestMatchScore / 10);
  
  // Determine if the stroke completes a reference path
  // This is also simplified - a real implementation would be more sophisticated
  const pathComplete = normalizedScore > 70;
  
  return {
    score: normalizedScore,
    deviations: bestDeviations,
    complete: pathComplete
  };
}

// Setup the worker event listeners with ES module-friendly syntax
self.addEventListener('message', (event: MessageEvent) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'init':
      // Initialize the offscreen canvas
      canvas = data.canvas;
      ctx = canvas ? canvas.getContext('2d') as OffscreenCanvasRenderingContext2D : null;
      currentLetter = data.letter || 'A';
      
      // Set up the canvas
      if (ctx && canvas) {
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw reference paths if in template mode
        if (data.showTemplate) {
          drawReferencePaths();
        }
      }
      break;
      
    case 'startStroke':
      // Start a new stroke
      currentStrokes.push({
        points: [data.point],
        id: data.id
      });
      
      // Start drawing
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(data.point.x, data.point.y);
      }
      break;
      
    case 'updateStroke':
      // Find the stroke and add the point
      const strokeIndex = currentStrokes.findIndex(s => s.id === data.id);
      if (strokeIndex >= 0 && currentStrokes[strokeIndex]) {
        currentStrokes[strokeIndex].points.push(data.point);
        
        // Draw the line to this point
        if (ctx) {
          ctx.lineTo(data.point.x, data.point.y);
          ctx.stroke();
        }
        
        // Evaluate the stroke against the reference path
        const result = evaluateStroke(currentStrokes[strokeIndex]);
        
        // Send back any deviation feedback for haptic/audio cues
        if (result.deviations.length > 0) {
          self.postMessage({
            type: 'deviation',
            data: result.deviations[result.deviations.length - 1]
          });
        }
      }
      break;
      
    case 'endStroke':
      // Find the stroke
      const endStrokeIndex = currentStrokes.findIndex(s => s.id === data.id);
      if (endStrokeIndex >= 0 && currentStrokes[endStrokeIndex]) {
        // Finalize the stroke
        if (ctx) {
          ctx.stroke();
        }
        
        // Evaluate the final stroke
        const finalResult = evaluateStroke(currentStrokes[endStrokeIndex]);
        
        // Send back the evaluation results
        self.postMessage({
          type: 'evaluation',
          data: {
            strokeId: data.id,
            score: finalResult.score,
            complete: finalResult.complete
          }
        });
      }
      break;
      
    case 'clear':
      // Clear all strokes
      currentStrokes = [];
      
      // Clear the canvas
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw reference paths if in template mode
        if (data.showTemplate) {
          drawReferencePaths();
        }
      }
      break;
      
    case 'setLetter':
      // Set the current letter
      currentLetter = data.letter;
      break;
  }
});

// Helper function to draw reference paths
function drawReferencePaths() {
  if (!ctx || !canvas) return;
  
  const paths = REFERENCE_PATHS[currentLetter] || [];
  
  ctx.save();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  
  paths.forEach(path => {
    if (!ctx) return;
    ctx.beginPath();
    if (path.length > 0) {
      ctx.moveTo(path[0]?.x ?? 0, path[0]?.y ?? 0);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i]?.x ?? 0, path[i]?.y ?? 0);
      }
      
      ctx.stroke();
    }
  });
  
  ctx.restore();
}

// Make TypeScript happy with explicit exports
export { };

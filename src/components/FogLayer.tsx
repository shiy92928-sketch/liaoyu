import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { Loader2, Activity } from 'lucide-react';

export default function FogLayer({ 
  marThreshold = 0.25, 
  smoothingFactor = 0.55 
}: { 
  marThreshold?: number, 
  smoothingFactor?: number 
}) {
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [mouthPos, setMouthPos] = useState({ x: -100, y: -100 });
  const [isPenDown, setIsPenDown] = useState(false);
  const [isWipeActive, setIsWipeActive] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef({ x: -100, y: -100, isDown: false });
  const prevDrawPos = useRef<{ x: number, y: number } | null>(null);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();

  const isWipeActiveRef = useRef(false);
  const stableStartTimeRef = useRef(0);
  const lastHandPosRef = useRef({ x: -100, y: -100 });
  const isProcessingRef = useRef(false);
  const frameCountRef = useRef(0);

  const FOG_REGEN_SPEED = 0.0004; // Very slow decay of the wiped areas

  const interpolateAndDraw = (ctx: CanvasRenderingContext2D, p1: {x: number, y: number}, p2: {x: number, y: number}, isDown: boolean) => {
    if (!isDown) return;
    const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.floor(distance / 2));
    
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      
      const radGrad = ctx.createRadialGradient(x, y, 0, x, y, 35);
      radGrad.addColorStop(0, 'rgba(0,0,0,1)');
      radGrad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, 35, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const initAI = useCallback(async () => {
    if (showIntro) return; // Wait until intro is dismissed
    
    try {
      setStatus('Loading camera and hand tracking...');
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      const face = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      faceLandmarkerRef.current = face;

      const hand = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      handLandmarkerRef.current = hand;

      setStatus('Please allow camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
          setStatus('Ready');
        };
      }
    } catch (err) {
      console.error(err);
      setStatus('Please allow camera access.');
    }
  }, [showIntro]);

  useEffect(() => {
    if (!showIntro) {
      initAI();
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [initAI, showIntro]);

  useEffect(() => {
    if (!isReady) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Fill initial slight fog
    ctx.fillStyle = 'rgba(230, 235, 240, 0.92)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let lastVideoTime = -1;

    const tick = (now: number) => {
      requestRef.current = requestAnimationFrame(tick);
      
      const w = canvas.width;
      const h = canvas.height;

      // Regen fog slowly
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(230, 235, 240, ${FOG_REGEN_SPEED})`;
      ctx.fillRect(0, 0, w, h);

      if (video.readyState < 2) return;
      if (video.currentTime === lastVideoTime) return;
      if (isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      lastVideoTime = video.currentTime;
      frameCountRef.current++;

      let isCurrentFrameBreathing = false;
      let isCurrentFramePenDown = false;
      let targetX = cursorRef.current.x;
      let targetY = cursorRef.current.y;

      // Only check face every 4 frames for performance
      if (frameCountRef.current % 4 === 0) {
        const faceResult = faceLandmarkerRef.current?.detectForVideo(video, performance.now());
        if (faceResult && faceResult.faceLandmarks.length > 0) {
          const landmarks = faceResult.faceLandmarks[0];
          // Calculate MAR (Mouth Aspect Ratio) using landmarks
          const topLip = landmarks[13];
          const bottomLip = landmarks[14];
          const leftLip = landmarks[78];
          const rightLip = landmarks[308];

          const vertDist = Math.hypot(bottomLip.x - topLip.x, bottomLip.y - topLip.y);
          const horizDist = Math.hypot(rightLip.x - leftLip.x, rightLip.y - leftLip.y);
          const mar = vertDist / horizDist;

          // Also check distance (approximate by face box size)
          const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);

          if (mar > marThreshold && faceWidth > 0.15) {
            isCurrentFrameBreathing = true;
            // Add fog near mouth (mirrored)
            const mouthX = (1 - topLip.x) * w; 
            const mouthY = topLip.y * h;
            
            setMouthPos({ x: mouthX, y: mouthY });

            ctx.globalCompositeOperation = 'source-over';
            const fogGrad = ctx.createRadialGradient(mouthX, mouthY, 10, mouthX, mouthY, 350);
            fogGrad.addColorStop(0, 'rgba(230,235,240,0.15)');
            fogGrad.addColorStop(1, 'rgba(230,235,240,0)');
            ctx.fillStyle = fogGrad;
            ctx.beginPath();
            ctx.arc(mouthX, mouthY, 250, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Check hand every 2 frames for better performance but keeping it relatively real-time
      if (frameCountRef.current % 2 === 0 || frameCountRef.current % 2 !== 0) { // Keep hand tracking running to stay real-time
        const handResult = handLandmarkerRef.current?.detectForVideo(video, performance.now());
        if (handResult && handResult.landmarks.length > 0) {
          const landmarks = handResult.landmarks[0];
          const wrist = landmarks[0];
          const indexTip = landmarks[8];
          const indexDip = landmarks[7];
          const middleTip = landmarks[12];
          const middleDip = landmarks[11];

          const distIndex = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
          const distMiddle = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);

          // Pen down if index is extended and middle is curled
          if (distIndex > distMiddle * 1.25) {
            isCurrentFramePenDown = true;
          }

          targetX = (1 - indexTip.x) * w; // mirror
          targetY = indexTip.y * h;
        } else {
          prevDrawPos.current = null; // lost hand
        }
      }

      if (isCurrentFramePenDown) {
        if (!isWipeActiveRef.current) {
          const dist = Math.hypot(targetX - lastHandPosRef.current.x, targetY - lastHandPosRef.current.y);
          if (dist > 40 || stableStartTimeRef.current === 0) {
            // Reset timer if moved too much or just started
            stableStartTimeRef.current = performance.now();
            lastHandPosRef.current = { x: targetX, y: targetY };
          } else {
            const elapsed = performance.now() - stableStartTimeRef.current;
            if (elapsed > 400) { // Reduce required hold time to 400ms to be more responsive
              isWipeActiveRef.current = true;
            }
          }
        }
      } else {
        isWipeActiveRef.current = false;
        stableStartTimeRef.current = 0;
      }

      // Smooth cursor
      if (cursorRef.current.x === -100) {
        cursorRef.current.x = targetX;
        cursorRef.current.y = targetY;
      } else {
        cursorRef.current.x += (targetX - cursorRef.current.x) * smoothingFactor;
        cursorRef.current.y += (targetY - cursorRef.current.y) * smoothingFactor;
      }

      setCursorPos({ x: cursorRef.current.x, y: cursorRef.current.y });
      setIsPenDown(isCurrentFramePenDown);
      setIsWipeActive(isWipeActiveRef.current);
      if (frameCountRef.current % 4 === 0) {
        setIsBreathing(isCurrentFrameBreathing);
      }

      if (isCurrentFramePenDown && isWipeActiveRef.current) {
        const curPos = { x: cursorRef.current.x, y: cursorRef.current.y };
        if (prevDrawPos.current) {
          interpolateAndDraw(ctx, prevDrawPos.current, curPos, true);
        }
        prevDrawPos.current = curPos;
      } else {
        prevDrawPos.current = null;
      }
      
      isProcessingRef.current = false;
    };

    requestRef.current = requestAnimationFrame(tick);
  }, [isReady]);

  // Adjust canvas size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // preserve context? 
        const ctx = canvasRef.current.getContext('2d');
        const data = ctx?.getImageData(0,0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        if (ctx && data) {
           ctx.putImageData(data, 0, 0);
        } else if (ctx) {
           ctx.fillStyle = 'rgba(230,235,240,0.92)';
           ctx.fillRect(0,0, window.innerWidth, window.innerHeight);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isReady]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <video
        ref={videoRef}
        playsInline
        className={`absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none transition-opacity duration-1000`}
        style={{ transform: 'scaleX(-1)' }}
      />
      <div 
        className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto border border-white/20 z-[60] shadow-xl"
      >
        <Activity size={20} className={isReady ? "text-green-400" : "text-white/50"} />
      </div>

      {showIntro && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl max-w-md w-full shadow-2xl text-white relative">
            <h2 className="text-2xl font-serif mb-4 tracking-wide text-sky-200">Foggy Window</h2>
            <ul className="space-y-4 text-sm text-white/80 font-light tracking-wide mb-8">
              <li className="flex gap-3"><span className="text-sky-400">💨</span> <span><strong className="text-white font-medium">1.</strong> Move closer and breathe gently: open your mouth near the camera to make a layer of fog appear on the screen.</span></li>
              <li className="flex gap-3"><span className="text-blue-400">🖌️</span> <span><strong className="text-white font-medium">2.</strong> Raise your index finger to draw: keep your index finger straight and hold it steady for one second to activate the brush. Then draw freely on the fog.</span></li>
              <li className="flex gap-3"><span className="text-indigo-400">👆</span> <span><strong className="text-white font-medium">3.</strong> Move your finger slowly to wipe the mist and leave traces.</span></li>
            </ul>
            <button 
              onClick={() => setShowIntro(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors font-medium tracking-widest shadow-inner shadow-white/5"
            >
              Start Experience
            </button>
          </div>
        </div>
      )}

      {!isReady && !showIntro && (
        <div className="absolute top-6 right-1/2 translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 border border-white/10 shadow-2xl">
          <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          <span className="text-sm font-medium tracking-wide">{status}</span>
        </div>
      )}

      {isReady && isBreathing && (
        <div 
          className="absolute pointer-events-none transition-all duration-300"
          style={{
             left: mouthPos.x,
             top: mouthPos.y,
             transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-16 h-16 bg-white/20 rounded-full blur-md animate-pulse" />
          <div className="absolute inset-0 bg-sky-200/20 rounded-full blur-xl animate-ping" />
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Dynamic Cursor */}
      {isReady && cursorPos.x > 0 && (
        <div
          className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: isPenDown ? '24px' : '16px',
            height: isPenDown ? '24px' : '16px',
            backgroundColor: isPenDown ? (isWipeActive ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)') : 'transparent',
            border: isPenDown && isWipeActive ? 'none' : '2px solid rgba(255,255,255,0.8)',
            boxShadow: isPenDown ? (isWipeActive ? '0 0 20px #60a5fa, inset 0 0 10px #fff' : 'none') : 'none',
          }}
        >
          {isPenDown && !isWipeActive && (
            <div className="absolute inset-0 rounded-full border border-white animate-spin border-t-transparent opacity-80" />
          )}
          {isWipeActive && (
            <div className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-50" />
          )}
        </div>
      )}
    </div>
  );
}

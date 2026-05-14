import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';

export function RainEffect({
  charSize = 14,
  widthRatio = 22,
  heightRatio = 48,
  speed = 1.0,
  xRatio = 5,
  yRatio = 5,
}: {
  charSize?: number;
  widthRatio?: number;
  heightRatio?: number;
  speed?: number;
  xRatio?: number;
  yRatio?: number;
}) {
  const drops = Array.from({ length: 40 });
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  // To avoid hydration mismatches, we can set random letters in a state/ref, but for pure client it's fine.
  return (
    <div 
      className="absolute overflow-hidden pointer-events-none z-10 mix-blend-screen opacity-60"
      style={{
        top: `${yRatio}%`,
        left: `${xRatio}%`,
        width: `${widthRatio}%`,
        height: `${heightRatio}%`
      }}
    >
      {drops.map((_, i) => {
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        return (
          <motion.div
            key={i}
            className="absolute text-blue-200/80 font-mono"
            style={{
              fontSize: `${charSize}px`,
              left: Math.random() * 100 + '%',
              top: -50,
            }}
            animate={{
              y: [0, 600],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: (Math.random() * 0.5 + 0.5) / speed,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'linear'
            }}
          >
            {randomChar}
          </motion.div>
        );
      })}
    </div>
  );
}

export function FireEffect({
  charSize = 6,
  widthRatio = 19,
  heightRatio = 20,
  speed = 30,
  xRatio = 76,
  yRatio = 60,
}: {
  charSize?: number;
  widthRatio?: number;
  heightRatio?: number;
  speed?: number;
  xRatio?: number;
  yRatio?: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;

    const chars = ['f', 'i', 'r', 'e'];
    
    // RGB to hex helper
    const rgb = (r: number, g: number, b: number) => `rgb(${r},${g},${b})`;
    
    const palette = [
      rgb(0, 0, 0),       // 0 - black
      rgb(7, 7, 7),       // 1
      rgb(31, 7, 7),      // 2
      rgb(47, 15, 7),     // 3
      rgb(71, 15, 7),     // 4
      rgb(87, 23, 7),     // 5
      rgb(103, 31, 7),    // 6
      rgb(119, 31, 7),    // 7
      rgb(143, 39, 7),    // 8
      rgb(159, 47, 7),    // 9
      rgb(175, 63, 7),    // 10
      rgb(191, 71, 7),    // 11
      rgb(199, 71, 7),    // 12
      rgb(223, 79, 7),    // 13
      rgb(223, 87, 7),    // 14
      rgb(223, 87, 7),    // 15
      rgb(215, 95, 7),    // 16
      rgb(215, 95, 7),    // 17
      rgb(215, 103, 15),  // 18
      rgb(207, 111, 15),  // 19
      rgb(207, 119, 15),  // 20
      rgb(207, 127, 15),  // 21
      rgb(207, 135, 23),  // 22
      rgb(199, 135, 23),  // 23
      rgb(199, 143, 23),  // 24
      rgb(199, 151, 31),  // 25
      rgb(191, 159, 31),  // 26
      rgb(191, 159, 31),  // 27
      rgb(191, 167, 39),  // 28
      rgb(191, 167, 39),  // 29
      rgb(191, 175, 47),  // 30
      rgb(183, 175, 47),  // 31
      rgb(183, 183, 47),  // 32
      rgb(183, 183, 55),  // 33
      rgb(207, 207, 111), // 34
      rgb(223, 223, 159), // 35
      rgb(239, 239, 199), // 36
      rgb(255, 255, 255)  // 37
    ];

    let width = 0;
    let height = 0;
    let fireWidth = 0;
    let fireHeight = 0;
    let firePixels: number[] = [];

    const initFire = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
      
      fireWidth = Math.floor(width / charSize);
      fireHeight = Math.floor(height / charSize);
      
      firePixels = new Array(fireWidth * fireHeight).fill(0);
    };

    const doFire = () => {
      for (let x = 0; x < fireWidth; x++) {
        for (let y = 1; y < fireHeight; y++) {
          const src = y * fireWidth + x;
          const pixel = firePixels[src];
          if (pixel === 0) {
            const dst = src - fireWidth;
            if (dst >= 0) firePixels[dst] = 0;
          } else {
            const randIdx = Math.floor(Math.random() * 3);
            const dst = src - fireWidth - randIdx + 1;
            if (dst >= 0 && dst < firePixels.length) {
              firePixels[dst] = Math.max(0, pixel - (randIdx & 1));
            }
          }
        }
      }
    };

    const feedFire = () => {
      for (let x = 0; x < fireWidth; x++) {
        const distanceFromCenter = Math.abs(x - fireWidth / 2) / (fireWidth / 2);
        
        let intensity = 0;
        if (distanceFromCenter < 0.65) {
            intensity = Math.random() < 0.45 ? 37 : 0; 
        } else if (distanceFromCenter < 0.8) {
            intensity = Math.random() < 0.2 ? 20 : 0;
        }
        
        const idx = (fireHeight - 1) * fireWidth + x;
        if (idx >= 0 && idx < firePixels.length) {
          firePixels[idx] = intensity;
        }
      }
    };

    const drawFire = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `bold ${charSize + 1}px monospace`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      
      for (let y = 0; y < fireHeight; y++) {
        for (let x = 0; x < fireWidth; x++) {
          const index = y * fireWidth + x;
          const pixel = firePixels[index];
          if (pixel > 2) { 
            const colorIdx = Math.floor(pixel);
            const color = palette[Math.min(colorIdx, palette.length - 1)];
            
            ctx.fillStyle = color;
            
            const charObj = chars[(x * 7 + y * 13) % chars.length];
            
            ctx.globalAlpha = Math.min(1, pixel / 10);
            ctx.fillText(charObj, x * charSize + charSize / 2, y * charSize);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    };

    initFire();
    
    const ro = new ResizeObserver(() => {
      initFire();
    });
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    let lastTime = 0;
    const fps = Math.max(1, speed);
    const frameInterval = 1000 / fps;

    const loopFixed = (time: number) => {
      animationFrameId = requestAnimationFrame(loopFixed);
      if (time - lastTime > frameInterval) {
        feedFire();
        doFire();
        drawFire();
        lastTime = time - (time - lastTime) % frameInterval;
      }
    };

    animationFrameId = requestAnimationFrame(loopFixed);

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [charSize, speed]); // Re-initialize when charSize or speed changes

  return (
    <div 
      className="absolute pointer-events-none z-10 flex items-center justify-center opacity-90 mix-blend-screen overflow-hidden"
      style={{
        top: `${yRatio}%`,
        left: `${xRatio}%`,
        width: `${widthRatio}%`,
        height: `${heightRatio}%`
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-x-0 bottom-0 w-full h-[120%]" />
    </div>
  );
}

export function FishEffect() {
  return (
    <div className="absolute top-[39.5%] left-[59%] w-[4%] h-[4%] pointer-events-none z-10">
      <motion.div
        className="w-2 h-1.5 bg-orange-400 rounded-full blur-[0.5px] shadow-[0_0_4px_rgba(251,146,60,0.8)]"
        animate={{
          x: [0, 15, 30, 15, 0],
          y: [0, -3, 2, -1, 0],
          scaleX: [-1, -1, 1, 1, -1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export function CurtainEffect() {
  return (
    <div className="absolute top-[0%] left-[0%] w-[28%] h-[80%] pointer-events-none z-10 overflow-hidden mix-blend-overlay opacity-40">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        style={{ width: '200%', left: '-50%' }}
        animate={{
          x: ['-20%', '20%', '-20%'],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import StarlightParticles from './StarlightParticles';

export interface HotspotProps {
  key?: React.Key;
  id: string;
  anchor: { x: number; y: number };
  w: number;
  h: number;
  label: string;
  message: string;
  baseOpacity?: number;
  baseScale?: number;
  onInteract?: (id: string) => void;
  showSparkles?: boolean;
  lampOn?: boolean;
}

export default function Hotspot({ id, anchor, w, h, label, message, baseOpacity = 30, baseScale = 100, onInteract, showSparkles = false, lampOn = false }: HotspotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    setIsClicked(true);
    if (onInteract) onInteract(id);
    setTimeout(() => setIsClicked(false), 3000);
  };

  const scaleRatio = baseScale / 100;
  const adjustedW = w * scaleRatio;
  const adjustedH = h * scaleRatio;

  return (
    <motion.div
      className="absolute group z-20 flex flex-col items-center justify-center"
      style={{
        left: `${anchor.x - adjustedW / 2}%`,
        top: `${anchor.y - adjustedH / 2}%`,
        width: `${adjustedW}%`,
        height: `${adjustedH}%`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-[40%] bg-white mix-blend-overlay cursor-pointer origin-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 0.1 : (baseOpacity / 100),
          scale: isHovered ? 0.2 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {showSparkles && <StarlightParticles count={40} isHovered={isHovered} lampOn={lampOn} />}
      
      {/* Ripple on Click */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            className="absolute inset-0 rounded-[50%] border border-white/50"
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Label and Message Popup (On Click) */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col items-center min-w-[12rem] max-w-[16rem] text-center shadow-2xl">
              <span className="text-white/90 text-sm font-medium tracking-wide drop-shadow-md mb-1.5">{label}</span>
              <p className="text-xs font-light leading-relaxed text-blue-50/90 drop-shadow-md">
                {message}
              </p>
            </div>
            <div className="w-px h-6 bg-white/40 mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

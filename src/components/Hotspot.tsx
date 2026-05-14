import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';

export interface HotspotProps {
  key?: React.Key;
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  message: string;
  baseOpacity?: number;
  baseScale?: number;
  onInteract?: (id: string) => void;
}

export default function Hotspot({ id, x, y, w, h, label, message, baseOpacity = 30, baseScale = 100, onInteract }: HotspotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    if (onInteract) onInteract(id);
    setTimeout(() => setIsClicked(false), 3000);
  };

  const scaleRatio = baseScale / 100;
  const adjustedW = w * scaleRatio;
  const adjustedH = h * scaleRatio;
  const adjustedX = x - (adjustedW - w) / 2;
  const adjustedY = y - (adjustedH - h) / 2;

  return (
    <div
      className="absolute group z-20"
      style={{
        left: `${adjustedX}%`,
        top: `${adjustedY}%`,
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

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && !isClicked && (
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/40 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-sm font-medium tracking-wide pointer-events-none border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Box */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl p-4 rounded-xl w-64 pointer-events-none text-center z-50"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-light leading-relaxed text-blue-50 drop-shadow-md">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

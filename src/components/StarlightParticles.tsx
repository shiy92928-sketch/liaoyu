import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface StarlightParticlesProps {
  count?: number;
  isHovered?: boolean;
  lampOn?: boolean;
}

const COLORS = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#f472b6', '#38bdf8', '#a78bfa'];

export default function StarlightParticles({ count = 6, isHovered = false, lampOn = false }: StarlightParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // edge selection: 0 = top, 1 = right, 2 = bottom, 3 = left
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      const margin = 10; // how close to the exact edge
      if (edge === 0) { // top edge
        x = -margin + Math.random() * (100 + 2 * margin);
        y = -margin + Math.random() * (margin * 1.5);
      } else if (edge === 1) { // right edge
        x = 100 - margin * 0.5 + Math.random() * (margin * 1.5);
        y = -margin + Math.random() * (100 + 2 * margin);
      } else if (edge === 2) { // bottom edge
        x = -margin + Math.random() * (100 + 2 * margin);
        y = 100 - margin * 0.5 + Math.random() * (margin * 1.5);
      } else { // left edge
        x = -margin + Math.random() * (margin * 1.5);
        y = -margin + Math.random() * (100 + 2 * margin);
      }
      
      // Move closer to the center (50, 50) for hover state
      const hoverX = x + (50 - x) * 0.92;
      const hoverY = y + (50 - y) * 0.92;

      // Size between 1px and 3px (smaller than before)
      const size = Math.random() * 2.5 + 1; 
      const delay = Math.random() * 2;
      const duration = Math.random() * 1.5 + 1.5; // 1.5s to 3s
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      return { id: i, x, y, hoverX, hoverY, size, delay, duration, color };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-10">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          initial={false}
          animate={{
            left: isHovered ? `${p.hoverX}%` : `${p.x}%`,
            top: isHovered ? `${p.hoverY}%` : `${p.y}%`,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: p.size, height: p.size }}
        >
          <motion.div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: lampOn ? p.color : (isHovered ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 250, 240, 0.8)'),
              boxShadow: lampOn ? `0 0 16px 2px ${p.color}` : (isHovered ? '0 0 12px 2px rgba(255,255,255,1)' : '0 0 6px rgba(255,245,210,0.9)'),
            }}
            animate={{
              opacity: isHovered ? [0.8, 1, 0.8] : [0, 0.7, 0],
              scale: isHovered ? [1, 4, 1] : [0.3, 1.5, 0.3],
            }}
            transition={{
              duration: isHovered ? p.duration * 0.2 : p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

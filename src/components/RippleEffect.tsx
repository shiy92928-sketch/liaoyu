import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function RippleEffect() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      };
      setRipples(prev => [...prev, newRipple]);

      // Remove after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1500);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {ripples.map(ripple => (
          <React.Fragment key={ripple.id}>
            {[0, 1, 2].map((layer) => (
              <motion.div
                key={`${ripple.id}-${layer}`}
                initial={{ 
                  scale: 0.5, 
                  opacity: 0.8 - layer * 0.2 
                }}
                animate={{ 
                  scale: 4 + layer * 2, 
                  opacity: 0 
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8 + layer * 0.2, 
                  ease: "easeOut",
                  delay: layer * 0.1
                }}
                className="absolute rounded-full border border-teal-200/60 shadow-[0_0_10px_rgba(255,255,255,0.3)] bg-white/5"
                style={{
                  left: ripple.x - 15,
                  top: ripple.y - 15,
                  width: 30,
                  height: 30,
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </AnimatePresence>
    </div>
  );
}

import { Eye, EyeOff, ArrowLeft, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';

import { RainEffect, FireEffect, FishEffect, CurtainEffect } from './components/Effects';
import Hotspot, { HotspotProps } from './components/Hotspot';
import ParticleEffect from './components/ParticleEffect';
import { audioEngine } from './lib/audio';
import RainShaderWindow from './components/Scene2';
import RippleEffect from './components/RippleEffect';

const ROOM_HOTSPOTS: Omit<HotspotProps, 'baseOpacity' | 'onInteract'>[] = [
  { id: "window", anchor: { x: 14, y: 33.7 }, w: 28, h: 50, baseScale: 45, label: "Window", message: "Raindrops hit the glass, isolating the noise, making the mind clear as if washed." },
  { id: "curtains", anchor: { x: 3, y: 40 }, w: 6, h: 80, label: "Curtains", message: "The wind gently blows, the curtains dance in the light and shadow, bringing a touch of coolness and peace." },
  { id: "paintings", anchor: { x: 61.2, y: 21.2 }, w: 22, h: 28, baseScale: 43, label: "Seaside Sunset Painting", message: "Eyes rest on the frame, the sunset and waves interweave, thoughts drift to the distant coastline." },
  { id: "fishbowl", anchor: { x: 60.6, y: 40.3 }, w: 6, h: 10, baseScale: 43, label: "Fishbowl", message: "Goldfish swim leisurely in the water, tiny bubbles rise, the rhythm of life is endless." },
  { id: "lamp", anchor: { x: 46.3, y: 27.8 }, w: 8, h: 18, baseScale: 43, label: "Lamp", message: "The light is soft, between on and off, the mood changes." },
  { id: "typewriter", anchor: { x: 42.5, y: 49 }, w: 9, h: 10, label: "Typewriter", message: "Fingertips hit the keyboard, the clicking sound is crisp and pleasant, recording the inspiration and emotion of the moment." },
  { id: "fireplace", anchor: { x: 85.5, y: 63 }, w: 23, h: 42, label: "Fireplace", message: "The campfire burns, crackling, warming the whole room." },
  { id: "boots", anchor: { x: 68, y: 72.5 }, w: 8, h: 17, label: "Boots", message: "Bright yellow rain boots sit quietly in the corner, waiting for the joy of stepping into the puddle next time." },
  { id: "book", anchor: { x: 21, y: 85 }, w: 10, h: 8, label: "White Letter Paper", message: "The white letter paper is spread out on the desk, waiting for thoughts to land." },
];

const OUTDOOR_HOTSPOTS: Omit<HotspotProps, 'baseOpacity' | 'onInteract'>[] = [
  { id: "back_to_room", anchor: { x: 50, y: 50 }, w: 10, h: 10, label: "Back to Room", message: "End the camping and return to the cozy indoors." },
  { id: "stars", anchor: { x: 50, y: 25 }, w: 60, h: 30, label: "Starry Sky", message: "The endless starry sky makes people feel peaceful and small." },
  { id: "campfire_large", anchor: { x: 50, y: 82.5 }, w: 20, h: 25, label: "Campfire", message: "The blazing fire dispels the cold of the forest." }
];

const SCENES = [
  {
    id: "room",
    hotspots: ROOM_HOTSPOTS,
    zoomOrigin: "17% 30%",
  },
  {
    id: "outdoor",
    hotspots: OUTDOOR_HOTSPOTS,
    image: "https://raw.githubusercontent.com/shiy92928-sketch/picture/main/9e832c09-b79e-4d2a-b844-2e5ddd054a85.png",
    zoomOrigin: "50% 50%",
  }
];

export default function App() {
  const [hotspotConfig, setHotspotConfig] = useState(ROOM_HOTSPOTS);

  const handleHotspotChange = (id: string, field: string, value: number) => {
    setHotspotConfig(prev => prev.map(h => {
      if (h.id === id) {
        if (field === 'x' || field === 'y') {
          return { ...h, anchor: { ...h.anchor, [field]: value } };
        }
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  const [imageSrc, setImageSrc] = useState<string | null>('https://raw.githubusercontent.com/shiy92928-sketch/picture/main/9e832c09-b79e-4d2a-b844-2e5ddd054a85.png');

  const [lampOn, setLampOn] = useState<boolean>(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);

  // Effects Controls
  const [fireCharSize, setFireCharSize] = useState(5);
  const [fireWidth, setFireWidth] = useState(7);
  const [fireHeight, setFireHeight] = useState(15);
  const [fireSpeed, setFireSpeed] = useState(23);
  const [fireX, setFireX] = useState(84);
  const [fireY, setFireY] = useState(61);

  const [rainCharSize, setRainCharSize] = useState(15);
  const [rainWidth, setRainWidth] = useState(14);
  const [rainHeight, setRainHeight] = useState(48);
  const [rainSpeed, setRainSpeed] = useState(1.0);
  const [rainX, setRainX] = useState(7);
  const [rainY, setRainY] = useState(2);

  const [externalIframeUrl, setExternalIframeUrl] = useState<string | null>(null);
  const [showWindowView, setShowWindowView] = useState(false);

  const hotspotScale = 43;
  const hotspotOpacity = 0;

  const [soundRain, setSoundRain] = useState(true);
  const [soundWind, setSoundWind] = useState(true);
  const [soundFire, setSoundFire] = useState(true);
  const [soundMusic, setSoundMusic] = useState(true);

  const [volRain, setVolRain] = useState(0.5);
  const [volWind, setVolWind] = useState(0.5);
  const [volFire, setVolFire] = useState(0.3);
  const [volMusic, setVolMusic] = useState(0.5);
  const [songChoice, setSongChoice] = useState(0);

  useEffect(() => {
    const musicInterval = setInterval(() => {
      setSongChoice(prev => (prev + 1) % 3);
    }, 120000); // 2 minutes

    // Start audio on first interaction
    const handleFirstInteraction = () => {
      setSoundRain(true);
      setSoundWind(true);
      setSoundFire(true);
      setSoundMusic(true);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      clearInterval(musicInterval);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    audioEngine.toggleRain(soundRain, volRain);
  }, [soundRain]);

  useEffect(() => {
    if (soundRain) audioEngine.setRainVolume(volRain);
  }, [volRain, soundRain]);

  useEffect(() => {
    audioEngine.toggleWind(soundWind, volWind);
  }, [soundWind]);

  useEffect(() => {
    if (soundWind) audioEngine.setWindVolume(volWind);
  }, [volWind, soundWind]);

  useEffect(() => {
    audioEngine.toggleFire(soundFire, volFire);
  }, [soundFire]);

  useEffect(() => {
    if (soundFire) audioEngine.setFireVolume(volFire);
  }, [volFire, soundFire]);

  useEffect(() => {
    audioEngine.toggleMusic(soundMusic, volMusic, songChoice);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundMusic, songChoice]);

  useEffect(() => {
    if (soundMusic) audioEngine.setMusicVolume(volMusic);
  }, [volMusic, soundMusic]);

  const handleInteract = (id: string) => {
    if (id === 'lamp') {
      setLampOn(prev => !prev);
    } else if (id === 'window') {
      setShowWindowView(true);
    } else if (id === 'back_to_room') {
      setCurrentSceneIndex(0);
    } else if (id === 'book') {
      setExternalIframeUrl('https://chuisan.netlify.app');
    } else if (id === 'paintings') {
      setExternalIframeUrl('https://riluoyuhui.netlify.app');
    } else if (id === 'boots') {
      setExternalIframeUrl('https://1542522.netlify.app');
    } else if (id === 'typewriter') {
      setExternalIframeUrl('https://daziji.netlify.app');
    } else if (id === 'fishbowl') {
      setExternalIframeUrl('https://tiny-bienenstitch-0c41e5.netlify.app');
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden font-sans">
      <RippleEffect />
      <AnimatePresence mode="wait">
        {externalIframeUrl ? (
          <motion.div
            key="iframe-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="absolute top-6 left-6 z-[60]">
              <button
                onClick={() => setExternalIframeUrl(null)}
                className="flex items-center gap-2 px-6 py-3 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white hover:text-sky-300 border border-white/20 transition-all text-sm font-medium shadow-2xl"
              >
                <ArrowLeft size={18} />
                Back to Room
              </button>
            </div>
            <iframe 
              src={externalIframeUrl} 
              className="w-full h-full border-none bg-white"
              title="External Interaction"
              allow="camera; microphone; autoplay; fullscreen"
            />
          </motion.div>
        ) : showWindowView ? (
          <motion.div
            key="window-view-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="absolute top-6 left-6 z-[80]">
              <button
                onClick={() => setShowWindowView(false)}
                className="flex items-center gap-2 px-6 py-3 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white hover:text-sky-300 border border-white/20 transition-all text-sm font-medium shadow-2xl"
              >
                <ArrowLeft size={18} />
                Back to Room
              </button>
            </div>
            
            <RainShaderWindow />
          </motion.div>
        ) : (
          <motion.div
            key="scene-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative w-full h-screen overflow-hidden bg-black"
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSceneIndex}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100vw,calc(100vh*16/9))] h-[max(100vh,calc(100vw*9/16))] overflow-hidden group bg-slate-900"
                initial={{ opacity: 0, scale: currentSceneIndex === 0 ? 0.8 : 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  scale: currentSceneIndex === 0 ? 5 : 0.8,
                  transformOrigin: SCENES[currentSceneIndex].zoomOrigin 
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                {/* Main Image or Video */}
                {currentSceneIndex === 1 ? (
                  <motion.video 
                    src="/视频资源目录/outdoor.mp4" 
                    className="absolute inset-0 w-full h-full object-contain origin-center bg-black"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <motion.img 
                    src={(currentSceneIndex === 0 ? imageSrc : SCENES[currentSceneIndex].image) as string} 
                    alt="Scene" 
                    className="absolute inset-0 w-full h-full object-cover origin-center"
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                )}

                {/* Ambient Vignette & Mist */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.5)_100%)] pointer-events-none mix-blend-multiply" />
                <div className="absolute inset-0 bg-blue-500/5 mix-blend-screen pointer-events-none" />

                {/* Room specific effects */}
                {currentSceneIndex === 0 && (
                  <>
                    <RainEffect 
                      charSize={rainCharSize} 
                      widthRatio={rainWidth} 
                      heightRatio={rainHeight} 
                      speed={rainSpeed} 
                      xRatio={rainX}
                      yRatio={rainY}
                    />
                    <FireEffect 
                      charSize={fireCharSize} 
                      widthRatio={fireWidth} 
                      heightRatio={fireHeight} 
                      speed={fireSpeed} 
                      xRatio={fireX}
                      yRatio={fireY}
                    />
                    <FishEffect />
                    <CurtainEffect />

                    {/* Dark overlay when lamp is off */}
                    <motion.div 
                      className="absolute inset-0 bg-slate-950/70 pointer-events-none z-10 mix-blend-multiply"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: lampOn ? 0 : 1 }}
                      transition={{ duration: 1.5 }}
                    />
                  </>
                )}
                
                {/* Global Effects & Sounds */}
                <ParticleEffect />

                {/* Interactive Hotspots */}
                {(currentSceneIndex === 0 ? hotspotConfig : SCENES[currentSceneIndex].hotspots).map((hotspot) => (
                  <Hotspot 
                    key={hotspot.id} 
                    id={hotspot.id}
                    anchor={hotspot.anchor}
                    w={hotspot.w}
                    h={hotspot.h}
                    label={hotspot.label}
                    message={hotspot.message}
                    baseOpacity={hotspotOpacity}
                    baseScale={hotspot.baseScale ?? hotspotScale}
                    onInteract={handleInteract}
                    showSparkles={["typewriter", "boots", "book", "window", "lamp", "fishbowl", "paintings"].includes(hotspot.id)}
                    lampOn={lampOn}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Global Audio Prompt */}
            <div className="absolute top-6 right-6 z-50 text-white/40 text-[10px] font-light pointer-events-none tracking-[0.2em] mix-blend-overlay">
              ♪ AMBIENT MEMORY
            </div>

            {/* Debug Panel */}
            {import.meta.env.DEV && false && (
              <div className="absolute top-20 right-6 z-50 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white w-72 max-h-[80vh] overflow-y-auto">
                <h3 className="text-sm font-medium border-b border-white/20 pb-2 mb-4">Hotspot Debug Settings</h3>
                {hotspotConfig.filter(h => ['lamp', 'fishbowl', 'paintings', 'window'].includes(h.id)).map(hotspot => (
                  <div key={hotspot.id} className="mb-6 border-b border-white/10 pb-4">
                    <h4 className="text-xs font-semibold text-blue-300 mb-2 capitalize">{hotspot.label}</h4>
                    
                    {/* X Position */}
                    <div className="flex flex-col gap-1 mb-2">
                      <label className="text-[10px] flex justify-between">
                        <span>X Position</span>
                        <span className="text-white/60">{hotspot.anchor.x}%</span>
                      </label>
                      <input type="range" min="0" max="100" step="0.1" value={hotspot.anchor.x} onChange={(e) => handleHotspotChange(hotspot.id, 'x', parseFloat(e.target.value))} className="accent-blue-400 h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                    </div>
                    {/* Y Position */}
                    <div className="flex flex-col gap-1 mb-2">
                      <label className="text-[10px] flex justify-between">
                        <span>Y Position</span>
                        <span className="text-white/60">{hotspot.anchor.y}%</span>
                      </label>
                      <input type="range" min="0" max="100" step="0.1" value={hotspot.anchor.y} onChange={(e) => handleHotspotChange(hotspot.id, 'y', parseFloat(e.target.value))} className="accent-blue-400 h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                    </div>
                    {/* Width */}
                    <div className="flex flex-col gap-1 mb-2">
                      <label className="text-[10px] flex justify-between">
                        <span>Width</span>
                        <span className="text-white/60">{hotspot.w}%</span>
                      </label>
                      <input type="range" min="1" max="100" step="0.5" value={hotspot.w} onChange={(e) => handleHotspotChange(hotspot.id, 'w', parseFloat(e.target.value))} className="accent-blue-400 h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                    </div>
                    {/* Height */}
                    <div className="flex flex-col gap-1 mb-2">
                      <label className="text-[10px] flex justify-between">
                        <span>Height</span>
                        <span className="text-white/60">{hotspot.h}%</span>
                      </label>
                      <input type="range" min="1" max="100" step="0.5" value={hotspot.h} onChange={(e) => handleHotspotChange(hotspot.id, 'h', parseFloat(e.target.value))} className="accent-blue-400 h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                    </div>
                    {/* Scale */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] flex justify-between">
                        <span>Scale</span>
                        <span className="text-white/60">{hotspot.baseScale ?? hotspotScale}</span>
                      </label>
                      <input type="range" min="10" max="200" step="1" value={hotspot.baseScale ?? hotspotScale} onChange={(e) => handleHotspotChange(hotspot.id, 'baseScale', parseFloat(e.target.value))} className="accent-blue-400 h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                    </div>
                  </div>
                ))}
                <button
                  className="w-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 border border-blue-500/30 rounded py-2 text-xs font-medium mt-2 transition-colors pointer-events-auto"
                  onClick={() => {
                    const toLog = hotspotConfig.map(h => ({
                      id: h.id,
                      anchor: h.anchor,
                      w: h.w,
                      h: h.h,
                      scale: h.baseScale
                    }));
                    console.log("const updatedHotspots =", JSON.stringify(toLog, null, 2));
                    alert("Config logged to console!");
                  }}
                >
                  Log Config to Console
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

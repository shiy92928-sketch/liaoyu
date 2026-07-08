import { Eye, EyeOff, ArrowLeft, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';
import AmbientSounds from './components/AmbientSounds';
import { RainEffect, FireEffect, FishEffect, CurtainEffect } from './components/Effects';
import Hotspot, { HotspotProps } from './components/Hotspot';
import ParticleEffect from './components/ParticleEffect';
import { audioEngine } from './lib/audio';
import RainShaderWindow from './components/Scene2';
import RippleEffect from './components/RippleEffect';

const ROOM_HOTSPOTS: Omit<HotspotProps, 'baseOpacity' | 'baseScale' | 'onInteract'>[] = [
  { id: "window", x: 8, y: 5, w: 18, h: 50, label: "Window", message: "Raindrops hit the glass, isolating the noise, making the mind clear as if washed." },
  { id: "curtains", x: 0, y: 0, w: 6, h: 80, label: "Curtains", message: "The wind gently blows, the curtains dance in the light and shadow, bringing a touch of coolness and peace." },
  { id: "paintings", x: 55, y: 10, w: 22, h: 28, label: "Seaside Sunset Painting", message: "Eyes rest on the frame, the sunset and waves interweave, thoughts drift to the distant coastline." },
  { id: "fishbowl", x: 58, y: 36, w: 6, h: 10, label: "Fishbowl", message: "Goldfish swim leisurely in the water, tiny bubbles rise, the rhythm of life is endless." },
  { id: "lamp", x: 44, y: 25, w: 8, h: 18, label: "Lamp", message: "The light is soft, between on and off, the mood changes." },
  { id: "typewriter", x: 38, y: 44, w: 9, h: 10, label: "Typewriter", message: "Fingertips hit the keyboard, the clicking sound is crisp and pleasant, recording the inspiration and emotion of the moment." },
  { id: "fireplace", x: 74, y: 42, w: 23, h: 42, label: "Fireplace", message: "The campfire burns, crackling, warming the whole room." },
  { id: "boots", x: 64, y: 64, w: 8, h: 17, label: "Boots", message: "Bright yellow rain boots sit quietly in the corner, waiting for the joy of stepping into the puddle next time." },
  { id: "book", x: 16, y: 81, w: 10, h: 8, label: "White Letter Paper", message: "The white letter paper is spread out on the desk, waiting for thoughts to land." },
];

const OUTDOOR_HOTSPOTS: Omit<HotspotProps, 'baseOpacity' | 'baseScale' | 'onInteract'>[] = [
  { id: "back_to_room", x: 45, y: 45, w: 10, h: 10, label: "Back to Room", message: "End the camping and return to the cozy indoors." },
  { id: "stars", x: 20, y: 10, w: 60, h: 30, label: "Starry Sky", message: "The endless starry sky makes people feel peaceful and small." },
  { id: "campfire_large", x: 40, y: 70, w: 20, h: 25, label: "Campfire", message: "The blazing fire dispels the cold of the forest." }
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
  const [imageSrc, setImageSrc] = useState<string | null>('https://raw.githubusercontent.com/shiy92928-sketch/picture/main/9e832c09-b79e-4d2a-b844-2e5ddd054a85.png');

  const [lampOn, setLampOn] = useState<boolean>(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

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

  const [soundRain, setSoundRain] = useState(false);
  const [soundWind, setSoundWind] = useState(false);
  const [soundFire, setSoundFire] = useState(false);
  const [soundMusic, setSoundMusic] = useState(false);

  const [volRain, setVolRain] = useState(1);
  const [volWind, setVolWind] = useState(1);
  const [volFire, setVolFire] = useState(1);
  const [volMusic, setVolMusic] = useState(1);
  const [songChoice, setSongChoice] = useState(0);

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden w-full h-full font-sans">
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
            className="relative w-full h-screen flex items-center justify-center bg-black/90 p-4 sm:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSceneIndex}
                className="relative w-full max-w-7xl max-h-full aspect-video shadow-2xl shadow-blue-900/20 rounded-xl overflow-hidden ring-1 ring-white/10 group bg-slate-900"
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
                <AmbientSounds />
                <ParticleEffect />

                {/* Interactive Hotspots */}
                {SCENES[currentSceneIndex].hotspots.map((hotspot) => (
                  <Hotspot 
                    key={hotspot.id} 
                    id={hotspot.id}
                    x={hotspot.x}
                    y={hotspot.y}
                    w={hotspot.w}
                    h={hotspot.h}
                    label={hotspot.label}
                    message={hotspot.message}
                    baseOpacity={hotspotOpacity}
                    baseScale={hotspotScale}
                    onInteract={handleInteract}
                    showSparkles={["typewriter", "boots", "book", "window", "lamp", "fishbowl", "paintings"].includes(hotspot.id)}
                    lampOn={lampOn}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Global Visibility Toggle */}
            <motion.div
              className="absolute top-6 right-6 z-50 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <AnimatePresence>
                {!controlsVisible && (
                  <motion.span
                    className="text-white/80 font-light text-xs tracking-wide pointer-events-none drop-shadow-md whitespace-nowrap"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ 
                      opacity: [0.65, 0.85, 0.65], 
                      y: [-2, 2, -2] 
                    }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    Click the eye to adjust music and sound.
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white/50 hover:text-white/90 backdrop-blur-md transition-colors border border-white/10"
                onClick={() => setControlsVisible(!controlsVisible)}
              >
                {controlsVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </motion.div>

            {/* Right Control Panel */}
            <AnimatePresence>
              {controlsVisible && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.1 }}
                  className="absolute top-20 right-6 bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col gap-6 text-white/90 text-xs z-50 shadow-2xl max-h-[75vh] overflow-y-auto w-64 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pb-2">
                    {currentSceneIndex !== 0 && (
                      <button
                        onClick={() => setCurrentSceneIndex(0)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium border border-white/5"
                      >
                        <ArrowLeft size={16} />
                        Back to Room
                      </button>
                    )}
                  </div>

                  {/* Sound Settings */}
                  <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                    <h3 className="font-medium text-white/80 border-b border-white/10 pb-2 text-sm flex items-center gap-2">
                      <Music size={14} /> Music / White Noise
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      {/* Music */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            if (!soundMusic) {
                              setSongChoice(Math.floor(Math.random() * 3));
                              setSoundMusic(true);
                            } else {
                              setSongChoice(prev => (prev + 1 + Math.floor(Math.random() * 2)) % 3);
                            }
                          }}
                          className={`py-2 rounded-lg transition-colors border text-center ${soundMusic ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                        >
                          {soundMusic ? `Music: Instrumental ${songChoice + 1}` : 'Music 音乐'}
                        </button>
                        {soundMusic && (
                          <input type="range" min="0" max="2" step="0.1" value={volMusic} onChange={(e) => setVolMusic(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer w-full mt-1" />
                        )}
                      </div>

                      {/* Fire */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setSoundFire(!soundFire)}
                          className={`py-2 rounded-lg transition-colors border text-center ${soundFire ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                        >
                          Fireplace Sound
                        </button>
                        {soundFire && (
                          <input type="range" min="0" max="2" step="0.1" value={volFire} onChange={(e) => setVolFire(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer w-full mt-1" />
                        )}
                      </div>

                      {/* Rain */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setSoundRain(!soundRain)}
                          className={`py-2 rounded-lg transition-colors border text-center ${soundRain ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                        >
                          Rain Sound
                        </button>
                        {soundRain && (
                          <input type="range" min="0" max="2" step="0.1" value={volRain} onChange={(e) => setVolRain(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer w-full mt-1" />
                        )}
                      </div>

                      {/* Wind */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setSoundWind(!soundWind)}
                          className={`py-2 rounded-lg transition-colors border text-center ${soundWind ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                        >
                          Wind Sound
                        </button>
                        {soundWind && (
                          <input type="range" min="0" max="2" step="0.1" value={volWind} onChange={(e) => setVolWind(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer w-full mt-1" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Effects Settings for Room */}
                  {currentSceneIndex === 0 && (
                    <>
                      <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <h3 className="font-medium text-white/80 text-sm">Fireplace Settings</h3>
                          <button 
                            onClick={() => {
                              setFireX(84);
                              setFireY(61);
                              setFireCharSize(5);
                              setFireWidth(7);
                              setFireHeight(15);
                              setFireSpeed(23);
                            }}
                            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white/70 hover:text-white transition-colors"
                          >
                            Presets
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>X Position</span><span className="text-white/60">{fireX}%</span></label>
                           <input type="range" min="0" max="100" value={fireX} onChange={(e) => setFireX(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Y Position</span><span className="text-white/60">{fireY}%</span></label>
                           <input type="range" min="0" max="100" value={fireY} onChange={(e) => setFireY(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Character Size</span><span className="text-white/60">{fireCharSize}px</span></label>
                           <input type="range" min="2" max="24" value={fireCharSize} onChange={(e) => setFireCharSize(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Width</span><span className="text-white/60">{fireWidth}%</span></label>
                           <input type="range" min="5" max="100" value={fireWidth} onChange={(e) => setFireWidth(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Height</span><span className="text-white/60">{fireHeight}%</span></label>
                           <input type="range" min="5" max="100" value={fireHeight} onChange={(e) => setFireHeight(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Speed</span><span className="text-white/60">{fireSpeed} fps</span></label>
                           <input type="range" min="5" max="60" value={fireSpeed} onChange={(e) => setFireSpeed(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <h3 className="font-medium text-white/80 text-sm">Matrix Rain Settings</h3>
                          <button 
                            onClick={() => {
                              setRainX(7);
                              setRainY(2);
                              setRainCharSize(15);
                              setRainWidth(14);
                              setRainHeight(48);
                              setRainSpeed(1);
                            }}
                            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white/70 hover:text-white transition-colors"
                          >
                            Presets
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>X Position</span><span className="text-white/60">{rainX}%</span></label>
                           <input type="range" min="0" max="100" value={rainX} onChange={(e) => setRainX(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Y Position</span><span className="text-white/60">{rainY}%</span></label>
                           <input type="range" min="0" max="100" value={rainY} onChange={(e) => setRainY(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Character Size</span><span className="text-white/60">{rainCharSize}px</span></label>
                           <input type="range" min="8" max="48" value={rainCharSize} onChange={(e) => setRainCharSize(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Width</span><span className="text-white/60">{rainWidth}%</span></label>
                           <input type="range" min="5" max="100" value={rainWidth} onChange={(e) => setRainWidth(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Height</span><span className="text-white/60">{rainHeight}%</span></label>
                           <input type="range" min="5" max="100" value={rainHeight} onChange={(e) => setRainHeight(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Speed Multiplier</span><span className="text-white/60">{rainSpeed.toFixed(1)}x</span></label>
                           <input type="range" min="0.1" max="5" step="0.1" value={rainSpeed} onChange={(e) => setRainSpeed(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

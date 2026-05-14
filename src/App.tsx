import { UploadCloud, Eye, EyeOff, ArrowLeft, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';
import AmbientSounds from './components/AmbientSounds';
import { RainEffect, FireEffect, FishEffect, CurtainEffect } from './components/Effects';
import Hotspot, { HotspotProps } from './components/Hotspot';
import ParticleEffect from './components/ParticleEffect';
import { audioEngine } from './lib/audio';
import RainShaderWindow from './components/Scene2';

const ROOM_HOTSPOTS: Omit<HotspotProps, 'baseOpacity' | 'baseScale' | 'onInteract'>[] = [
  { id: "window", x: 8, y: 5, w: 18, h: 50, label: "窗户", message: "雨滴拍打着玻璃，隔绝了喧嚣，内心如同洗涤过般清澈。" },
  { id: "curtains", x: 0, y: 0, w: 6, h: 80, label: "窗帘", message: "风轻轻拂过，窗帘在光影中婆娑，带来丝丝凉意与宁静。" },
  { id: "paintings", x: 55, y: 10, w: 22, h: 28, label: "海边日落画", message: "目光停留在画框里，夕阳与海浪交织，思绪飘向远方的海岸线。" },
  { id: "fishbowl", x: 58, y: 36, w: 6, h: 10, label: "鱼缸", message: "金鱼在水中悠然游动，微小的气泡升腾，生命的律动生生不息。" },
  { id: "lamp", x: 44, y: 25, w: 8, h: 18, label: "台灯", message: "光线柔和，开关之间，情绪随之转换。" },
  { id: "typewriter", x: 38, y: 44, w: 9, h: 10, label: "打字机", message: "指尖敲击键盘，哒哒声清脆悦耳，记录下此刻的灵感与情绪。" },
  { id: "fireplace", x: 74, y: 42, w: 23, h: 42, label: "火堆", message: "篝火燃烧，发出噼啪声，温暖了整个房间。" },
  { id: "boots", x: 64, y: 64, w: 8, h: 17, label: "雨靴", message: "亮黄色的雨靴静静在角落，等待着下一次踏入水洼的雀跃。" },
  { id: "book", x: 16, y: 81, w: 10, h: 8, label: "白色信纸", message: "白皙的信纸摊开在书桌上，等待着思绪的降落。" },
];

const OUTDOOR_HOTSPOTS: Omit<HotspotProps, 'baseOpacity' | 'baseScale' | 'onInteract'>[] = [
  { id: "back_to_room", x: 45, y: 45, w: 10, h: 10, label: "返回房间", message: "结束露营，回到温馨的室内。" },
  { id: "stars", x: 20, y: 10, w: 60, h: 30, label: "星空", message: "无尽的星空让人感到宁静和渺小。" },
  { id: "campfire_large", x: 40, y: 70, w: 20, h: 25, label: "营火", message: "熊熊燃烧的火焰，驱散了森林的寒冷。" }
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
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2070&auto=format&fit=crop",
    zoomOrigin: "50% 50%",
  }
];

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lampOn, setLampOn] = useState<boolean>(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Effects Controls
  const [fireCharSize, setFireCharSize] = useState(6);
  const [fireWidth, setFireWidth] = useState(19);
  const [fireHeight, setFireHeight] = useState(20);
  const [fireSpeed, setFireSpeed] = useState(30);
  const [fireX, setFireX] = useState(76);
  const [fireY, setFireY] = useState(60);

  const [rainCharSize, setRainCharSize] = useState(14);
  const [rainWidth, setRainWidth] = useState(22);
  const [rainHeight, setRainHeight] = useState(48);
  const [rainSpeed, setRainSpeed] = useState(1.0);
  const [rainX, setRainX] = useState(5);
  const [rainY, setRainY] = useState(5);

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
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setImageSrc(url);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden w-full h-full font-sans">
      <AnimatePresence mode="wait">
        {!imageSrc ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-xl mx-4"
          >
            <div 
              className="group relative flex flex-col items-center justify-center p-16 border-2 border-dashed border-sky-900/50 rounded-3xl bg-slate-900/30 backdrop-blur-sm transition-all hover:bg-slate-900/50 hover:border-sky-500/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              
              <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-xl border border-slate-700/50 group-hover:scale-110 transition-transform duration-500 ease-out">
                <UploadCloud className="w-8 h-8 text-sky-400" />
              </div>
              
              <h2 className="text-2xl font-serif text-slate-200 mb-2 tracking-wide">
                开启疗愈之旅
              </h2>
              <p className="text-slate-400 text-center max-w-sm font-light">
                点击或拖拽上传你的场景图片
                <br />
                <span className="text-sm opacity-70 mt-2 block">(请使用原画面以获得最佳交互对应效果)</span>
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </motion.div>
        ) : externalIframeUrl ? (
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
                返回房间
              </button>
            </div>
            <iframe 
              src={externalIframeUrl} 
              className="w-full h-full border-none bg-white"
              title="External Interaction"
              allow="autoplay; fullscreen"
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
                返回房间
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
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Global Visibility Toggle */}
            <motion.button
              className="absolute top-6 right-6 z-50 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white/50 hover:text-white/90 backdrop-blur-md transition-colors border border-white/10"
              onClick={() => setControlsVisible(!controlsVisible)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              {controlsVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </motion.button>

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
                    <button
                      onClick={() => setImageSrc(null)}
                      className="w-full text-center px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium border border-white/5 flex items-center justify-center gap-2"
                    >
                      重新选择
                    </button>

                    {currentSceneIndex !== 0 && (
                      <button
                        onClick={() => setCurrentSceneIndex(0)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium border border-white/5"
                      >
                        <ArrowLeft size={16} />
                        返回房间
                      </button>
                    )}
                  </div>

                  {/* Sound Settings */}
                  <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                    <h3 className="font-medium text-white/80 border-b border-white/10 pb-2 text-sm flex items-center gap-2">
                      <Music size={14} /> 生成纯音乐/白噪音
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      {/* Music */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            if (!soundMusic) setSongChoice(Math.floor(Math.random() * 4));
                            setSoundMusic(!soundMusic);
                          }}
                          className={`py-2 rounded-lg transition-colors border text-center ${soundMusic ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                        >
                          纯音乐 {soundMusic && `(旋律 ${songChoice + 1})`}
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
                          火堆燃烧声
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
                          下雨声
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
                          风声
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
                          <h3 className="font-medium text-white/80 text-sm">火焰设置</h3>
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
                            一键设定
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>X 轴位置</span><span className="text-white/60">{fireX}%</span></label>
                           <input type="range" min="0" max="100" value={fireX} onChange={(e) => setFireX(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Y 轴位置</span><span className="text-white/60">{fireY}%</span></label>
                           <input type="range" min="0" max="100" value={fireY} onChange={(e) => setFireY(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>字符大小</span><span className="text-white/60">{fireCharSize}px</span></label>
                           <input type="range" min="2" max="24" value={fireCharSize} onChange={(e) => setFireCharSize(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>宽度</span><span className="text-white/60">{fireWidth}%</span></label>
                           <input type="range" min="5" max="100" value={fireWidth} onChange={(e) => setFireWidth(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>高度</span><span className="text-white/60">{fireHeight}%</span></label>
                           <input type="range" min="5" max="100" value={fireHeight} onChange={(e) => setFireHeight(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>速度</span><span className="text-white/60">{fireSpeed} fps</span></label>
                           <input type="range" min="5" max="60" value={fireSpeed} onChange={(e) => setFireSpeed(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <h3 className="font-medium text-white/80 text-sm">字符雨设置</h3>
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
                            一键设定
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>X 轴位置</span><span className="text-white/60">{rainX}%</span></label>
                           <input type="range" min="0" max="100" value={rainX} onChange={(e) => setRainX(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>Y 轴位置</span><span className="text-white/60">{rainY}%</span></label>
                           <input type="range" min="0" max="100" value={rainY} onChange={(e) => setRainY(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>字符大小</span><span className="text-white/60">{rainCharSize}px</span></label>
                           <input type="range" min="8" max="48" value={rainCharSize} onChange={(e) => setRainCharSize(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>宽度</span><span className="text-white/60">{rainWidth}%</span></label>
                           <input type="range" min="5" max="100" value={rainWidth} onChange={(e) => setRainWidth(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>高度</span><span className="text-white/60">{rainHeight}%</span></label>
                           <input type="range" min="5" max="100" value={rainHeight} onChange={(e) => setRainHeight(Number(e.target.value))} className="accent-white h-1 bg-white/20 rounded-full outline-none cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="flex justify-between"><span>速度倍率</span><span className="text-white/60">{rainSpeed.toFixed(1)}x</span></label>
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

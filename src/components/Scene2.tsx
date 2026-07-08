import React, { useEffect, useRef, useState } from 'react';
import { Settings2, Upload, Droplets, CloudFog, Eye, Play, Wind, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FogLayer from './FogLayer';

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    // Convert from clip space (-1 to 1) to texture space (0 to 1)
    v_texCoord = a_position * 0.5 + 0.5;
    // Flip Y to match image convention
    v_texCoord.y = 1.0 - v_texCoord.y;
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform sampler2D u_tex0;
  
  uniform float u_rainAmount; 
  uniform float u_blur;       
  uniform float u_refraction; 

  varying vec2 v_texCoord;

  vec3 N13(float p) {
    vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
  }

  float N(float t) {
      return fract(sin(t*12345.564)*7658.76);
  }

  vec2 DropLayer2(vec2 uv, float t) {
      vec2 UV = uv;
      uv.y += t*0.75;
      vec2 a = vec2(6., 1.);
      vec2 grid = a*2.;
      vec2 id = floor(uv*grid);
      
      float colShift = N(id.x); 
      uv.y += colShift;
      
      id = floor(uv*grid);
      vec3 n = N13(id.x*35.2+id.y*2376.1);
      vec2 st = fract(uv*grid)-vec2(.5, 0);       
      
      float x = n.x-.5;       
      float y = UV.y*20.;   
      float wiggle = sin(y+sin(y));
      x += wiggle*(.5-abs(x))*(n.z-.5);   
      x *= .7;
      float ti = fract(t+n.z);
      y = (fract(uv.y+ti)-.5)*2.;
      
      float d = length(vec2(x, y));
      float mainDrop = smoothstep(.4, .0, d);
      
      float r = sqrt(smoothstep(1., y, st.y));
      float cd = abs(st.x-x);
      float trail = smoothstep(.23*r, .15*r*r, cd);
      float trailFront = smoothstep(-.02, .02, st.y-y);
      trail *= trailFront*r*r;
      
      y = uv.y;
      float trail2 = smoothstep(.2*r, .0, cd);
      float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
      y = fract(y*10.)+(st.y-.5);
      float dd = length(st-vec2(x, y));
      droplets = smoothstep(.3, 0., dd);
      float m = mainDrop+droplets*r*trailFront;
      
      return vec2(m, trail);
  }

  float StaticDrops(vec2 uv, float t) {
      uv *= 40.;
      vec2 id = floor(uv);
      uv = fract(uv)-.5;
      vec3 n = N13(id.x*107.45+id.y*3543.654);
      vec2 p = (n.xy-.5)*.7;
      float d = length(uv-p);
      
      float fade = max(0., 1.-fract(t+n.z)*2.);
      float c = smoothstep(.3, .0, d)*fract(n.z*10.)*fade;
      return c;
  }

  vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
      float s = StaticDrops(uv, t)*l0; 
      vec2 m1 = DropLayer2(uv, t)*l1;
      vec2 m2 = DropLayer2(uv*1.85, t)*l2;
      
      float c = s+m1.x+m2.x;
      c = smoothstep(.3, 1., c);
      
      return vec2(c, max(m1.y*l0, m2.y*l1));
  }

  void main() {
      // Create a grid scaled by aspect ratio to make raindrops round
      vec2 p = v_texCoord * 2. - 1.;
      p.x *= u_resolution.x / u_resolution.y;

      float t = mod(u_time * 0.2, 7200.);
      t *= (0.5 + u_rainAmount * 1.5);
      
      float l0 = u_rainAmount; 
      float l1 = u_rainAmount * 0.8;
      float l2 = u_rainAmount * 0.5;
      
      vec2 drops = Drops(p, t, l0, l1, l2);
      
      vec2 e = vec2(.001, 0.);
      float cx = Drops(p+e, t, l0, l1, l2).x;
      float cy = Drops(p+e.yx, t, l0, l1, l2).x;
      vec2 n = vec2(cx-drops.x, cy-drops.x);
      
      vec2 uv = v_texCoord;
      uv += n * u_refraction;

      vec4 col = vec4(0.0);
      if (u_blur > 0.0) {
          float b = u_blur * 0.05;
          col += texture2D(u_tex0, uv + vec2(-b, -b));
          col += texture2D(u_tex0, uv + vec2( 0, -b));
          col += texture2D(u_tex0, uv + vec2( b, -b));
          col += texture2D(u_tex0, uv + vec2(-b,  0));
          col += texture2D(u_tex0, uv + vec2( 0,  0));
          col += texture2D(u_tex0, uv + vec2( b,  0));
          col += texture2D(u_tex0, uv + vec2(-b,  b));
          col += texture2D(u_tex0, uv + vec2( 0,  b));
          col += texture2D(u_tex0, uv + vec2( b,  b));
          col /= 9.0;
      } else {
          col = texture2D(u_tex0, uv);
      }
      
      gl_FragColor = col;
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vShader: string, fShader: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vShader);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fShader);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function RainShaderWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [showControls, setShowControls] = useState(false);
  const [rainAmount, setRainAmount] = useState(0.8);
  const [blur, setBlur] = useState(0.3);
  const [refraction, setRefraction] = useState(0.05);

  const [marThreshold, setMarThreshold] = useState(0.25);
  const [smoothingFactor, setSmoothingFactor] = useState(0.55);

  const [mediaType, setMediaType] = useState<'gradient' | 'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>('https://raw.githubusercontent.com/shiy92928-sketch/picture/main/60e60a16-54d3-4788-a823-b0c44296caa7.png');

  const defaultCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const timeLoc = gl.getUniformLocation(program, "u_time");
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const rainLoc = gl.getUniformLocation(program, "u_rainAmount");
    const blurLoc = gl.getUniformLocation(program, "u_blur");
    const refrLoc = gl.getUniformLocation(program, "u_refraction");
    const texLoc = gl.getUniformLocation(program, "u_tex0");

    let animationId: number;
    const startTime = performance.now();

    // Default gradient drawer
    const drawGradient = (outCanvas: HTMLCanvasElement, time: number) => {
      const ctx = outCanvas.getContext('2d');
      if (!ctx) return;
      outCanvas.width = 512;
      outCanvas.height = 512;
      const gradient = ctx.createLinearGradient(
        Math.sin(time) * 256 + 256, 0,
        256, Math.cos(time) * 256 + 256
      );
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    };

    const render = (now: number) => {
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      // Update texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      if (mediaType === 'video' && videoRef.current && videoRef.current.readyState >= 2) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoRef.current);
      } else if (mediaType === 'image' && imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgRef.current);
      } else {
        if (defaultCanvasRef.current) {
          drawGradient(defaultCanvasRef.current, now * 0.001);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, defaultCanvasRef.current);
        }
      }

      gl.uniform1i(texLoc, 0);
      gl.uniform1f(timeLoc, (now - startTime) * 0.001);
      gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
      
      // Update parameters
      gl.uniform1f(rainLoc, rainAmount);
      gl.uniform1f(blurLoc, blur);
      gl.uniform1f(refrLoc, refraction);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      gl.deleteProgram(program);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
    };
  }, [mediaType, rainAmount, blur, refraction]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) {
      setMediaType('video');
      setMediaUrl(url);
    } else if (file.type.startsWith('image/')) {
      setMediaType('image');
      setMediaUrl(url);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <canvas ref={defaultCanvasRef} className="hidden" />
      
      <FogLayer 
        marThreshold={marThreshold} 
        smoothingFactor={smoothingFactor} 
      />

      {mediaType === 'video' && mediaUrl && (
        <video 
          ref={videoRef} 
          src={mediaUrl} 
          crossOrigin="anonymous" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="hidden" 
        />
      )}
      {mediaType === 'image' && mediaUrl && (
        <img ref={imgRef} src={mediaUrl} crossOrigin="anonymous" className="hidden" alt="bg" />
      )}

      {/* Control Panel Toggle */}
      <div className="absolute bottom-8 right-8 z-[70] flex flex-col items-end gap-4">
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 w-[280px] shadow-2xl flex flex-col gap-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="text-white/60" size={18} />
                <span className="text-white font-medium tracking-wide">Configuration</span>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-white/50 font-medium">
                    <Droplets size={14} /> Rain Intensity
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={rainAmount} 
                    onChange={e => setRainAmount(parseFloat(e.target.value))} 
                    className="w-full accent-white" 
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-white/50 font-medium">
                    <CloudFog size={14} /> Window Fog
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={blur} 
                    onChange={e => setBlur(parseFloat(e.target.value))} 
                    className="w-full accent-white" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-white/50 font-medium">
                    <Eye size={14} /> Refraction Index
                  </label>
                  <input 
                    type="range" min="0" max="0.2" step="0.01" 
                    value={refraction} 
                    onChange={e => setRefraction(parseFloat(e.target.value))} 
                    className="w-full accent-white" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-white/50 font-medium">
                    <Wind size={14} /> Breath Detection Sensitivity (MAR)
                  </label>
                  <input 
                    type="range" min="0.1" max="0.5" step="0.01" 
                    value={marThreshold} 
                    onChange={e => setMarThreshold(parseFloat(e.target.value))} 
                    className="w-full accent-white" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-white/50 font-medium">
                    <Activity size={14} /> Wiping Smoothing Factor
                  </label>
                  <input 
                    type="range" min="0.01" max="0.5" step="0.01" 
                    value={smoothingFactor} 
                    onChange={e => setSmoothingFactor(parseFloat(e.target.value))} 
                    className="w-full accent-white" 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setShowControls(!showControls)}
          className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 shadow-xl rounded-full text-white transition-all transform hover:scale-105"
        >
          <Settings2 size={24} />
        </button>
      </div>
    </div>
  );
}

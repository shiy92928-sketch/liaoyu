export class AudioEngine {
  private ctx: AudioContext | null = null;
  private rainNode: any = null;
  private windNode: any = null;
  private fireNode: any = null;
  private musicNode: any = null;

  private rainGainNode: GainNode | null = null;
  private windGainNode: GainNode | null = null;
  private fireGainNode: GainNode | null = null;
  private fireCrackleGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setRainVolume(vol: number) {
    if (this.rainGainNode && this.ctx) {
      this.rainGainNode.gain.setTargetAtTime(vol * 0.05, this.ctx.currentTime, 0.1);
    }
  }

  setWindVolume(vol: number) {
    if (this.windGainNode && this.ctx) {
      this.windGainNode.gain.setTargetAtTime(vol * 0.08, this.ctx.currentTime, 0.1);
    }
  }

  setFireVolume(vol: number) {
    if (this.fireGainNode && this.fireCrackleGainNode && this.ctx) {
      this.fireGainNode.gain.setTargetAtTime(vol * 0.05, this.ctx.currentTime, 0.1);
      this.fireCrackleGainNode.gain.setTargetAtTime(vol * 0.15, this.ctx.currentTime, 0.1);
    }
  }

  setMusicVolume(vol: number) {
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setTargetAtTime(vol * 0.1, this.ctx.currentTime, 0.1);
    }
  }

  toggleRain(play: boolean, vol: number = 1) {
    if (play) {
      this.initCtx();
      if (!this.rainNode && this.ctx) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter1 = this.ctx.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.value = 1000;
        
        const filter2 = this.ctx.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.value = 200;

        noiseSource.connect(filter1);
        filter1.connect(filter2);
        
        const gain = this.ctx.createGain();
        gain.gain.value = vol * 0.05;
        filter2.connect(gain);
        gain.connect(this.ctx.destination);
        noiseSource.start();

        this.rainGainNode = gain;

        this.rainNode = {
          stop: () => {
            noiseSource.stop();
            gain.disconnect();
            this.rainGainNode = null;
          }
        };
      }
    } else if (this.rainNode) {
      this.rainNode.stop();
      this.rainNode = null;
    }
  }

  toggleWind(play: boolean, vol: number = 1) {
    if (play) {
      this.initCtx();
      if (!this.windNode && this.ctx) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        noiseSource.connect(filter);
        const gain = this.ctx.createGain();
        gain.gain.value = vol * 0.08;
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noiseSource.start();
        
        this.windGainNode = gain;

        this.windNode = {
          stop: () => {
            noiseSource.stop();
            lfo.stop();
            gain.disconnect();
            this.windGainNode = null;
          }
        };
      }
    } else if (this.windNode) {
      this.windNode.stop();
      this.windNode = null;
    }
  }

  toggleFire(play: boolean, vol: number = 1) {
    if (play) {
      this.initCtx();
      if (!this.fireNode && this.ctx) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        noiseSource.connect(filter);
        const gain = this.ctx.createGain();
        gain.gain.value = vol * 0.05;
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noiseSource.start();
        this.fireGainNode = gain;

        const crackleBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
        const crackleData = crackleBuffer.getChannelData(0);
        for (let i = 0; i < crackleData.length; i++) {
          if (Math.random() > 0.997) {
            crackleData[i] = Math.random() * 2 - 1;
          } else {
            crackleData[i] = 0;
          }
        }
        const crackleSource = this.ctx.createBufferSource();
        crackleSource.buffer = crackleBuffer;
        crackleSource.loop = true;

        const crackleFilter = this.ctx.createBiquadFilter();
        crackleFilter.type = 'bandpass';
        crackleFilter.frequency.value = 1500;
        crackleSource.connect(crackleFilter);
        
        const crackleGain = this.ctx.createGain();
        crackleGain.gain.value = vol * 0.15;
        crackleFilter.connect(crackleGain);
        crackleGain.connect(this.ctx.destination);
        crackleSource.start();
        this.fireCrackleGainNode = crackleGain;

        this.fireNode = {
          stop: () => {
            noiseSource.stop();
            crackleSource.stop();
            gain.disconnect();
            crackleGain.disconnect();
            this.fireGainNode = null;
            this.fireCrackleGainNode = null;
          }
        };
      }
    } else if (this.fireNode) {
      this.fireNode.stop();
      this.fireNode = null;
    }
  }

  toggleMusic(play: boolean, vol: number = 1, songChoice: number = 0) {
    if (play) {
      this.initCtx();
      if (!this.musicNode && this.ctx) {
        const ctx = this.ctx;
        
        // Define 4 different songs/scales
        const SONGS = [
          [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // 1. C Major Pentatonic (Peaceful)
          [261.63, 277.18, 311.13, 349.23, 392.00, 415.30], // 2. C Minor (Mysterious)
          [261.63, 329.63, 392.00, 493.88, 523.25, 659.25], // 3. Cmaj7 Arps (Uplifting)
          [261.63, 293.66, 349.23, 392.00, 466.16, 523.25], // 4. C minor pentatonic (Zen)
        ];
        
        const notes = SONGS[songChoice % SONGS.length];

        let timeoutId: any;
        const mainGain = ctx.createGain();
        mainGain.gain.value = vol * 0.1;
        this.musicGainNode = mainGain;
        
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.5;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.4;
        const filter = ctx.createBiquadFilter();
        filter.frequency.value = 1000;
        
        delay.connect(feedback);
        feedback.connect(filter);
        filter.connect(delay);
        
        mainGain.connect(delay);
        delay.connect(ctx.destination);
        mainGain.connect(ctx.destination);

        let activeOscs: any[] = [];

        const playNote = () => {
          const isChord = Math.random() > 0.7;
          
          const noteList = [notes[Math.floor(Math.random() * notes.length)]];
          if (isChord) {
            noteList.push(notes[Math.floor(Math.random() * notes.length)]);
          }

          noteList.forEach((noteFreq) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            const octave = Math.random() > 0.5 ? 1 : 0.5;
            osc.frequency.value = noteFreq * octave;
            
            const noteGain = ctx.createGain();
            noteGain.gain.setValueAtTime(0, ctx.currentTime);
            noteGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);
            noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 7);
            
            osc.connect(noteGain);
            noteGain.connect(mainGain);
            
            osc.start();
            osc.stop(ctx.currentTime + 7);
            activeOscs.push(osc);
          });

          timeoutId = setTimeout(playNote, Math.random() * 3000 + 3000);
        };
        playNote();

        this.musicNode = {
          stop: () => {
            clearTimeout(timeoutId);
            activeOscs.forEach(o => {
              try { o.stop(); } catch(e) {}
            });
            mainGain.disconnect();
            this.musicGainNode = null;
          }
        };
      }
    } else if (this.musicNode) {
      this.musicNode.stop();
      this.musicNode = null;
    }
  }

  stopAll() {
    this.toggleRain(false);
    this.toggleWind(false);
    this.toggleFire(false);
    this.toggleMusic(false);
  }
}

export const audioEngine = new AudioEngine();

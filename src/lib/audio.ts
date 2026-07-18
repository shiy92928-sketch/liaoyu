export class AudioEngine {
  private ctx: AudioContext | null = null;
  private rainAudioElement: HTMLAudioElement | null = null;
  private windAudioElement: HTMLAudioElement | null = null;
  private fireAudioElement: HTMLAudioElement | null = null;
  private musicAudioElement: HTMLAudioElement | null = null;

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
    if (this.rainAudioElement) {
      this.rainAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
    }
  }

  setWindVolume(vol: number) {
    if (this.windAudioElement) {
      this.windAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
    }
  }

  setFireVolume(vol: number) {
    if (this.fireAudioElement) {
      this.fireAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
    }
  }

  setMusicVolume(vol: number) {
    if (this.musicAudioElement) {
      this.musicAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
    }
  }

  toggleRain(play: boolean, vol: number = 1) {
    if (play) {
      if (!this.rainAudioElement) {
        this.rainAudioElement = new Audio('https://raw.githubusercontent.com/shiy92928-sketch/picture/main/%E7%99%BD%E5%99%AA%E9%9F%B3%E9%9B%A8%E5%A3%B0(1).mp3');
        this.rainAudioElement.loop = true;
      }
      this.rainAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
      this.rainAudioElement.play().catch(() => {});
    } else {
      if (this.rainAudioElement) {
        this.rainAudioElement.pause();
      }
    }
  }

  toggleWind(play: boolean, vol: number = 1) {
    if (play) {
      if (!this.windAudioElement) {
        this.windAudioElement = new Audio('https://raw.githubusercontent.com/shiy92928-sketch/picture/main/%E7%99%BD%E5%99%AA%E9%9F%B3%E9%A3%8E%E5%A3%B0.mp3');
        this.windAudioElement.loop = true;
      }
      this.windAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
      this.windAudioElement.play().catch(() => {});
    } else {
      if (this.windAudioElement) {
        this.windAudioElement.pause();
      }
    }
  }

  toggleFire(play: boolean, vol: number = 1) {
    if (play) {
      if (!this.fireAudioElement) {
        this.fireAudioElement = new Audio('https://raw.githubusercontent.com/shiy92928-sketch/picture/main/%E7%99%BD%E5%99%AA%E9%9F%B3%E7%81%AB%E6%9F%B4.mp3');
        this.fireAudioElement.loop = true;
      }
      this.fireAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
      this.fireAudioElement.play().catch(() => {});
    } else {
      if (this.fireAudioElement) {
        this.fireAudioElement.pause();
      }
    }
  }

  toggleMusic(play: boolean, vol: number = 1) {
    if (play) {
      if (this.musicAudioElement) {
        this.musicAudioElement.pause();
      }
      this.musicAudioElement = new Audio('https://raw.githubusercontent.com/shiy92928-sketch/picture/main/%E4%B8%BB%E9%A1%B5%E8%83%8C%E6%99%AF%E9%9F%B3%E4%B9%90.mp3');
      this.musicAudioElement.loop = true;
      this.musicAudioElement.volume = Math.max(0, Math.min(1, vol * 0.5));
      this.musicAudioElement.play().catch(() => {});
    } else {
      if (this.musicAudioElement) {
        this.musicAudioElement.pause();
      }
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

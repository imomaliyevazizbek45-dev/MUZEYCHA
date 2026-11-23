import type { MusicMood } from '../types/museum';

/**
 * Procedural Web Audio synthesizer for Muzeycha.uz:
 * - Warm romantic felt piano / strings / music box melodies
 * - Subtle soft footstep taps and artwork discovery chime
 */
export class AmbientMuseumAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timerId: number | null = null;
  private stepIndex = 0;
  private muted = true;
  private mood: MusicMood = 'romantic-piano';
  private lastStepTime = 0;

  // Romantic progression: Fmaj7 -> G6 -> Em7 -> Am7 -> Dm7 -> G7 -> Cmaj7 -> C6
  private readonly chords: number[][] = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [196.0, 246.94, 293.66, 329.63], // G6
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.22;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMood(mood: MusicMood): void {
    this.mood = mood;
    if (mood === 'silent') {
      this.stopMusicLoop();
    } else if (!this.muted) {
      this.startMusicLoop();
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.22, now, 0.08);

    if (muted) {
      this.stopMusicLoop();
    } else if (this.mood !== 'silent') {
      this.startMusicLoop();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private startMusicLoop(): void {
    if (this.timerId !== null) return;
    this.scheduleNextNote();
    this.timerId = window.setInterval(() => {
      if (!this.muted && this.mood !== 'silent') {
        this.scheduleNextNote();
      }
    }, 640);
  }

  private stopMusicLoop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleNextNote(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted || this.mood === 'silent') return;

    const chordIdx = Math.floor(this.stepIndex / 4) % this.chords.length;
    const noteInChord = this.stepIndex % 4;
    const chord = this.chords[chordIdx];

    // Play bass warmth on beat 0
    if (noteInChord === 0) {
      this.playTone(chord[0] * 0.5, 2.2, 0.09, 'sine');
    }

    const freq = chord[noteInChord] * (this.mood === 'music-box' ? 2 : 1);
    if (this.mood === 'warm-strings') {
      this.playTone(freq, 1.8, 0.06, 'triangle');
    } else if (this.mood === 'music-box') {
      this.playTone(freq, 1.1, 0.075, 'sine');
    } else {
      // Felt piano: gentle triangle + soft sine harmonic
      this.playTone(freq, 1.5, 0.085, 'triangle');
      this.playTone(freq * 2, 0.8, 0.02, 'sine');
    }

    this.stepIndex++;
  }

  private playTone(
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.mood === 'music-box' ? 3200 : 1250, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  public playFootstep(): void {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastStepTime < 340) return;
    this.lastStepTime = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playDiscoverChime(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.playTone(659.25, 0.55, 0.04, 'sine');
    window.setTimeout(() => {
      if (!this.muted) this.playTone(987.77, 0.7, 0.035, 'sine');
    }, 90);
  }

  public dispose(): void {
    this.stopMusicLoop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

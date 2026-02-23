/**
 * Audio Manager
 *
 * Lightweight sound management using Howler.js.
 * Supports mute toggle and volume control with localStorage persistence.
 */

import { Howl } from 'howler';

// Sound IDs for type safety
export type SoundId = 'harvest' | 'sell' | 'buy' | 'click' | 'levelup';

// Sound configuration
interface SoundConfig {
  src: string[];
  volume: number;
}

const SOUND_CONFIGS: Record<SoundId, SoundConfig> = {
  harvest: {
    src: ['/sounds/harvest.mp3'],
    volume: 0.5,
  },
  sell: {
    src: ['/sounds/sell.mp3'],
    volume: 0.4,
  },
  buy: {
    src: ['/sounds/buy.mp3'],
    volume: 0.4,
  },
  click: {
    src: ['/sounds/click.mp3'],
    volume: 0.3,
  },
  levelup: {
    src: ['/sounds/levelup.mp3'],
    volume: 0.5,
  },
};

const STORAGE_KEY = 'side-hustle-audio-muted';

class AudioManager {
  private sounds: Map<SoundId, Howl> = new Map();
  private muted: boolean;
  private volume: number = 1.0;
  private initialized: boolean = false;

  constructor() {
    // Load mute state from localStorage
    this.muted = this.loadMutedState();
  }

  /**
   * Initialize sounds lazily (call on first user interaction)
   */
  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Pre-load all sounds
    for (const [id, config] of Object.entries(SOUND_CONFIGS)) {
      const howl = new Howl({
        src: config.src,
        volume: config.volume * this.volume,
        preload: true,
      });
      this.sounds.set(id as SoundId, howl);
    }
  }

  /**
   * Play a sound by ID
   */
  play(soundId: SoundId): void {
    // Initialize on first play (user interaction required for audio)
    this.init();

    if (this.muted) return;

    const sound = this.sounds.get(soundId);
    if (sound) {
      sound.play();
    }
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    this.saveMutedState(muted);
  }

  /**
   * Get current muted state
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Set global volume (0.0 - 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    // Update all loaded sounds
    for (const [id, config] of Object.entries(SOUND_CONFIGS)) {
      const sound = this.sounds.get(id as SoundId);
      if (sound) {
        sound.volume(config.volume * this.volume);
      }
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  private loadMutedState(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  }

  private saveMutedState(muted: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY, String(muted));
    } catch {
      // Ignore localStorage errors
    }
  }
}

// Singleton instance
export const audio = new AudioManager();

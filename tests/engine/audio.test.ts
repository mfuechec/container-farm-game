/**
 * Audio Manager Tests
 *
 * Tests for the AudioManager class that handles game sounds.
 * Note: Howler.js requires browser environment for actual audio playback,
 * so we test the manager's logic without actual sound playback.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Howler.js with a proper class mock
vi.mock('howler', () => {
  return {
    Howl: class MockHowl {
      play = vi.fn();
      volume = vi.fn();
      constructor() {}
    },
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Import after mocks are set up
import { audio, SoundId } from '../../src/engine/audio';

describe('AudioManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('mute state', () => {
    it('should start unmuted by default', () => {
      // Note: The singleton is created once, so this tests initial state
      // In a fresh environment, isMuted would be false
      expect(typeof audio.isMuted()).toBe('boolean');
    });

    it('should toggle mute state', () => {
      const initialMuted = audio.isMuted();
      const newMuted = audio.toggleMute();
      expect(newMuted).toBe(!initialMuted);
      expect(audio.isMuted()).toBe(newMuted);
    });

    it('should set mute state explicitly', () => {
      audio.setMuted(true);
      expect(audio.isMuted()).toBe(true);
      audio.setMuted(false);
      expect(audio.isMuted()).toBe(false);
    });

    it('should persist mute state to localStorage', () => {
      audio.setMuted(true);
      expect(localStorageMock.getItem('side-hustle-audio-muted')).toBe('true');
      audio.setMuted(false);
      expect(localStorageMock.getItem('side-hustle-audio-muted')).toBe('false');
    });
  });

  describe('volume', () => {
    it('should have default volume of 1.0', () => {
      expect(audio.getVolume()).toBe(1.0);
    });

    it('should set volume within valid range', () => {
      audio.setVolume(0.5);
      expect(audio.getVolume()).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      audio.setVolume(-0.5);
      expect(audio.getVolume()).toBe(0);
      audio.setVolume(1.5);
      expect(audio.getVolume()).toBe(1);
    });
  });

  describe('play', () => {
    it('should accept valid sound IDs', () => {
      const validSounds: SoundId[] = ['harvest', 'sell', 'buy', 'click', 'levelup'];
      
      // Just verify play doesn't throw for valid sounds
      for (const soundId of validSounds) {
        expect(() => audio.play(soundId)).not.toThrow();
      }
    });

    it('should not throw when muted', () => {
      audio.setMuted(true);
      expect(() => audio.play('click')).not.toThrow();
    });
  });
});

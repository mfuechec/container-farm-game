#!/usr/bin/env python3
"""
Generate simple game sound effects using sine waves.
Creates small, pleasant sounds for: harvest, sell, buy, click, levelup
"""

import struct
import wave
import math
import os
import subprocess

def generate_tone(filename, frequencies, duration_ms, volume=0.5, fade_out=True):
    """Generate a simple tone or chord."""
    sample_rate = 44100
    num_samples = int(sample_rate * duration_ms / 1000)
    
    samples = []
    for i in range(num_samples):
        t = i / sample_rate
        # Combine all frequencies
        value = 0
        for freq, amp in frequencies:
            value += amp * math.sin(2 * math.pi * freq * t)
        
        # Normalize by number of frequencies
        value = value / len(frequencies)
        
        # Apply envelope
        attack = min(i / (sample_rate * 0.01), 1)  # 10ms attack
        if fade_out:
            decay = 1 - (i / num_samples)  # Linear fade out
        else:
            decay = 1
        
        value = value * volume * attack * decay
        
        # Convert to 16-bit integer
        sample = int(value * 32767)
        sample = max(-32768, min(32767, sample))
        samples.append(sample)
    
    # Write WAV file
    wav_path = filename.replace('.mp3', '.wav')
    with wave.open(wav_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for sample in samples:
            wav.writeframes(struct.pack('<h', sample))
    
    # Convert to MP3 using ffmpeg if available
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', filename],
            capture_output=True,
            check=True
        )
        os.remove(wav_path)
        print(f"Created {filename}")
    except (FileNotFoundError, subprocess.CalledProcessError):
        # ffmpeg not available, rename wav to mp3 (browsers can usually play it)
        os.rename(wav_path, filename)
        print(f"Created {filename} (as wav)")

def generate_pop(filename, duration_ms=80, volume=0.6):
    """Generate a satisfying pop sound for harvesting."""
    sample_rate = 44100
    num_samples = int(sample_rate * duration_ms / 1000)
    
    samples = []
    base_freq = 800
    
    for i in range(num_samples):
        t = i / sample_rate
        progress = i / num_samples
        
        # Frequency drops quickly (pop effect)
        freq = base_freq * (1 - progress * 0.7)
        
        value = math.sin(2 * math.pi * freq * t)
        
        # Quick attack, exponential decay
        attack = min(i / (sample_rate * 0.005), 1)  # 5ms attack
        decay = math.exp(-progress * 5)  # Exponential decay
        
        value = value * volume * attack * decay
        
        sample = int(value * 32767)
        sample = max(-32768, min(32767, sample))
        samples.append(sample)
    
    wav_path = filename.replace('.mp3', '.wav')
    with wave.open(wav_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for sample in samples:
            wav.writeframes(struct.pack('<h', sample))
    
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', filename],
            capture_output=True,
            check=True
        )
        os.remove(wav_path)
        print(f"Created {filename}")
    except:
        os.rename(wav_path, filename)
        print(f"Created {filename} (as wav)")

def generate_coin(filename, duration_ms=150, volume=0.5):
    """Generate a coin/cash sound."""
    sample_rate = 44100
    num_samples = int(sample_rate * duration_ms / 1000)
    
    samples = []
    
    for i in range(num_samples):
        t = i / sample_rate
        progress = i / num_samples
        
        # Two tones that create a coin-like ring
        freq1 = 1200
        freq2 = 1800
        
        value = 0.5 * math.sin(2 * math.pi * freq1 * t) + \
                0.5 * math.sin(2 * math.pi * freq2 * t)
        
        # Metallic shimmer - slight frequency modulation
        shimmer = 1 + 0.02 * math.sin(2 * math.pi * 80 * t)
        value = math.sin(2 * math.pi * freq1 * shimmer * t) * 0.5 + \
                math.sin(2 * math.pi * freq2 * shimmer * t) * 0.5
        
        # Quick attack, ring decay
        attack = min(i / (sample_rate * 0.002), 1)
        decay = math.exp(-progress * 4)
        
        value = value * volume * attack * decay
        
        sample = int(value * 32767)
        sample = max(-32768, min(32767, sample))
        samples.append(sample)
    
    wav_path = filename.replace('.mp3', '.wav')
    with wave.open(wav_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for sample in samples:
            wav.writeframes(struct.pack('<h', sample))
    
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', filename],
            capture_output=True,
            check=True
        )
        os.remove(wav_path)
        print(f"Created {filename}")
    except:
        os.rename(wav_path, filename)
        print(f"Created {filename} (as wav)")

def generate_click(filename, duration_ms=30, volume=0.4):
    """Generate a subtle UI click."""
    sample_rate = 44100
    num_samples = int(sample_rate * duration_ms / 1000)
    
    samples = []
    
    for i in range(num_samples):
        t = i / sample_rate
        progress = i / num_samples
        
        # Short percussive click
        freq = 2000 * (1 - progress * 0.5)
        value = math.sin(2 * math.pi * freq * t)
        
        # Very quick decay
        decay = math.exp(-progress * 10)
        
        value = value * volume * decay
        
        sample = int(value * 32767)
        sample = max(-32768, min(32767, sample))
        samples.append(sample)
    
    wav_path = filename.replace('.mp3', '.wav')
    with wave.open(wav_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for sample in samples:
            wav.writeframes(struct.pack('<h', sample))
    
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', filename],
            capture_output=True,
            check=True
        )
        os.remove(wav_path)
        print(f"Created {filename}")
    except:
        os.rename(wav_path, filename)
        print(f"Created {filename} (as wav)")

def generate_chime(filename, duration_ms=400, volume=0.5):
    """Generate a pleasant level-up chime."""
    sample_rate = 44100
    num_samples = int(sample_rate * duration_ms / 1000)
    
    samples = []
    
    # Rising arpeggio: C5, E5, G5
    notes = [
        (523, 0, 0.15),    # C5
        (659, 0.08, 0.15), # E5
        (784, 0.16, 0.25), # G5 (longer)
    ]
    
    for i in range(num_samples):
        t = i / sample_rate
        progress = i / num_samples
        
        value = 0
        for freq, start, dur in notes:
            note_progress = (t - start) / dur
            if 0 <= note_progress <= 1:
                note_amp = math.exp(-note_progress * 3)
                value += note_amp * math.sin(2 * math.pi * freq * t)
        
        value = value * volume
        
        sample = int(value * 32767)
        sample = max(-32768, min(32767, sample))
        samples.append(sample)
    
    wav_path = filename.replace('.mp3', '.wav')
    with wave.open(wav_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for sample in samples:
            wav.writeframes(struct.pack('<h', sample))
    
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', wav_path, '-b:a', '128k', filename],
            capture_output=True,
            check=True
        )
        os.remove(wav_path)
        print(f"Created {filename}")
    except:
        os.rename(wav_path, filename)
        print(f"Created {filename} (as wav)")


if __name__ == '__main__':
    sounds_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'sounds')
    os.makedirs(sounds_dir, exist_ok=True)
    
    print("Generating game sounds...")
    
    # Harvest pop
    generate_pop(os.path.join(sounds_dir, 'harvest.mp3'))
    
    # Sell / cash register
    generate_coin(os.path.join(sounds_dir, 'sell.mp3'), duration_ms=200, volume=0.5)
    
    # Buy / coin
    generate_coin(os.path.join(sounds_dir, 'buy.mp3'), duration_ms=120, volume=0.4)
    
    # UI click
    generate_click(os.path.join(sounds_dir, 'click.mp3'))
    
    # Level up chime
    generate_chime(os.path.join(sounds_dir, 'levelup.mp3'))
    
    print("Done!")

'use client';

import { useCallback, useRef, useEffect } from 'react';

interface SoundOptions {
  volume?: number;
  enabled?: boolean;
}

export function useSoundFeedback(options: SoundOptions = {}) {
  const { volume = 0.5, enabled = true } = options;

  // Audio contexts
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    return () => {
      // Capture the current ref values to avoid stale closure issues
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const oscillator = oscillatorRef.current;
      const audioContext = audioContextRef.current;

      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  // Play success sound (rising tone)
  const playSuccess = useCallback(() => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configure success sound (two quick rising tones)
      const now = context.currentTime;

      // First beep
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

      // Second beep (higher)
      oscillator.frequency.setValueAtTime(1000, now + 0.15);
      oscillator.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

      // Volume envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.12);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.25);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

      // Play
      oscillator.start(now);
      oscillator.stop(now + 0.3);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }, [enabled, volume]);

  // Play error sound (falling tone)
  const playError = useCallback(() => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configure error sound (descending buzzer)
      const now = context.currentTime;

      // Buzzing error sound
      oscillator.frequency.setValueAtTime(300, now);
      oscillator.frequency.linearRampToValueAtTime(150, now + 0.3);

      // Add some dissonance for error effect
      const oscillator2 = context.createOscillator();
      oscillator2.connect(gainNode);
      oscillator2.frequency.setValueAtTime(305, now);
      oscillator2.frequency.linearRampToValueAtTime(155, now + 0.3);

      // Volume envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + 0.28);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

      // Play
      oscillator.start(now);
      oscillator2.start(now);
      oscillator.stop(now + 0.3);
      oscillator2.stop(now + 0.3);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        oscillator2.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error('Error playing error sound:', error);
    }
  }, [enabled, volume]);

  // Play warning sound (medium tone beeps)
  const playWarning = useCallback(() => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configure warning sound (three short beeps)
      const now = context.currentTime;

      oscillator.frequency.setValueAtTime(600, now);

      // Three beeps
      gainNode.gain.setValueAtTime(0, now);

      // Beep 1
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.08);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.09);

      // Beep 2
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.22);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.23);

      // Beep 3
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.29);
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.36);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.37);

      // Play
      oscillator.start(now);
      oscillator.stop(now + 0.4);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error('Error playing warning sound:', error);
    }
  }, [enabled, volume]);

  // Play scan sound (quick beep)
  const playScan = useCallback(() => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configure scan sound (quick high beep)
      const now = context.currentTime;

      oscillator.frequency.setValueAtTime(1500, now);

      // Quick beep
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.06);

      // Play
      oscillator.start(now);
      oscillator.stop(now + 0.1);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error('Error playing scan sound:', error);
    }
  }, [enabled, volume]);

  return {
    playSuccess,
    playError,
    playWarning,
    playScan,
  };
}

// Hook with persistent settings
export function useSoundSettings() {
  const getSoundEnabled = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('soundFeedbackEnabled');
    return stored ? stored === 'true' : true;
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('soundFeedbackEnabled', enabled.toString());
  }, []);

  const getSoundVolume = useCallback(() => {
    if (typeof window === 'undefined') return 0.5;
    const stored = localStorage.getItem('soundFeedbackVolume');
    return stored ? parseFloat(stored) : 0.5;
  }, []);

  const setSoundVolume = useCallback((volume: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('soundFeedbackVolume', volume.toString());
  }, []);

  return {
    getSoundEnabled,
    setSoundEnabled,
    getSoundVolume,
    setSoundVolume,
  };
}

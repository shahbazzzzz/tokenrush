import { useCallback, useRef } from 'react';

// Web Audio API sound effects
export const useSound = () => {
  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    initAudio();
    if (!audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  }, [initAudio]);

  const playWinSound = useCallback(() => {
    playSound(523.25, 0.1); // C5
    setTimeout(() => playSound(659.25, 0.1), 100); // E5
    setTimeout(() => playSound(783.99, 0.2), 200); // G5
  }, [playSound]);

  const playLoseSound = useCallback(() => {
    playSound(220, 0.3, 'sawtooth'); // A3
  }, [playSound]);

  const playClickSound = useCallback(() => {
    playSound(587.33, 0.05); // D5
  }, [playSound]);

  const playCoinSound = useCallback(() => {
    playSound(880, 0.05); // A5
    setTimeout(() => playSound(1046.50, 0.1), 50); // C6
  }, [playSound]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return {
    playWinSound,
    playLoseSound,
    playClickSound,
    playCoinSound,
    vibrate,
  };
};

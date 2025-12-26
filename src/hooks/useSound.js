import { useCallback, useRef } from 'react';
import chachingSound from '@/../public/sounds/chaching01.mp3';
import errorSound from '@/../public/sounds/error.mp3';

const SOUND_THROTTLE_MS = 2000; // 2 second throttle for error sounds

export const useSound = () => {
  const lastPlayedRef = useRef({});

  const playSound = useCallback((soundPath, throttleKey = null) => {
    try {
      // Check throttle for specific sound types
      if (throttleKey) {
        const now = Date.now();
        const lastPlayed = lastPlayedRef.current[throttleKey];
        if (lastPlayed && now - lastPlayed < SOUND_THROTTLE_MS) {
          return; // Skip playing if within throttle window
        }
        lastPlayedRef.current[throttleKey] = now;
      }

      const audio = new Audio(soundPath);
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch((error) => {
        console.warn('Failed to play sound:', error);
      });
    } catch (error) {
      console.warn('Error creating audio element:', error);
    }
  }, []);

  const playOrderSuccess = useCallback(() => {
    playSound(chachingSound);
  }, [playSound]);

  const playErrorSound = useCallback(() => {
    playSound(errorSound, 'error'); // Throttle error sounds
  }, [playSound]);

  return {
    playSound,
    playOrderSuccess,
    playErrorSound,
  };
};

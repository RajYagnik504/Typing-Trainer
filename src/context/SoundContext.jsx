import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('tm_sound_enabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('tm_sound_volume');
    return saved ? parseFloat(saved) : 0.5;
  });

  const audioCtxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('tm_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('tm_sound_volume', JSON.stringify(volume));
  }, [volume]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playBeep = (freq = 440, type = 'sine', dur = 0.1) => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Attack & Release for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  };

  const playKeyClick = () => {
    // A short, percussive click sound
    playBeep(800, 'triangle', 0.05);
  };

  const playErrorBuzz = () => {
    // A lower, harsher buzz for errors
    playBeep(150, 'sawtooth', 0.15);
  };

  const playBubblePop = () => {
    // A high, pleasant pop
    playBeep(1200, 'sine', 0.1);
  };

  const playSuccessChime = () => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    
    const freqs = [440, 554.37, 659.25]; // A major chord
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume / 2, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    gainNode.connect(ctx.destination);

    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    });
  };

  const value = {
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    playKeyClick,
    playErrorBuzz,
    playBubblePop,
    playSuccessChime
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = () => useContext(SoundContext);

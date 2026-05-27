import { useState, useEffect, useCallback, useRef } from 'react';
import { useSound } from '../context/SoundContext';

export const useTypingEngine = (targetText) => {
  const { playKeyClick, playErrorBuzz } = useSound();
  
  const [typedText, setTypedText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, active, finished
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  
  // Metrics state
  const [errors, setErrors] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  
  // Detailed tracking
  const keyIntervals = useRef([]);
  const lastKeyTime = useRef(null);
  const consecutiveErrors = useRef(0);
  const errorBursts = useRef(0); // 3+ consecutive errors
  const slowKeys = useRef({}); // Track slow key presses
  const errorKeys = useRef({}); // Track error prone keys

  const startTest = useCallback(() => {
    setStatus('active');
    setStartTime(Date.now());
    setTypedText('');
    setErrors(0);
    setBackspaces(0);
    keyIntervals.current = [];
    lastKeyTime.current = null;
    consecutiveErrors.current = 0;
    errorBursts.current = 0;
    slowKeys.current = {};
    errorKeys.current = {};
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (status !== 'active') {
      if (status === 'idle' && e.key.length === 1) {
        startTest();
      } else {
        return;
      }
    }

    const isChar = e.key.length === 1;
    const isBackspace = e.key === 'Backspace';

    if (!isChar && !isBackspace) return;

    // Record timing
    const now = Date.now();
    if (lastKeyTime.current) {
      const interval = now - lastKeyTime.current;
      keyIntervals.current.push(interval);
      
      // Track slow keys (if interval > 400ms)
      if (interval > 400 && e.key.length === 1) {
        slowKeys.current[e.key] = (slowKeys.current[e.key] || 0) + 1;
      }
    }
    lastKeyTime.current = now;

    if (isBackspace) {
      setBackspaces(prev => prev + 1);
      setTypedText(prev => prev.slice(0, -1));
      playKeyClick();
      return;
    }

    const currentIndex = typedText.length;
    if (currentIndex >= targetText.length) return; // Prevent typing beyond length

    const expectedChar = targetText[currentIndex];
    
    if (e.key === expectedChar) {
      setTypedText(prev => prev + e.key);
      playKeyClick();
      consecutiveErrors.current = 0;
    } else {
      setTypedText(prev => prev + e.key); // still add it so it shows as red
      setErrors(prev => prev + 1);
      playErrorBuzz();
      
      // Track error-prone keys
      errorKeys.current[expectedChar] = (errorKeys.current[expectedChar] || 0) + 1;
      
      consecutiveErrors.current += 1;
      if (consecutiveErrors.current === 3) {
        errorBursts.current += 1;
      }
    }

    // Auto-finish if we reached the end
    if (currentIndex + 1 === targetText.length) {
      setStatus('finished');
      setEndTime(Date.now());
    }
  }, [status, targetText, typedText, playKeyClick, playErrorBuzz, startTest]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Derived Metrics
  const timeElapsedMs = status === 'finished' ? (endTime - startTime) : (status === 'active' ? Date.now() - startTime : 0);
  const timeElapsedMinutes = timeElapsedMs / 60000;
  
  // WPM Calculation (standard 5 chars per word)
  // We use correctly typed characters for WPM
  const correctChars = Math.max(0, typedText.length - errors);
  const wpm = timeElapsedMinutes > 0 ? Math.round((correctChars / 5) / timeElapsedMinutes) : 0;
  
  // Accuracy
  const accuracy = typedText.length > 0 ? Math.max(0, 1 - (errors / typedText.length)) : 1;
  
  // Rhythm Score (1 - (std dev / mean))
  let rhythmScore = 1;
  let avgResponseMs = 0;
  if (keyIntervals.current.length > 0) {
    const sum = keyIntervals.current.reduce((a, b) => a + b, 0);
    const mean = sum / keyIntervals.current.length;
    avgResponseMs = mean;
    
    const variance = keyIntervals.current.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / keyIntervals.current.length;
    const stdDev = Math.sqrt(variance);
    
    rhythmScore = mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 1;
  }
  
  const backspaceRate = targetText.length > 0 ? (backspaces / targetText.length) * 100 : 0;

  return {
    typedText,
    status,
    wpm,
    accuracy,
    avgResponseMs,
    rhythmScore,
    backspaceRate,
    errorBursts: errorBursts.current,
    timeElapsedMs,
    slowKeys: slowKeys.current,
    errorKeys: errorKeys.current,
    restart: () => {
      setStatus('idle');
      setTypedText('');
    }
  };
};

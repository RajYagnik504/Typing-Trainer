import { useState, useEffect, useCallback, useRef } from 'react';

export const useTypingEngine = (targetText, onComplete) => {
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | active | finished
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [backspaces, setBackspaces] = useState(0);

  const startTest = useCallback(() => {
    setTypedText('');
    setErrors(0);
    setBackspaces(0);
    setStatus('active');
    setStartTime(Date.now());
    setEndTime(null);
  }, []);

  const resetTest = useCallback(() => {
    setTypedText('');
    setErrors(0);
    setBackspaces(0);
    setStatus('idle');
    setStartTime(null);
    setEndTime(null);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (status === 'finished') return;
    if (e.key.length !== 1 && e.key !== 'Backspace') return;

    let start = startTime;
    if (status === 'idle') {
      start = Date.now();
      setStartTime(start);
      setStatus('active');
    }

    if (e.key === 'Backspace') {
      setBackspaces(prev => prev + 1);
      setTypedText(prev => prev.slice(0, -1));
      return;
    }

    setTypedText(prev => {
      const idx = prev.length;
      if (idx >= targetText.length) return prev;

      const isCorrect = e.key === targetText[idx];
      if (!isCorrect) {
        setErrors(err => err + 1);
      }

      const nextText = prev + e.key;

      if (nextText.length === targetText.length) {
        setStatus('finished');
        const finishTime = Date.now();
        setEndTime(finishTime);
        if (onComplete) {
          const durationMs = finishTime - start;
          const wpm = Math.round((targetText.length / 5) / (durationMs / 60000));
          const accuracy = Math.round((1 - (errors + (!isCorrect ? 1 : 0)) / targetText.length) * 100);
          onComplete({ wpm, accuracy, durationMs });
        }
      }

      return nextText;
    });
  }, [status, startTime, targetText, errors, onComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const timeElapsed = startTime ? Math.max(1, Math.round(((endTime || Date.now()) - startTime) / 1000)) : 0;
  const currentWpm = timeElapsed > 0 ? Math.round((typedText.length / 5) / (timeElapsed / 60)) : 0;
  const accuracyPct = targetText.length > 0 ? Math.round(Math.max(0, 1 - errors / targetText.length) * 100) : 100;

  return {
    typedText,
    errors,
    status,
    startTime,
    endTime,
    timeElapsed,
    currentWpm,
    accuracyPct,
    backspaces,
    startTest,
    resetTest
  };
};

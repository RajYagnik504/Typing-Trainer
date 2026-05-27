import React, { useState, useEffect, useCallback } from 'react';
import { useSound } from '../context/SoundContext';
import { Trophy, RefreshCcw } from 'lucide-react';

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const A2ZSpeed = ({ onComplete }) => {
  const { playKeyClick, playSuccessChime, playErrorBuzz } = useSound();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, active, finished
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [errorHighlight, setErrorHighlight] = useState(false);

  // Timer
  useEffect(() => {
    let interval;
    if (status === 'active') {
      interval = setInterval(() => {
        setElapsed((Date.now() - startTime) / 1000);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const handleKeyDown = useCallback((e) => {
    if (status === 'finished') return;
    
    // Ignore meta keys
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    
    const key = e.key.toLowerCase();
    
    if (status === 'idle' && key === 'a') {
      setStatus('active');
      setStartTime(Date.now());
      setCurrentIndex(1);
      playKeyClick();
      return;
    }
    
    if (status === 'active') {
      const targetKey = alphabet[currentIndex];
      
      if (key === targetKey) {
        playKeyClick();
        if (currentIndex === 25) { // 'z'
          setStatus('finished');
          setElapsed((Date.now() - startTime) / 1000);
          playSuccessChime();
          if (onComplete) {
            onComplete((Date.now() - startTime) / 1000);
          }
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (alphabet.includes(key)) { // Typed a wrong letter
        playErrorBuzz();
        setErrorHighlight(true);
        setTimeout(() => setErrorHighlight(false), 200);
      }
    }
  }, [status, currentIndex, startTime, playKeyClick, playSuccessChime, playErrorBuzz, onComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const reset = () => {
    setStatus('idle');
    setCurrentIndex(0);
    setElapsed(0);
    setStartTime(null);
  };

  const getRating = (time) => {
    if (time < 5) return { text: 'Godlike 👑', color: 'var(--accent-purple)' };
    if (time < 7) return { text: 'Lightning ⚡', color: 'var(--accent-amber)' };
    if (time < 10) return { text: 'Fast 🔥', color: 'var(--accent-red)' };
    if (time < 15) return { text: 'Good 👍', color: 'var(--accent-teal)' };
    return { text: 'Keep Practicing', color: 'var(--text-secondary)' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>A-Z Speed Challenge</h3>
        <div style={styles.timer}>{elapsed.toFixed(2)}s</div>
      </div>
      
      <div className={`glass-panel ${errorHighlight ? 'error-shake' : ''}`} style={{
        ...styles.gameBoard,
        borderColor: errorHighlight ? 'var(--accent-red)' : 'var(--glass-border)'
      }}>
        
        {status === 'finished' ? (
          <div style={styles.resultView}>
            <Trophy size={48} color={getRating(elapsed).color} style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{elapsed.toFixed(2)} seconds</h2>
            <p style={{ fontSize: '1.5rem', color: getRating(elapsed).color, fontWeight: 'bold' }}>
              {getRating(elapsed).text}
            </p>
            <button style={styles.restartBtn} onClick={reset}>
              <RefreshCcw size={18} /> Play Again
            </button>
          </div>
        ) : (
          <>
            <div style={styles.instruction}>
              {status === 'idle' ? 'Type "a" to start' : `Type "${alphabet[currentIndex]}"`}
            </div>
            
            <div style={styles.alphabetGrid}>
              {alphabet.map((letter, i) => {
                const isPassed = i < currentIndex;
                const isCurrent = i === currentIndex;
                
                let color = 'var(--text-muted)';
                let glow = 'none';
                let scale = 1;
                
                if (isPassed) {
                  color = 'var(--accent-teal)';
                } else if (isCurrent && status === 'active') {
                  color = 'white';
                  glow = '0 0 10px rgba(255,255,255,0.5)';
                  scale = 1.2;
                }
                
                return (
                  <div key={letter} style={{
                    ...styles.letter,
                    color,
                    textShadow: glow,
                    transform: `scale(${scale})`,
                    fontWeight: isCurrent ? 'bold' : 'normal'
                  }}>
                    {letter.toUpperCase()}
                  </div>
                );
              })}
            </div>
            
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${(currentIndex / 26) * 100}%`
              }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timer: {
    fontSize: '1.5rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'bold',
    color: 'var(--accent-amber)',
  },
  gameBoard: {
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    minHeight: '350px',
    justifyContent: 'center',
    transition: 'border-color 0.2s',
  },
  instruction: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
  },
  alphabetGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'center',
    maxWidth: '600px',
  },
  letter: {
    fontSize: '1.5rem',
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    marginTop: '2rem',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--accent-teal)',
    boxShadow: 'var(--glow-teal)',
    transition: 'width 0.1s linear',
  },
  resultView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  restartBtn: {
    marginTop: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    borderRadius: 'var(--radius-full)',
    transition: 'all 0.2s',
  }
};

export default A2ZSpeed;

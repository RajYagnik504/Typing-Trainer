import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../context/SoundContext';
import { RefreshCcw, Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const rareLetters = ['q', 'x', 'z', 'j', 'v'];

const BubblePop = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gameRunning = useRef(false);
  
  const { playBubblePop, playErrorBuzz } = useSound();
  const { settings } = useAppContext();
  
  // React State (Strictly limited to metrics/UI overlays)
  const [gameState, setGameState] = useState('start'); // start, playing, gameover
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [accuracy, setAccuracy] = useState(100);

  // Game Loop State (Mutable Refs - ZERO RERENDERS during loop)
  const bubbles = useRef([]);
  const particles = useRef([]);
  const stats = useRef({
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    totalPops: 0,
    totalMisses: 0,
    totalErrors: 0,
    speedMultiplier: 1.0,
    lastSpawnTime: 0,
    reactionTimes: []
  });

  // Sync refs to React state sparingly
  const syncState = useCallback(() => {
    setScore(stats.current.score);
    setCombo(stats.current.combo);
    setLives(stats.current.lives);
    const total = stats.current.totalPops + stats.current.totalErrors + stats.current.totalMisses;
    setAccuracy(total === 0 ? 100 : Math.round((stats.current.totalPops / total) * 100));
  }, []);

  const spawnBubble = (timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adaptive difficulty scaling
    const baseSpawnRate = 1200;
    const minSpawnRate = 450;
    const currentSpawnRate = Math.max(minSpawnRate, baseSpawnRate - (stats.current.speedMultiplier * 150));
    
    if (timestamp - stats.current.lastSpawnTime > currentSpawnRate) {
      const letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      const isRare = rareLetters.includes(letter);
      
      // Avoid impossible bubble spam (overlap detection)
      let xPos = 0;
      let attempts = 0;
      let valid = false;
      while(!valid && attempts < 5) {
        xPos = 40 + Math.random() * (canvas.width - 80);
        valid = true;
        for (let b of bubbles.current) {
           if (b.y < 120 && Math.abs(b.x - xPos) < 60) {
              valid = false;
              break;
           }
        }
        attempts++;
      }

      bubbles.current.push({
        id: Math.random().toString(36).substr(2, 9),
        letter,
        x: xPos,
        y: -40,
        speed: (1.2 + Math.random() * 1.5) * stats.current.speedMultiplier,
        radius: isRare ? 20 : 26,
        createdAt: Date.now(), // Critical for ML metric: bubble_avg_ms
        isRare,
        color: isRare ? 'var(--accent-amber)' : 'var(--accent-teal)',
        hexColor: isRare ? '#EF9F27' : '#1D9E75'
      });
      stats.current.lastSpawnTime = timestamp;
    }
  };

  const createParticles = (x, y, color) => {
    // Performance-safe rendering
    if (settings.performanceMode === 'Minimal') return;
    
    const count = settings.performanceMode === 'High' ? 12 : 6;
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const gameLoop = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !gameRunning.current) return;

    // Performance Mode: Motion Trails vs Hard Clear
    if (settings.performanceMode === 'High') {
      ctx.fillStyle = 'rgba(10, 10, 12, 0.25)'; // Subtle motion trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    spawnBubble(timestamp);

    const now = Date.now();
    const pulse = Math.sin(now / 200) * 1.5; // Smooth bubble pulse animation

    // Render Bubbles
    for (let i = bubbles.current.length - 1; i >= 0; i--) {
      let b = bubbles.current[i];
      b.y += b.speed;

      // Soft neon glow
      if (settings.performanceMode !== 'Minimal') {
        ctx.shadowBlur = b.isRare ? 25 : 15;
        ctx.shadowColor = b.hexColor;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      const currentRadius = Math.max(5, b.radius + (settings.performanceMode === 'High' ? pulse : 0));
      ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = b.hexColor;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      
      // Premium Glass Highlight
      if (settings.performanceMode !== 'Minimal') {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(b.x - 6, b.y - 6, currentRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      }

      // Letter
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${b.isRare ? 18 : 22}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.letter.toUpperCase(), b.x, b.y + 1);

      // Miss Logic
      if (b.y > canvas.height + b.radius) {
        bubbles.current.splice(i, 1);
        stats.current.lives -= 1;
        stats.current.combo = 0;
        stats.current.totalMisses += 1;
        // Decrease speed slightly on miss
        stats.current.speedMultiplier = Math.max(1.0, stats.current.speedMultiplier - 0.2);
        
        playErrorBuzz();
        syncState();

        if (stats.current.lives <= 0) {
          endGame();
          return; // Stop processing this frame
        }
      }
    }

    // Render Particles
    ctx.shadowBlur = 0;
    for (let i = particles.current.length - 1; i >= 0; i--) {
      let p = particles.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04; // smooth fade

      if (p.life <= 0) {
        particles.current.splice(i, 1);
      } else {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [settings.performanceMode, playErrorBuzz, syncState]);

  const handleKeyPress = useCallback((e) => {
    if (!gameRunning.current) return;
    const key = e.key.toLowerCase();
    if (key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;

    let matchedIndex = -1;
    let max_y = -100;
    
    // Find the lowest matching bubble to pop
    for (let i = 0; i < bubbles.current.length; i++) {
      if (bubbles.current[i].letter === key && bubbles.current[i].y > max_y) {
        max_y = bubbles.current[i].y;
        matchedIndex = i;
      }
    }

    if (matchedIndex !== -1) {
      // Correct Pop
      const b = bubbles.current[matchedIndex];
      createParticles(b.x, b.y, b.hexColor);
      bubbles.current.splice(matchedIndex, 1);
      
      // Calculate ML Metric: bubble_avg_ms
      const reactionTime = Date.now() - b.createdAt;
      stats.current.reactionTimes.push(reactionTime);
      
      playBubblePop();
      
      stats.current.combo += 1;
      if (stats.current.combo > stats.current.maxCombo) {
         stats.current.maxCombo = stats.current.combo;
      }
      
      const comboMultiplier = Math.min(4, 1 + Math.floor(stats.current.combo / 10) * 0.5);
      const basePoints = b.isRare ? 30 : 10;
      stats.current.score += Math.floor(basePoints * comboMultiplier);
      
      stats.current.totalPops += 1;
      stats.current.speedMultiplier += 0.015; // Smooth scaling
      
      syncState();
    } else {
      // Wrong Key Penalty
      stats.current.combo = 0;
      stats.current.totalErrors += 1;
      playErrorBuzz();
      syncState();
    }
  }, [playBubblePop, playErrorBuzz, syncState, settings.performanceMode]);

  // Clean Keyboard Listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Clean Animation Frames
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Resize canvas handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 500;
      if (gameState !== 'playing') {
         const ctx = canvas.getContext('2d');
         if (ctx) ctx.clearRect(0,0, canvas.width, canvas.height);
      }
    }
  }, [gameState]);

  const startGame = () => {
    gameRunning.current = true;
    setGameState('playing');
    
    // Reset React UI State
    setScore(0);
    setCombo(0);
    setLives(3);
    setAccuracy(100);

    // Reset Mutable Engine State
    bubbles.current = [];
    particles.current = [];
    stats.current = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: 3,
      totalPops: 0,
      totalMisses: 0,
      totalErrors: 0,
      speedMultiplier: 1.0,
      lastSpawnTime: performance.now(),
      reactionTimes: []
    };
    
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 500;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(gameLoop);
    });
  };

  const endGame = () => {
    gameRunning.current = false;
    setGameState('gameover');
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    // Finalize ML metrics
    let bubble_avg_ms = 500; // default
    if (stats.current.reactionTimes.length > 0) {
      bubble_avg_ms = Math.round(stats.current.reactionTimes.reduce((a,b)=>a+b,0) / stats.current.reactionTimes.length);
    }
    
    if (onComplete) {
      onComplete({ 
        bubble_avg_ms,
        score: stats.current.score,
        accuracy
      });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.statsRow}>
          <div style={styles.statBox}>Score <span style={{color: 'var(--accent-teal)'}}>{score}</span></div>
          <div style={styles.statBox}>Combo <span style={{color: 'var(--accent-purple)'}}>x{combo}</span></div>
          <div style={styles.statBox}>Lives <span style={{color: 'var(--accent-red)'}}>{'❤️'.repeat(lives)}</span></div>
        </div>
      </div>
      
      <div className="glass-panel" style={styles.canvasContainer}>
        {/* Combo Glow Effect */}
        {combo > 15 && settings.performanceMode !== 'Minimal' && (
           <div style={styles.comboGlow}></div>
        )}
        
        <canvas 
          ref={canvasRef} 
          style={styles.canvas}
        />
        
        {gameState === 'start' && (
          <div style={styles.overlay}>
            <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>Type to pop falling bubbles</h2>
            <button style={styles.startBtn} onClick={startGame}>
              <Play size={20} /> Start Game
            </button>
          </div>
        )}
        
        {gameState === 'gameover' && (
          <div style={styles.overlay}>
            <h2 style={{fontSize: '2.5rem', color: 'var(--accent-red)', marginBottom: '1rem', textShadow: 'var(--glow-red)'}}>Game Over</h2>
            <div style={styles.finalStats}>
               <p>Score: <span style={{color: 'var(--accent-teal)'}}>{score}</span></p>
               <p>Max Combo: <span style={{color: 'var(--accent-purple)'}}>{stats.current.maxCombo}</span></p>
               <p>Accuracy: <span>{accuracy}%</span></p>
            </div>
            <button style={styles.startBtn} onClick={startGame}>
              <RefreshCcw size={20} /> Try Again
            </button>
          </div>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '0 1rem',
  },
  statsRow: {
    display: 'flex',
    gap: '2.5rem',
  },
  statBox: {
    fontSize: '1.25rem',
    fontWeight: '700',
    display: 'flex',
    gap: '0.5rem',
    color: 'var(--text-secondary)'
  },
  canvasContainer: {
    position: 'relative',
    width: '100%',
    height: '500px',
    overflow: 'hidden',
    backgroundColor: '#050505', // Deep space background
    borderRadius: 'var(--radius-lg)',
  },
  comboGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    boxShadow: 'inset 0 0 50px rgba(127, 119, 221, 0.3)',
    pointerEvents: 'none',
    zIndex: 1,
    animation: 'pulse 1s infinite'
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
    zIndex: 2,
    position: 'relative'
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 5, 5, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  finalStats: {
    display: 'flex',
    gap: '2rem',
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: '2rem',
    color: 'var(--text-secondary)'
  },
  startBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 2.5rem',
    backgroundColor: 'var(--accent-purple)',
    color: 'white',
    borderRadius: 'var(--radius-full)',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    boxShadow: 'var(--glow-purple)',
    transition: 'transform 0.1s, box-shadow 0.2s',
    border: 'none',
    cursor: 'pointer'
  }
};

export default BubblePop;

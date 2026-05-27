import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../context/SoundContext';
import { useAppContext } from '../context/AppContext';
import { Play, RefreshCcw, BarChart2 } from 'lucide-react';

/* ── Word Banks (tiered by length) ──────────────────────────────────────── */
const WORD_BANKS = {
  short: [
    'the','and','for','are','but','not','you','all','can','has',
    'run','pop','sun','fun','big','red','hot','cut','zip','joy',
    'log','map','net','box','sky','fly','aim','hit','key','tap',
  ],
  medium: [
    'about','after','great','house','learn','never','place','right',
    'small','sound','think','water','where','which','world','write',
    'young','light','night','fight','bring','clean','dream','green',
    'laser','neon','flash','speed','press','burst','track','rapid',
    'power','shift','focus','cyber','pixel','surge','pulse','blaze',
  ],
  long: [
    'keyboard','language','learning','movement','multiple','negative',
    'optimize','original','physical','possible','practice','presence',
    'beautiful','challenge','complete','continue','different','discover',
    'distance','dynamic','essential','function','important','magnetic',
  ],
  veryLong: [
    'understanding','concentration','extraordinary','determination',
    'communication','environmental','characteristics','professional',
    'transformations','responsibilities','acknowledgement','visualization',
  ],
};

const ALL_WORDS = [...WORD_BANKS.short,...WORD_BANKS.medium,...WORD_BANKS.long];

/* ── Difficulty config by level ─────────────────────────────────────────── */
const getDiffConfig = (level) => ({
  pools    : level < 3  ? ['short']
           : level < 6  ? ['short', 'medium']
           : level < 10 ? ['medium', 'long']
           :              ['long', 'veryLong'],
  maxWords : Math.min(4, 1 + Math.floor(level / 3)),
  spawnMs  : Math.max(1100, 3000 - level * 130),
  speed    : 0.7 + level * 0.13,
});

/* ── Lane Y positions (fraction of canvas height) ───────────────────────── */
const LANE_YS = [0.22, 0.44, 0.66, 0.84];

/* ── Danger colour based on x progress ─────────────────────────────────── */
const dangerColor = (xRatio) => {
  if (xRatio > 0.55) return { hex: '#1D9E75', r: 29,  g: 158, b: 117 }; // teal  - safe
  if (xRatio > 0.28) return { hex: '#EF9F27', r: 239, g: 159, b: 39  }; // amber - warning
  return                      { hex: '#E24B4A', r: 226, g: 75,  b: 74  }; // red   - danger
};

/* ── Pick random word from pools ────────────────────────────────────────── */
const pickWord = (pools) => {
  const pool = [];
  pools.forEach(p => pool.push(...(WORD_BANKS[p] || [])));
  return pool[Math.floor(Math.random() * pool.length)] || 'type';
};

/* ── Rounded rect helper ────────────────────────────────────────────────── */
const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/* ═══════════════════════════════════════════════════════════════════════════
   NeonWordRush Component
   ═══════════════════════════════════════════════════════════════════════════ */
const NeonWordRush = ({ onComplete }) => {
  const canvasRef    = useRef(null);
  const animRef      = useRef(null);
  const gameRunning  = useRef(false);
  const { playKeyClick, playErrorBuzz, playBubblePop, playSuccessChime } = useSound();
  const { settings } = useAppContext();

  /* ── React UI state (sparse updates only) ───────────────────────────── */
  const [gameState, setGameState]   = useState('idle'); // idle|playing|gameover
  const [uiScore,   setUiScore]     = useState(0);
  const [uiCombo,   setUiCombo]     = useState(0);
  const [uiLives,   setUiLives]     = useState(3);
  const [uiLevel,   setUiLevel]     = useState(1);
  const [endData,   setEndData]     = useState(null);

  /* ── Mutable engine refs (zero re-renders in loop) ───────────────────── */
  const words       = useRef([]);
  const particles   = useRef([]);
  const activeId    = useRef(null);   // id of word currently being typed
  const shakeRef    = useRef({ frames: 0, intensity: 0 });
  const stats       = useRef({});
  const lastSpawn   = useRef(0);
  const idCounter   = useRef(0);
  const levelRef    = useRef(1);
  const fontCache   = useRef(null);  // pre-measured font ctx

  /* ── Sync to React UI ───────────────────────────────────────────────── */
  const syncUI = useCallback(() => {
    const s = stats.current;
    setUiScore(s.score);
    setUiCombo(s.combo);
    setUiLives(s.lives);
    setUiLevel(levelRef.current);
  }, []);

  /* ── Word spawn ─────────────────────────────────────────────────────── */
  const spawnWord = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cfg = getDiffConfig(levelRef.current);
    if (timestamp - lastSpawn.current < cfg.spawnMs) return;
    if (words.current.length >= cfg.maxWords) return;

    const word   = pickWord(cfg.pools);
    const ctx    = canvas.getContext('2d');
    const font   = 'bold 22px "JetBrains Mono", monospace';
    ctx.font     = font;
    const width  = ctx.measureText(word).width;

    // Pick the least-used lane
    const laneCounts = LANE_YS.map((_, li) =>
      words.current.filter(w => w.lane === li).length
    );
    const lane = laneCounts.indexOf(Math.min(...laneCounts));

    words.current.push({
      id         : idCounter.current++,
      word,
      x          : canvas.width + 16,
      y          : canvas.height * LANE_YS[lane],
      width,
      speed      : cfg.speed * (0.85 + Math.random() * 0.3),
      typedIndex : 0,
      lane,
      createdAt  : Date.now(),
      flashRed   : false,
      flashFrames: 0,
    });
    lastSpawn.current = timestamp;
  }, []);

  /* ── Particle burst ──────────────────────────────────────────────────── */
  const burst = useCallback((x, y, hex) => {
    if (settings.performanceMode === 'Minimal') return;
    const count = settings.performanceMode === 'High' ? 18 : 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 3 + Math.random() * 6;
      particles.current.push({
        x, y,
        vx  : Math.cos(angle) * speed,
        vy  : Math.sin(angle) * speed - 2,
        life: 1.0,
        size: 2 + Math.random() * 4,
        hex,
      });
    }
  }, [settings.performanceMode]);

  /* ── Draw a single word (char-by-char colouring) ────────────────────── */
  const drawWord = useCallback((ctx, w) => {
    const fontSize = Math.max(15, 22 - Math.floor(w.word.length / 5));
    ctx.font        = `bold ${fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';

    const xRatio  = w.x / (canvasRef.current?.width || 800);
    const dc      = dangerColor(xRatio);
    const isFlash = w.flashRed;

    let cx = w.x;

    // Typed portion — teal/cyan glow
    if (w.typedIndex > 0) {
      const typed = w.word.slice(0, w.typedIndex);
      ctx.shadowBlur  = 14;
      ctx.shadowColor = '#1D9E75';
      ctx.fillStyle   = '#5ECBA1';
      ctx.fillText(typed, cx, w.y);
      cx += ctx.measureText(typed).width;
    }

    // Current char — bright white cursor or red on flash
    if (w.typedIndex < w.word.length) {
      const cur = w.word[w.typedIndex];
      ctx.shadowBlur  = isFlash ? 22 : (activeId.current === w.id ? 18 : 10);
      ctx.shadowColor = isFlash ? '#E24B4A' : (activeId.current === w.id ? '#fff' : dc.hex);
      ctx.fillStyle   = isFlash ? '#FF6B6B' : (activeId.current === w.id ? '#ffffff' : dc.hex);
      ctx.fillText(cur, cx, w.y);
      cx += ctx.measureText(cur).width;
    }

    // Remaining — danger-coloured, dimmed
    if (w.typedIndex + 1 < w.word.length) {
      const rest = w.word.slice(w.typedIndex + 1);
      ctx.shadowBlur  = isFlash ? 8 : 8;
      ctx.shadowColor = isFlash ? '#E24B4A' : dc.hex;
      ctx.fillStyle   = isFlash ? 'rgba(226,75,74,0.7)' : `rgba(${dc.r},${dc.g},${dc.b},0.7)`;
      ctx.fillText(rest, cx, w.y);
    }

    ctx.shadowBlur = 0;

    // Danger bracket if word is near exit
    if (xRatio < 0.2) {
      ctx.strokeStyle = `rgba(${dc.r},${dc.g},${dc.b},0.4)`;
      ctx.lineWidth   = 1;
      const pad = 4;
      ctx.strokeRect(w.x - pad, w.y - fontSize * 0.7, w.width + pad * 2, fontSize * 1.4);
    }
  }, []);

  /* ── Main game loop ─────────────────────────────────────────────────── */
  const gameLoop = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas || !gameRunning.current) return;

    /* motion blur vs hard clear */
    if (settings.performanceMode === 'High') {
      ctx.fillStyle = 'rgba(10,10,12,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /* screen shake */
    const sk = shakeRef.current;
    if (sk.frames > 0) {
      const dx = (Math.random() - 0.5) * sk.intensity;
      const dy = (Math.random() - 0.5) * sk.intensity * 0.5;
      ctx.translate(dx, dy);
      sk.intensity *= 0.8;
      sk.frames--;
    }

    /* spawn */
    spawnWord(timestamp);

    /* draw lane guide lines */
    LANE_YS.forEach(ly => {
      const y = canvas.height * ly;
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([6, 18]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    /* update & draw words */
    const cfg = getDiffConfig(levelRef.current);
    for (let i = words.current.length - 1; i >= 0; i--) {
      const w = words.current[i];
      w.x -= w.speed;

      /* exit left → lose life */
      if (w.x + w.width < -10) {
        words.current.splice(i, 1);
        if (activeId.current === w.id) activeId.current = null;
        stats.current.lives    -= 1;
        stats.current.combo     = 0;
        stats.current.misses   += 1;
        shakeRef.current        = { frames: 14, intensity: 9 };
        playErrorBuzz();
        syncUI();
        if (stats.current.lives <= 0) { endGame(); return; }
        continue;
      }

      /* flash timer */
      if (w.flashRed && w.flashFrames > 0) {
        w.flashFrames--;
        if (w.flashFrames <= 0) w.flashRed = false;
      }

      drawWord(ctx, w);
    }

    /* particles */
    ctx.shadowBlur = 0;
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // gravity
      p.life -= 0.035;
      if (p.life <= 0) { particles.current.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.hex;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* reset transform after shake */
    if (sk.frames <= 0) ctx.setTransform(1, 0, 0, 1, 0, 0);

    animRef.current = requestAnimationFrame(gameLoop);
  }, [settings.performanceMode, spawnWord, drawWord, playErrorBuzz, syncUI]);

  /* ── Keyboard handler ───────────────────────────────────────────────── */
  const handleKey = useCallback((e) => {
    if (!gameRunning.current) return;
    const key = e.key.toLowerCase();
    if (key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;

    /* if typing into an active word */
    if (activeId.current !== null) {
      const w = words.current.find(x => x.id === activeId.current);
      if (!w) { activeId.current = null; return; }

      if (key === w.word[w.typedIndex]) {
        w.typedIndex++;
        playKeyClick();

        if (w.typedIndex === w.word.length) {
          /* WORD COMPLETE */
          const ms = Date.now() - w.createdAt;
          stats.current.completionTimes.push(ms);
          stats.current.totalPops++;
          stats.current.combo++;
          if (stats.current.combo > stats.current.maxCombo) stats.current.maxCombo = stats.current.combo;
          const mult   = Math.min(4, 1 + Math.floor(stats.current.combo / 5) * 0.5);
          stats.current.score += Math.floor(w.word.length * 10 * mult);
          burst(w.x + w.width / 2, w.y, dangerColor(w.x / (canvasRef.current?.width || 800)).hex);
          words.current = words.current.filter(x => x.id !== activeId.current);
          activeId.current = null;
          playBubblePop();

          /* level up every 5 words */
          if (stats.current.totalPops % 5 === 0) {
            levelRef.current = Math.min(15, levelRef.current + 1);
          }
          syncUI();
        }
      } else {
        /* wrong key for active word */
        w.flashRed    = true;
        w.flashFrames = 10;
        stats.current.errors++;
        stats.current.combo = 0;
        playErrorBuzz();
        syncUI();
      }
      return;
    }

    /* no active word — find leftmost word starting with key */
    let best = null;
    let bestX = Infinity;
    for (const w of words.current) {
      if (w.word[0] === key && w.x < bestX) {
        bestX = w.x;
        best  = w;
      }
    }
    if (best) {
      activeId.current = best.id;
      best.typedIndex  = 1;
      if (best.word.length === 1) {
        /* single-char word instant complete */
        const ms = Date.now() - best.createdAt;
        stats.current.completionTimes.push(ms);
        stats.current.totalPops++;
        stats.current.combo++;
        if (stats.current.combo > stats.current.maxCombo) stats.current.maxCombo = stats.current.combo;
        stats.current.score += Math.floor(10 * Math.min(4, 1 + Math.floor(stats.current.combo / 5) * 0.5));
        burst(best.x, best.y, '#1D9E75');
        words.current    = words.current.filter(x => x.id !== best.id);
        activeId.current = null;
        playBubblePop();
        syncUI();
      } else {
        playKeyClick();
      }
    } else {
      /* no matching word */
      stats.current.errors++;
      stats.current.combo = 0;
      playErrorBuzz();
      syncUI();
    }
  }, [playKeyClick, playErrorBuzz, playBubblePop, burst, syncUI]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  /* ── startGame ───────────────────────────────────────────────────────── */
  const startGame = () => {
    gameRunning.current = true;
    levelRef.current    = 1;
    activeId.current    = null;
    words.current       = [];
    particles.current   = [];
    shakeRef.current    = { frames: 0, intensity: 0 };
    lastSpawn.current   = 0;
    idCounter.current   = 0;
    stats.current = {
      score: 0, combo: 0, maxCombo: 0,
      lives: 3, totalPops: 0, misses: 0, errors: 0,
      completionTimes: [],       // per-word ms array for end chart
      wordCount: 0,
    };
    setGameState('playing');
    setUiScore(0); setUiCombo(0); setUiLives(3); setUiLevel(1);
    setEndData(null);

    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas?.parentElement) {
        const r      = canvas.parentElement.getBoundingClientRect();
        canvas.width = r.width;
        canvas.height = 450;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(gameLoop);
    });
  };

  /* ── endGame ────────────────────────────────────────────────────────── */
  const endGame = useCallback(() => {
    gameRunning.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const s = stats.current;

    const word_completion_ms  = s.completionTimes.length
      ? Math.round(s.completionTimes.reduce((a,b) => a+b,0) / s.completionTimes.length)
      : 3000;
    const burst_accuracy      = (s.totalPops + s.errors) > 0
      ? +(s.totalPops / (s.totalPops + s.errors)).toFixed(3)
      : 0;
    const visual_tracking_score = (s.totalPops + s.misses) > 0
      ? +(s.totalPops / (s.totalPops + s.misses)).toFixed(3)
      : 0;
    const pressure_typing_score = Math.min(1, s.maxCombo / 20);

    const result = {
      score: s.score, maxCombo: s.maxCombo,
      totalWords: s.totalPops, misses: s.misses,
      word_completion_ms, burst_accuracy,
      visual_tracking_score, pressure_typing_score,
      completionTimes: s.completionTimes,
    };
    setEndData(result);
    setGameState('gameover');
    playSuccessChime();
    if (onComplete) onComplete(result);
  }, [onComplete, playSuccessChime]);

  /* ── Resize canvas ───────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas?.parentElement && gameState !== 'playing') {
      const r = canvas.parentElement.getBoundingClientRect();
      canvas.width  = r.width;
      canvas.height = 450;
    }
  }, [gameState]);

  /* ── End screen: mini bar chart of completion times ─────────────────── */
  const ChartBars = ({ times }) => {
    if (!times?.length) return null;
    const max = Math.max(...times, 1);
    return (
      <div style={sty.chartWrap}>
        <p style={sty.chartLabel}>Word Completion Times</p>
        <div style={sty.bars}>
          {times.map((t, i) => {
            const pct   = (t / max) * 100;
            const color = t < 1500 ? 'var(--accent-teal)'
                        : t < 3000 ? 'var(--accent-amber)'
                        :             'var(--accent-red)';
            return (
              <div key={i} style={sty.barWrap} title={`${t}ms`}>
                <div style={{ ...sty.bar, height: `${pct}%`, background: color }} />
              </div>
            );
          })}
        </div>
        <div style={sty.chartAxes}>
          <span>fast</span><span>slow</span>
        </div>
      </div>
    );
  };

  /* ── JSX ─────────────────────────────────────────────────────────────── */
  return (
    <div style={sty.container}>

      {/* Stats bar */}
      <div style={sty.statsBar}>
        <div style={sty.stat}>
          <span style={sty.statLabel}>SCORE</span>
          <span style={{ ...sty.statVal, color: 'var(--accent-teal)' }}>{uiScore}</span>
        </div>
        <div style={sty.stat}>
          <span style={sty.statLabel}>COMBO</span>
          <span style={{ ...sty.statVal, color: uiCombo > 0 ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
            ×{uiCombo}
          </span>
        </div>
        <div style={sty.stat}>
          <span style={sty.statLabel}>LIVES</span>
          <span style={{ ...sty.statVal, color: 'var(--accent-red)' }}>
            {'❤️'.repeat(Math.max(0, uiLives))}
          </span>
        </div>
        <div style={sty.stat}>
          <span style={sty.statLabel}>LEVEL</span>
          <span style={{ ...sty.statVal, color: 'var(--accent-amber)' }}>{uiLevel}</span>
        </div>
      </div>

      {/* Game board */}
      <div className="glass-panel" style={sty.board}>

        {/* Combo glow aura */}
        {uiCombo >= 10 && settings.performanceMode !== 'Minimal' && (
          <div style={{
            ...sty.comboAura,
            opacity: Math.min(1, (uiCombo - 10) / 20),
            boxShadow: `inset 0 0 60px rgba(127,119,221,${Math.min(0.4, (uiCombo-10)/50)})`,
          }} />
        )}

        <canvas ref={canvasRef} style={sty.canvas} />

        {/* IDLE overlay */}
        {gameState === 'idle' && (
          <div style={sty.overlay}>
            <div style={sty.overlayIcon}>🚀</div>
            <h2 style={sty.overlayTitle}>Neon Word Rush</h2>
            <p style={sty.overlayDesc}>
              Words fly right → left across 3 lanes.<br/>
              Type the full word before it escapes. 3 lives.
            </p>
            <div style={sty.tipRow}>
              <span style={sty.tip}>🟢 Green = safe&nbsp;&nbsp;&nbsp;🟡 Amber = hurry&nbsp;&nbsp;&nbsp;🔴 Red = critical</span>
            </div>
            <button style={sty.startBtn} onClick={startGame}>
              <Play size={18} /> Start Rush
            </button>
          </div>
        )}

        {/* GAMEOVER overlay */}
        {gameState === 'gameover' && endData && (
          <div style={{ ...sty.overlay, overflowY: 'auto', padding: '2rem' }}>
            <h2 style={{ ...sty.overlayTitle, color: 'var(--accent-amber)', marginBottom: '1.25rem' }}>
              Rush Complete
            </h2>

            <div style={sty.resultGrid}>
              <div style={sty.resultItem}>
                <span style={{ ...sty.resultVal, color: 'var(--accent-teal)' }}>{endData.score}</span>
                <span style={sty.resultLabel}>Score</span>
              </div>
              <div style={sty.resultItem}>
                <span style={{ ...sty.resultVal, color: 'var(--accent-purple)' }}>×{endData.maxCombo}</span>
                <span style={sty.resultLabel}>Max Combo</span>
              </div>
              <div style={sty.resultItem}>
                <span style={sty.resultVal}>{endData.totalWords}</span>
                <span style={sty.resultLabel}>Words</span>
              </div>
              <div style={sty.resultItem}>
                <span style={{ ...sty.resultVal, color: 'var(--accent-teal)' }}>
                  {Math.round(endData.burst_accuracy * 100)}%
                </span>
                <span style={sty.resultLabel}>Accuracy</span>
              </div>
            </div>

            <ChartBars times={endData.completionTimes} />

            <div style={sty.mlMetrics}>
              <span>⚡ Burst Accuracy <strong>{Math.round(endData.burst_accuracy * 100)}%</strong></span>
              <span>👁 Visual Tracking <strong>{Math.round(endData.visual_tracking_score * 100)}%</strong></span>
              <span>🔥 Pressure Score <strong>{Math.round(endData.pressure_typing_score * 100)}%</strong></span>
              <span>⏱ Avg Completion <strong>{endData.word_completion_ms}ms</strong></span>
            </div>

            <button style={sty.startBtn} onClick={startGame}>
              <RefreshCcw size={18} /> Rush Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────────── */
const sty = {
  container: { display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' },

  statsBar: { display: 'flex', gap: '2.5rem', padding: '0 0.5rem', flexWrap: 'wrap' },
  stat: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  statLabel: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' },
  statVal: { fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1 },

  board: {
    position: 'relative', width: '100%', minHeight: '450px', overflow: 'hidden',
    backgroundColor: '#05050A', borderRadius: 'var(--radius-lg)',
  },
  comboAura: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
    transition: 'opacity 0.5s, box-shadow 0.5s',
  },
  canvas: { width: '100%', height: '450px', display: 'block', position: 'relative', zIndex: 2 },

  overlay: {
    position: 'absolute', inset: 0, zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(5,5,10,0.88)', backdropFilter: 'blur(10px)',
    gap: '1rem', padding: '2.5rem', textAlign: 'center',
  },
  overlayIcon: { fontSize: '3rem', lineHeight: 1 },
  overlayTitle: { fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 },
  overlayDesc: { color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: '400px' },
  tipRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' },
  tip: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  startBtn: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.75rem 2.25rem',
    background: 'var(--accent-purple)', color: '#fff',
    borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '1rem',
    boxShadow: 'var(--glow-purple)', border: 'none', cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.2s', marginTop: '0.5rem',
  },

  resultGrid: { display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.25rem' },
  resultItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  resultVal: { fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1 },
  resultLabel: { fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' },

  mlMetrics: {
    display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
    fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem',
  },

  chartWrap: { width: '100%', maxWidth: '500px', margin: '0 auto' },
  chartLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  bars: { display: 'flex', gap: '2px', height: '80px', alignItems: 'flex-end', padding: '0 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' },
  barWrap: { flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: '2px 2px 0 0', minHeight: '4px', transition: 'height 0.5s ease' },
  chartAxes: { display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' },
};

export default NeonWordRush;

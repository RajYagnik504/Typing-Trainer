import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Play, RefreshCcw } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   RHYTHM STRIKE
   Web Audio API + requestAnimationFrame dual-clock architecture.
   audioCtx.currentTime is the master clock — never Date.now() or rAF time.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Constants ─────────────────────────────────────────────────────────── */
const LANE_KEYS    = ['d', 'f', 'j', 'k'];
const SONG_DURATION = 60;   // seconds
const TRAVEL_TIME   = 2.2;  // seconds: note travel top → hit zone
const HIT_ZONE_RATIO = 0.80;

const TIMING = { Perfect: 50, Great: 100, Good: 160 }; // ms half-windows

/* Lane colour palette */
const LANE_COLORS = [
  { hex: '#7F77DD', r: 127, g: 119, b: 221 }, // D — purple
  { hex: '#1D9E75', r: 29,  g: 158, b: 117 }, // F — teal
  { hex: '#EF9F27', r: 239, g: 159, b: 39  }, // J — amber
  { hex: '#E24B4A', r: 226, g: 75,  b: 74  }, // K — red
];

/* Lane base synth frequencies (A minor chord voicings) */
const LANE_FREQS = [220, 277.18, 329.63, 392.00]; // A3, C#4, E4, G4

/* Difficulty configs */
const DIFF_CONFIGS = {
  Chill     : { bpm: 80,  density: 0.42, maxPerBeat: 1, label: 'Chill',      emoji: '😌' },
  Focus     : { bpm: 110, density: 0.58, maxPerBeat: 2, label: 'Focus',      emoji: '🎯' },
  Hyper     : { bpm: 140, density: 0.72, maxPerBeat: 3, label: 'Hyper',      emoji: '⚡' },
  Impossible: { bpm: 180, density: 0.88, maxPerBeat: 4, label: 'Impossible', emoji: '🔥' },
};

/* Rating visual colours */
const RATING_COLORS = {
  Perfect: '#7F77DD',
  Great  : '#1D9E75',
  Good   : '#EF9F27',
  Miss   : '#E24B4A',
};

/* ── Beatmap generator ───────────────────────────────────────────────────
   Procedural: generates all note events for a 60-second song.
   Uses BPM grid + density probability for a realistic feel.
   ──────────────────────────────────────────────────────────────────────── */
const generateBeatmap = (cfg) => {
  const { bpm, density, maxPerBeat } = cfg;
  const beatInterval = 60 / bpm;
  const notes = [];
  let id = 0;

  // Warm-up: first 2 beats are single, easy notes for orientation
  for (let t = beatInterval * 2; t < SONG_DURATION - 1; t += beatInterval) {
    const isWarmUp = t < beatInterval * 6;
    const roll = Math.random();
    if (roll > (isWarmUp ? 0.5 : density)) continue; // skip this beat

    // How many simultaneous notes?
    const countRoll  = Math.random();
    const count      = isWarmUp ? 1 : (countRoll < 0.6 ? 1 : countRoll < 0.85 ? 2 : Math.min(maxPerBeat, 3));
    const lanePool   = [0, 1, 2, 3];
    // Shuffle
    for (let i = lanePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanePool[i], lanePool[j]] = [lanePool[j], lanePool[i]];
    }
    lanePool.slice(0, count).forEach(lane => {
      notes.push({
        id      : id++,
        time    : t + (Math.random() * 0.015 - 0.0075), // tiny humanisation ±7.5ms
        lane,
        key     : LANE_KEYS[lane],
        state   : 'pending',   // pending | hit | missed
        rating  : null,
        timingError: null,
      });
    });
  }
  return notes.sort((a, b) => a.time - b.time);
};

/* ══════════════════════════════════════════════════════════════════════════ */
const RhythmStrike = ({ onComplete }) => {
  const canvasRef     = useRef(null);
  const animRef       = useRef(null);
  const audioCtxRef   = useRef(null);
  const gameRunning   = useRef(false);
  const songStartRef  = useRef(0);    // audioCtx.currentTime when song began
  const beatmap       = useRef([]);
  const laneEffects   = useRef([null, null, null, null]); // per-lane hit flash
  const particles     = useRef([]);
  const comboLightning = useRef([]);
  const stats         = useRef({});
  const keyPressed    = useRef([false, false, false, false]); // lane key down state
  const { settings }  = useAppContext();

  /* ── React UI state (sparse) ─────────────────────────────────────────── */
  const [gameState,  setGameState]  = useState('select'); // select|countdown|playing|gameover
  const [difficulty, setDifficulty] = useState('Focus');
  const [countdown,  setCountdown]  = useState(3);
  const [uiScore,    setUiScore]    = useState(0);
  const [uiCombo,    setUiCombo]    = useState(0);
  const [uiAccuracy, setUiAccuracy] = useState(100);
  const [lastRating, setLastRating] = useState(null); // { text, color } for flash
  const [endData,    setEndData]    = useState(null);

  /* ── Sync UI ──────────────────────────────────────────────────────────── */
  const syncUI = useCallback((rating) => {
    const s = stats.current;
    setUiScore(s.score);
    setUiCombo(s.combo);
    const total = s.hits + s.misses;
    setUiAccuracy(total ? Math.round((s.perfectGreat / total) * 100) : 100);
    if (rating) {
      setLastRating({ text: rating, color: RATING_COLORS[rating] });
      setTimeout(() => setLastRating(null), 600);
    }
  }, []);

  /* ── Audio helpers ────────────────────────────────────────────────────── */
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  /** Schedule a bass kick at precise audioCtx time */
  const scheduleBassKick = (ctx, time, vol) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vol * 0.7, time + 0.005);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.28);
  };

  /** Schedule a subtle hi-hat */
  const scheduleHiHat = (ctx, time, vol) => {
    const bufSize  = ctx.sampleRate * 0.04;
    const buffer   = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data     = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src      = ctx.createBufferSource();
    src.buffer     = buffer;
    const env      = ctx.createGain();
    const filter   = ctx.createBiquadFilter();
    filter.type    = 'highpass';
    filter.frequency.value = 8000;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vol * 0.15, time + 0.002);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    src.connect(filter);
    filter.connect(env);
    env.connect(ctx.destination);
    src.start(time);
    src.stop(time + 0.05);
  };

  /** Play an immediate hit sound for a lane */
  const playHitSound = useCallback((lane, rating) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const vol   = settings.performanceMode === 'Minimal' ? 0 : 0.35;
    const freq  = LANE_FREQS[lane];
    const dur   = rating === 'Perfect' ? 0.35 : 0.22;

    [freq, freq * 2].forEach((f, i) => {
      const osc  = ctx.createOscillator();
      const env  = ctx.createGain();
      osc.type   = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(vol / (i + 1), ctx.currentTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(env);
      env.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.02);
    });
  }, [settings.performanceMode]);

  /** Play error buzz */
  const playMissSound = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || settings.performanceMode === 'Minimal') return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type  = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
    env.gain.setValueAtTime(0.25, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  }, [settings.performanceMode]);

  /** Schedule the full 60-second backing track */
  const scheduleBacking = useCallback((ctx, startTime, bpm) => {
    const beatInterval = 60 / bpm;
    const totalBeats   = Math.ceil(SONG_DURATION / beatInterval);
    const vol          = settings.performanceMode === 'Minimal' ? 0 : 0.5;

    for (let b = 0; b < totalBeats; b++) {
      const t    = startTime + b * beatInterval;
      scheduleBassKick(ctx, t, vol * (b % 4 === 0 ? 1 : 0.55));
      scheduleHiHat(ctx, t + beatInterval * 0.5, vol); // off-beat hi-hat
    }
  }, [settings.performanceMode]);

  /* ── Particle burst ───────────────────────────────────────────────────── */
  const spawnParticles = useCallback((x, y, hex) => {
    if (settings.performanceMode === 'Minimal') return;
    const count = settings.performanceMode === 'High' ? 14 : 7;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2.5 + Math.random() * 4;
      particles.current.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
        life: 1.0, size: 2.5 + Math.random() * 3, hex,
      });
    }
  }, [settings.performanceMode]);

  /* ── Main game loop ───────────────────────────────────────────────────── */
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas || !gameRunning.current) return;

    const audioCtx  = audioCtxRef.current;
    const songTime  = audioCtx ? (audioCtx.currentTime - songStartRef.current) : 0;
    const cfg       = DIFF_CONFIGS[difficulty];
    const bpm       = cfg.bpm;
    const beatInt   = 60 / bpm;
    const hitZoneY  = canvas.height * HIT_ZONE_RATIO;
    const laneW     = canvas.width / 4;

    /* Song ended */
    if (songTime >= SONG_DURATION) {
      endGame();
      return;
    }

    /* ── Background ── */
    const bgAlpha = settings.performanceMode === 'High' ? 0.22 : 1;
    if (settings.performanceMode === 'High') {
      ctx.fillStyle = `rgba(5,5,12,${bgAlpha})`;
    } else {
      ctx.fillStyle = '#05050C';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* reactive background glow at high combo */
    const combo = stats.current.combo;
    if (combo >= 15 && settings.performanceMode !== 'Minimal') {
      const glowAlpha = Math.min(0.12, combo / 200);
      const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width * 0.6);
      grad.addColorStop(0, `rgba(127,119,221,${glowAlpha})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /* ── Beat pulse (BPM sync) ── */
    const beatProgress = (songTime % beatInt) / beatInt;
    const beatPulse    = Math.max(0, 1 - beatProgress * 3.5); // sharp peak at beat

    /* ── Draw lanes ── */
    for (let i = 0; i < 4; i++) {
      const lx = i * laneW;
      const lc = LANE_COLORS[i];

      /* Lane tint, pulsing on beat */
      const tintAlpha = 0.03 + beatPulse * 0.06;
      ctx.fillStyle = `rgba(${lc.r},${lc.g},${lc.b},${tintAlpha})`;
      ctx.fillRect(lx, 0, laneW, canvas.height);

      /* Lane dividers */
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, canvas.height);
      ctx.stroke();

      /* Key label at bottom */
      ctx.font        = 'bold 16px "JetBrains Mono", monospace';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle   = `rgba(${lc.r},${lc.g},${lc.b},${keyPressed.current[i] ? 0.9 : 0.45})`;
      ctx.shadowBlur  = keyPressed.current[i] ? 12 : 0;
      ctx.shadowColor = lc.hex;
      ctx.fillText(LANE_KEYS[i].toUpperCase(), lx + laneW / 2, hitZoneY + 32);
      ctx.shadowBlur  = 0;
    }

    /* ── Hit zone bar ── */
    const hitGlow = 0.15 + beatPulse * 0.25;
    ctx.fillStyle = `rgba(255,255,255,${hitGlow})`;
    ctx.fillRect(0, hitZoneY - 3, canvas.width, 5);

    /* Coloured hit zone segments */
    for (let i = 0; i < 4; i++) {
      const lc = LANE_COLORS[i];
      ctx.fillStyle = `rgba(${lc.r},${lc.g},${lc.b},${0.3 + beatPulse * 0.3})`;
      ctx.fillRect(i * laneW + 6, hitZoneY - 2, laneW - 12, 3);
    }

    /* ── Draw & update notes ── */
    for (const note of beatmap.current) {
      if (note.state === 'hit') continue;

      const progress = (songTime - (note.time - TRAVEL_TIME)) / TRAVEL_TIME;
      if (progress < 0 || progress > 1.3) continue;

      const noteY = progress * hitZoneY;
      const lc    = LANE_COLORS[note.lane];
      const lx    = note.lane * laneW;

      /* Auto-miss: note passed by > 160ms */
      if (note.state === 'pending' && songTime - note.time > TIMING.Good / 1000) {
        note.state  = 'missed';
        stats.current.misses++;
        stats.current.combo = 0;
        laneEffects.current[note.lane] = { life: 1.0, type: 'miss' };
        playMissSound();
        syncUI('Miss');
        continue;
      }
      if (note.state === 'missed') continue;

      /* Note pill */
      const pH = 36;
      const pW = laneW - 14;
      const px = lx + 7;
      const py = noteY - pH / 2;

      ctx.shadowBlur  = 20;
      ctx.shadowColor = lc.hex;
      ctx.fillStyle   = lc.hex;
      ctx.beginPath();
      ctx.moveTo(px + 8, py);
      ctx.lineTo(px + pW - 8, py);
      ctx.quadraticCurveTo(px + pW, py, px + pW, py + 8);
      ctx.lineTo(px + pW, py + pH - 8);
      ctx.quadraticCurveTo(px + pW, py + pH, px + pW - 8, py + pH);
      ctx.lineTo(px + 8, py + pH);
      ctx.quadraticCurveTo(px, py + pH, px, py + pH - 8);
      ctx.lineTo(px, py + 8);
      ctx.quadraticCurveTo(px, py, px + 8, py);
      ctx.closePath();
      ctx.fill();

      /* Key label on note */
      ctx.shadowBlur   = 0;
      ctx.fillStyle    = 'rgba(0,0,0,0.75)';
      ctx.font         = 'bold 18px "JetBrains Mono", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.key.toUpperCase(), lx + laneW / 2, noteY + 1);
    }

    /* ── Lane hit effects ── */
    for (let i = 0; i < 4; i++) {
      const fx = laneEffects.current[i];
      if (!fx || fx.life <= 0) continue;
      const lc = LANE_COLORS[i];
      const lx = i * laneW + laneW / 2;

      const isMiss = fx.type === 'miss';
      ctx.globalAlpha = fx.life * 0.9;
      ctx.strokeStyle = isMiss ? '#E24B4A' : lc.hex;
      ctx.lineWidth   = 2.5;
      ctx.shadowBlur  = 24;
      ctx.shadowColor = isMiss ? '#E24B4A' : lc.hex;

      const radius = (1 - fx.life) * 55 + 18;
      ctx.beginPath();
      ctx.arc(lx, hitZoneY, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (!isMiss && fx.life > 0.5) {
        ctx.globalAlpha = (fx.life - 0.5) * 1.8;
        ctx.fillStyle   = lc.hex;
        ctx.beginPath();
        ctx.arc(lx, hitZoneY, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      fx.life -= 0.07;
    }

    /* ── Combo lightning (combo ≥ 20) ── */
    if (combo >= 20 && settings.performanceMode !== 'Minimal') {
      ctx.globalAlpha = 0.15 + Math.random() * 0.1;
      ctx.strokeStyle = '#B2AFFF';
      ctx.lineWidth   = 1;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = '#7F77DD';
      for (let s = 0; s < 2; s++) {
        const lx1 = Math.random() * canvas.width;
        const lx2 = Math.random() * canvas.width;
        ctx.beginPath();
        ctx.moveTo(lx1, hitZoneY);
        ctx.lineTo(lx2, hitZoneY - 20 - Math.random() * 40);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
    }

    /* ── Particles ── */
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.1;
      p.life -= 0.045;
      if (p.life <= 0) { particles.current.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.hex;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ── Progress bar ── */
    const pct = Math.min(1, songTime / SONG_DURATION);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, canvas.width, 4);
    ctx.fillStyle = 'var(--accent-purple)';
    const grad = ctx.createLinearGradient(0, 0, canvas.width * pct, 0);
    grad.addColorStop(0, '#7F77DD');
    grad.addColorStop(1, '#B2AFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width * pct, 4);

    animRef.current = requestAnimationFrame(gameLoop);
  }, [difficulty, settings.performanceMode, spawnParticles, syncUI, playMissSound]);

  /* ── Input handler ────────────────────────────────────────────────────── */
  const handleKeyDown = useCallback((e) => {
    if (!gameRunning.current) return;
    const key  = e.key.toLowerCase();
    const lane = LANE_KEYS.indexOf(key);
    if (lane === -1) return;
    keyPressed.current[lane] = true;

    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;
    const songTime = audioCtx.currentTime - songStartRef.current;

    /* Find nearest pending note in this lane within ±Good window */
    let best = null, bestErr = Infinity;
    for (const note of beatmap.current) {
      if (note.lane !== lane || note.state !== 'pending') continue;
      const err = Math.abs(songTime - note.time) * 1000; // ms
      if (err < TIMING.Good && err < bestErr) {
        bestErr = err;
        best    = note;
      }
    }

    if (best) {
      const errMs  = (songTime - best.time) * 1000;
      const absErr = Math.abs(errMs);
      const rating = absErr <= TIMING.Perfect ? 'Perfect'
                   : absErr <= TIMING.Great   ? 'Great'
                   :                            'Good';
      best.state      = 'hit';
      best.rating     = rating;
      best.timingError = errMs;

      const pts = rating === 'Perfect' ? 300 : rating === 'Great' ? 150 : 75;
      const comboMult = Math.min(4, 1 + Math.floor(stats.current.combo / 10) * 0.5);
      stats.current.score     += Math.floor(pts * comboMult);
      stats.current.combo     += 1;
      stats.current.hits      += 1;
      stats.current.timingErrors.push(absErr);
      if (rating !== 'Good') stats.current.perfectGreat += 1;
      if (stats.current.combo > stats.current.maxCombo) stats.current.maxCombo = stats.current.combo;

      laneEffects.current[lane] = { life: 1.0, type: rating };
      spawnParticles(lane * (canvasRef.current?.width / 4 || 200) + (canvasRef.current?.width / 8 || 100),
        (canvasRef.current?.height || 450) * HIT_ZONE_RATIO,
        LANE_COLORS[lane].hex);

      playHitSound(lane, rating);
      syncUI(rating);
    } else {
      /* Ghost press — no note in window */
      laneEffects.current[lane] = { life: 0.6, type: 'ghost' };
    }
  }, [playHitSound, spawnParticles, syncUI]);

  const handleKeyUp = useCallback((e) => {
    const lane = LANE_KEYS.indexOf(e.key.toLowerCase());
    if (lane !== -1) keyPressed.current[lane] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup',   handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup',   handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  /* ── startGame ────────────────────────────────────────────────────────── */
  const startGame = useCallback(async () => {
    const ctx = initAudio();
    const cfg = DIFF_CONFIGS[difficulty];

    beatmap.current       = generateBeatmap(cfg);
    particles.current     = [];
    laneEffects.current   = [null, null, null, null];
    keyPressed.current    = [false, false, false, false];
    stats.current         = {
      score: 0, combo: 0, maxCombo: 0,
      hits: 0, misses: 0, perfectGreat: 0,
      timingErrors: [],
    };
    gameRunning.current = false;

    /* Countdown 3-2-1 */
    setGameState('countdown');
    setCountdown(3);
    for (let c = 3; c >= 1; c--) {
      setCountdown(c);
      /* metronome click on countdown */
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.frequency.value = c === 3 ? 880 : 660;
      env.gain.setValueAtTime(0.4, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(env);
      env.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
      await new Promise(r => setTimeout(r, 1000));
    }

    /* Canvas sizing */
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas?.parentElement) {
        const r      = canvas.parentElement.getBoundingClientRect();
        canvas.width = r.width;
        canvas.height = 450;
      }

      /* Schedule backing track */
      const songStart = ctx.currentTime + 0.05;
      songStartRef.current = songStart;
      scheduleBacking(ctx, songStart, cfg.bpm);

      gameRunning.current = true;
      setGameState('playing');
      setUiScore(0); setUiCombo(0); setUiAccuracy(100); setLastRating(null);

      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(gameLoop);
    });
  }, [difficulty, scheduleBacking, gameLoop]);

  /* ── endGame ─────────────────────────────────────────────────────────── */
  const endGame = useCallback(() => {
    gameRunning.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const s = stats.current;
    const totalNotes   = s.hits + s.misses;
    const rhythm_accuracy = totalNotes > 0 ? +(s.perfectGreat / totalNotes).toFixed(3) : 0;
    const timing_deviation_ms = s.timingErrors.length > 0
      ? +( s.timingErrors.reduce((a,b) => a+b,0) / s.timingErrors.length ).toFixed(1)
      : 200;

    let flow_consistency = 0;
    if (s.timingErrors.length > 1) {
      const mean = timing_deviation_ms;
      const variance = s.timingErrors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / s.timingErrors.length;
      flow_consistency = +(Math.max(0, 1 - Math.sqrt(variance) / Math.max(mean, 1))).toFixed(3);
    }

    // muscle_memory_score: accuracy on the most frequently used lane
    const laneCounts = [0,1,2,3].map(l => beatmap.current.filter(n => n.lane === l && n.state === 'hit').length);
    const dominantLane = laneCounts.indexOf(Math.max(...laneCounts));
    const dominantTotal = beatmap.current.filter(n => n.lane === dominantLane).length;
    const dominantHits  = laneCounts[dominantLane];
    const muscle_memory_score = dominantTotal > 0 ? +(dominantHits / dominantTotal).toFixed(3) : 0;

    const result = {
      score: s.score, maxCombo: s.maxCombo, hits: s.hits, misses: s.misses,
      rhythm_accuracy, timing_deviation_ms, flow_consistency, muscle_memory_score,
      difficulty,
    };
    setEndData(result);
    setGameState('gameover');
    if (onComplete) onComplete(result);
  }, [difficulty, onComplete]);

  /* ── Resize ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas?.parentElement && gameState !== 'playing' && gameState !== 'countdown') {
      const r = canvas.parentElement.getBoundingClientRect();
      canvas.width  = r.width;
      canvas.height = 450;
    }
  }, [gameState]);

  /* ══════════════════════════════════════════════════════════════════════
     JSX
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={sty.container}>

      {/* Stats bar */}
      {(gameState === 'playing' || gameState === 'countdown') && (
        <div style={sty.statsBar}>
          {[
            { label: 'SCORE',    val: uiScore,    color: 'var(--accent-purple)' },
            { label: 'COMBO',    val: `×${uiCombo}`, color: uiCombo > 0 ? 'var(--accent-teal)' : 'var(--text-muted)' },
            { label: 'ACCURACY', val: `${uiAccuracy}%`, color: 'var(--accent-amber)' },
          ].map(({ label, val, color }) => (
            <div key={label} style={sty.stat}>
              <span style={sty.statLabel}>{label}</span>
              <span style={{ ...sty.statVal, color }}>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Game board */}
      <div className="glass-panel" style={sty.board}>
        <canvas ref={canvasRef} style={sty.canvas} />

        {/* Rating flash overlay */}
        {lastRating && (
          <div style={{ ...sty.ratingFlash, color: lastRating.color, textShadow: `0 0 20px ${lastRating.color}` }}>
            {lastRating.text}
          </div>
        )}

        {/* DIFFICULTY SELECT */}
        {gameState === 'select' && (
          <div style={sty.overlay}>
            <div style={sty.overlayIcon}>🥁</div>
            <h2 style={sty.overlayTitle}>Rhythm Strike</h2>
            <p style={sty.overlayDesc}>
              Hit <kbd style={sty.kbd}>D</kbd> <kbd style={sty.kbd}>F</kbd> <kbd style={sty.kbd}>J</kbd> <kbd style={sty.kbd}>K</kbd> when notes reach the glow bar.
            </p>

            <div style={sty.diffGrid}>
              {Object.entries(DIFF_CONFIGS).map(([key, cfg]) => (
                <button
                  key={key}
                  style={{
                    ...sty.diffBtn,
                    outline: difficulty === key ? `2px solid var(--accent-purple)` : 'none',
                    background: difficulty === key ? 'rgba(127,119,221,0.15)' : 'rgba(255,255,255,0.04)',
                  }}
                  onClick={() => setDifficulty(key)}
                >
                  <span style={{ fontSize: '1.4rem' }}>{cfg.emoji}</span>
                  <span style={{ fontWeight: 700 }}>{cfg.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.bpm} BPM</span>
                </button>
              ))}
            </div>

            <div style={sty.timingLegend}>
              {Object.entries(TIMING).map(([rating, ms]) => (
                <span key={rating} style={{ color: RATING_COLORS[rating], fontSize: '0.8rem', fontWeight: 600 }}>
                  {rating} ±{ms}ms
                </span>
              ))}
            </div>

            <button style={sty.startBtn} onClick={startGame}>
              <Play size={18} /> Start — {difficulty}
            </button>
          </div>
        )}

        {/* COUNTDOWN */}
        {gameState === 'countdown' && (
          <div style={sty.overlay}>
            <div style={sty.countdownNum}>{countdown}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Get ready…</p>
          </div>
        )}

        {/* GAME OVER */}
        {gameState === 'gameover' && endData && (
          <div style={sty.overlay}>
            <h2 style={{ ...sty.overlayTitle, color: 'var(--accent-amber)' }}>Song Complete!</h2>

            <div style={sty.resultGrid}>
              {[
                { val: endData.score,   label: 'Score',    color: 'var(--accent-purple)' },
                { val: `×${endData.maxCombo}`, label: 'Max Combo', color: 'var(--accent-teal)' },
                { val: `${Math.round(endData.rhythm_accuracy * 100)}%`, label: 'Rhythm Acc', color: 'var(--accent-amber)' },
                { val: `${Math.round(endData.flow_consistency * 100)}%`, label: 'Flow', color: '#B2AFFF' },
              ].map(({ val, label, color }) => (
                <div key={label} style={sty.resultItem}>
                  <span style={{ ...sty.resultVal, color }}>{val}</span>
                  <span style={sty.resultLabel}>{label}</span>
                </div>
              ))}
            </div>

            <div style={sty.mlMetrics}>
              <span>⏱ Avg Timing Error <strong>{endData.timing_deviation_ms}ms</strong></span>
              <span>💪 Muscle Memory <strong>{Math.round(endData.muscle_memory_score * 100)}%</strong></span>
              <span>🎵 Difficulty <strong>{endData.difficulty}</strong></span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button style={sty.startBtn} onClick={startGame}>
                <RefreshCcw size={18} /> Play Again
              </button>
              <button style={{ ...sty.startBtn, background: 'var(--glass-bg)', boxShadow: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                onClick={() => setGameState('select')}>
                Change Difficulty
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lane key reminder */}
      {gameState === 'select' && (
        <div style={sty.laneHint}>
          {LANE_KEYS.map((k, i) => (
            <div key={k} style={{ ...sty.laneChip, borderColor: LANE_COLORS[i].hex + '55', color: LANE_COLORS[i].hex }}>
              <kbd style={sty.kbd}>{k.toUpperCase()}</kbd>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lane {i + 1}</span>
            </div>
          ))}
        </div>
      )}
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
    backgroundColor: '#05050C', borderRadius: 'var(--radius-lg)',
  },
  canvas: { width: '100%', height: '450px', display: 'block', position: 'relative', zIndex: 2 },

  ratingFlash: {
    position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
    fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)',
    pointerEvents: 'none', zIndex: 20,
    animation: 'fadeIn 0.1s ease both',
  },

  overlay: {
    position: 'absolute', inset: 0, zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(5,5,12,0.90)', backdropFilter: 'blur(10px)',
    gap: '1.1rem', padding: '2rem', textAlign: 'center',
  },
  overlayIcon: { fontSize: '3rem', lineHeight: 1 },
  overlayTitle: { fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 },
  overlayDesc: { color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '420px' },

  diffGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', width: '100%', maxWidth: '380px' },
  diffBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
    padding: '0.85rem', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)', cursor: 'pointer',
    transition: 'all 0.2s', color: 'var(--text-primary)',
  },

  timingLegend: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' },

  startBtn: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.75rem 2.25rem', background: 'var(--accent-purple)', color: '#fff',
    borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '1rem',
    boxShadow: 'var(--glow-purple)', border: 'none', cursor: 'pointer',
    transition: 'transform 0.15s', marginTop: '0.25rem',
  },

  countdownNum: {
    fontSize: '6rem', fontWeight: 900, fontFamily: 'var(--font-mono)',
    color: 'var(--accent-purple)', textShadow: 'var(--glow-purple-strong)',
    animation: 'countUp 0.3s ease',
  },

  resultGrid: { display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' },
  resultItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  resultVal: { fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1 },
  resultLabel: { fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' },

  mlMetrics: {
    display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
    fontSize: '0.8rem', color: 'var(--text-secondary)',
  },

  laneHint: { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' },
  laneChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
    padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
  },
  kbd: {
    display: 'inline-block', padding: '0.15rem 0.5rem',
    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border-highlight)',
    borderRadius: '0.3rem', fontSize: '0.8rem',
    fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
  },
};

export default RhythmStrike;

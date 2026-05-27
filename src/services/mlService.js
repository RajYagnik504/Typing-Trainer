/* ══════════════════════════════════════════════════════════════════════════
   ML Service — Skill prediction + Unified Intelligence Profile
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Individual session prediction (Skill Test) ────────────────────────── */
export const predictSkill = async (metrics) => {
  const payload = {
    wpm              : metrics.wpm,
    accuracy         : metrics.accuracy,
    avg_response_ms  : metrics.avgResponseMs,
    rhythm_score     : metrics.rhythmScore,
    backspace_rate   : metrics.backspaceRate,
    error_burst_rate : metrics.errorBursts,
    a2z_time_seconds : metrics.a2zTimeSeconds || 15,
    bubble_avg_ms    : metrics.bubbleAvgMs    || 500,
  };

  try {
    const controller = new AbortController();
    const tid        = setTimeout(() => controller.abort(), 3000);
    const response   = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/predict`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
      signal : controller.signal,
    });
    clearTimeout(tid);
    if (response.ok) return await response.json();
    throw new Error('API response not ok');
  } catch {
    console.warn('Real API unavailable — using mock prediction.');
    const mock = await mockPrediction(payload);
    return {
      ...mock,
      offline: true,
      recommendation: "⚠️ AI analysis server temporarily unavailable. Running local performance estimation mode. " + mock.recommendation
    };
  }
};

const mockPrediction = (m) => new Promise(resolve => {
  setTimeout(() => {
    let skillLevel = 'Beginner';
    let score      = 20;

    if      (m.wpm >= 90 && m.accuracy > 0.96) { skillLevel = 'Expert';       score = 90 + ~~(Math.random() * 10); }
    else if (m.wpm >= 70 && m.accuracy > 0.93) { skillLevel = 'Advanced';     score = 70 + ~~(Math.random() * 20); }
    else if (m.wpm >= 45 && m.accuracy > 0.88) { skillLevel = 'Intermediate'; score = 45 + ~~(Math.random() * 25); }
    else if (m.wpm >= 25 && m.accuracy > 0.80) { skillLevel = 'Novice';       score = 25 + ~~(Math.random() * 20); }
    else                                         { skillLevel = 'Beginner';    score = 10 + ~~(Math.random() * 15); }

    resolve({
      skill_level    : skillLevel,
      score,
      recommendation : generateRecommendation(m),
    });
  }, 800);
});

const generateRecommendation = (m) => {
  if (m.accuracy < 0.85)         return 'Focus on accuracy over speed — slow down and make each keystroke deliberate.';
  if (m.rhythm_score < 0.5)      return 'Your rhythm is inconsistent. Aim for a metronome-like steady pace.';
  if (m.error_burst_rate > 2)    return 'You cluster errors under pressure. Pause briefly after a mistake to reset.';
  if (m.wpm < 40)                return 'Great accuracy! Now build muscle memory on common bigrams (th, er, on, an) to accelerate.';
  return 'Excellent form. Push 10–15% beyond your comfort zone on the next run.';
};

/* ══════════════════════════════════════════════════════════════════════════
   UNIFIED INTELLIGENCE PROFILE
   Aggregates metrics across ALL games → one cognitive archetype.
   ══════════════════════════════════════════════════════════════════════════ */

const ARCHETYPES = {
  'Speed Specialist'  : { icon: '⚡', color: 'var(--accent-amber)',  desc: 'You excel at raw speed. Your fingers move faster than most typists.' },
  'Rhythm Master'     : { icon: '🎵', color: 'var(--accent-purple)', desc: 'Exceptional timing precision and flow. You type like a musician plays.' },
  'Precision Typist'  : { icon: '🎯', color: 'var(--accent-teal)',   desc: 'Accuracy is your superpower — near-zero error rate across every session.' },
  'Burst Typing Expert':{ icon: '💥', color: 'var(--accent-red)',    desc: 'You thrive under pressure with explosive multi-word burst capability.' },
  'Visual Tracker'    : { icon: '👁',  color: 'var(--accent-teal)',   desc: 'Outstanding visual scanning — you track multiple moving targets effortlessly.' },
  'Flow State Typist' : { icon: '🌊', color: '#B2AFFF',              desc: 'Your typing enters flow states — consistent, effortless, and deeply rhythmic.' },
  'Adaptive Learner'  : { icon: '📈', color: 'var(--accent-teal)',   desc: 'Rapid skill acquisition. You improve faster than 90 % of typists over time.' },
};

/**
 * computeIntelligenceProfile
 * @param {object} gameMetrics  — from AppContext (neonWordRush, rhythmStrike, bubblePop, a2zSpeed)
 * @param {Array}  history      — SkillTest session history array
 * @returns {object} profile    — { archetype, icon, color, desc, traits[], gamesPlayed }
 */
export const computeIntelligenceProfile = (gameMetrics = {}, history = []) => {
  /* ── Aggregate session arrays ─────────────────────────────── */
  const nwr = gameMetrics.neonWordRush?.sessions  || [];
  const rs  = gameMetrics.rhythmStrike?.sessions  || [];
  const bp  = gameMetrics.bubblePop?.sessions     || [];
  const a2z = gameMetrics.a2zSpeed?.sessions      || [];

  const gamesPlayed = nwr.length + rs.length + bp.length + a2z.length + history.length;

  /* ── Base dimension scores 0-100 ──────────────────────────── */

  // Speed — from SkillTest WPM
  const wpmArr    = history.map(h => h.wpm || 0);
  const avgWpm    = wpmArr.length ? wpmArr.reduce((a,b)=>a+b,0)/wpmArr.length : 0;
  const speedScore = Math.min(100, (avgWpm / 130) * 100);

  // Accuracy — from SkillTest
  const accArr    = history.map(h => typeof h.accuracy === 'number' ? (h.accuracy <= 1 ? h.accuracy : h.accuracy/100) : 0);
  const avgAcc    = accArr.length ? accArr.reduce((a,b)=>a+b,0)/accArr.length : 0;
  const precisionScore = Math.min(100, avgAcc * 100);

  // Burst accuracy — from NeonWordRush
  const burstArr   = nwr.map(s => s.burst_accuracy || 0);
  const burstScore = burstArr.length ? (burstArr.reduce((a,b)=>a+b,0)/burstArr.length)*100 : 0;

  // Pressure — from NeonWordRush
  const pressArr    = nwr.map(s => s.pressure_typing_score || 0);
  const pressScore  = pressArr.length ? (pressArr.reduce((a,b)=>a+b,0)/pressArr.length)*100 : 0;

  // Visual tracking — from NeonWordRush
  const visArr   = nwr.map(s => s.visual_tracking_score || 0);
  const visScore = visArr.length ? (visArr.reduce((a,b)=>a+b,0)/visArr.length)*100 : 0;

  // Rhythm accuracy — from RhythmStrike
  const rhaArr    = rs.map(s => s.rhythm_accuracy || 0);
  const rhythmScore = rhaArr.length ? (rhaArr.reduce((a,b)=>a+b,0)/rhaArr.length)*100 : 0;

  // Flow consistency — from RhythmStrike
  const flowArr   = rs.map(s => s.flow_consistency || 0);
  const flowScore = flowArr.length ? (flowArr.reduce((a,b)=>a+b,0)/flowArr.length)*100 : 0;

  // Timing precision (inverse deviation) — from RhythmStrike
  const devArr     = rs.map(s => s.timing_deviation_ms || 200);
  const avgDev     = devArr.length ? devArr.reduce((a,b)=>a+b,0)/devArr.length : 200;
  const timingScore = Math.max(0, 100 - avgDev / 1.6); // 0ms=100, 160ms=0

  // Adaptive improvement — WPM slope over last N sessions
  let adaptScore = 30;
  if (history.length >= 4) {
    const first = history.slice(-3).reduce((a,h)=>a+(h.wpm||0),0)/3;
    const last  = history.slice(0,3).reduce((a,h)=>a+(h.wpm||0),0)/3;
    adaptScore  = Math.min(100, Math.max(0, 50 + ((last - first) / Math.max(first,1)) * 200));
  }

  /* ── Score each archetype (weighted formula) ──────────────── */
  const archetypeScores = {
    'Speed Specialist'   : speedScore * 0.50 + burstScore * 0.30 + pressScore * 0.20,
    'Rhythm Master'      : rhythmScore * 0.45 + timingScore * 0.35 + flowScore * 0.20,
    'Precision Typist'   : precisionScore * 0.60 + flowScore * 0.20 + timingScore * 0.20,
    'Burst Typing Expert': burstScore * 0.45 + pressScore * 0.35 + speedScore * 0.20,
    'Visual Tracker'     : visScore * 0.45 + pressScore * 0.35 + burstScore * 0.20,
    'Flow State Typist'  : flowScore * 0.45 + rhythmScore * 0.30 + precisionScore * 0.25,
    'Adaptive Learner'   : adaptScore * 0.60 + speedScore * 0.20 + precisionScore * 0.20,
  };

  /* ── Pick best archetype ──────────────────────────────────── */
  const best = Object.entries(archetypeScores).sort((a,b) => b[1]-a[1])[0][0];
  const meta = ARCHETYPES[best];

  /* ── Trait bars shown on Home (top 5 most relevant) ──────── */
  const allTraits = [
    { name: 'Speed',     value: Math.round(speedScore),     color: 'var(--accent-amber)'  },
    { name: 'Precision', value: Math.round(precisionScore), color: 'var(--accent-teal)'   },
    { name: 'Rhythm',    value: Math.round(rhythmScore),    color: 'var(--accent-purple)' },
    { name: 'Burst',     value: Math.round(burstScore),     color: 'var(--accent-red)'    },
    { name: 'Visual',    value: Math.round(visScore),       color: 'var(--accent-teal)'   },
    { name: 'Flow',      value: Math.round(flowScore),      color: '#B2AFFF'              },
  ].sort((a,b) => b.value - a.value).slice(0, 5);

  return {
    archetype  : best,
    icon       : meta.icon,
    color      : meta.color,
    description: meta.desc,
    traits     : allTraits,
    gamesPlayed,
    archetypeScores,
    isNewPlayer: gamesPlayed < 3,
  };
};

/* ══════════════════════════════════════════════════════════════════════════
   BLIND TYPING ACADEMY — Coach + Score utilities
   ══════════════════════════════════════════════════════════════════════════ */

const HOME_ROW    = new Set(['a','s','d','f','g','h','j','k','l',';']);
const TOP_ROW     = new Set(['q','w','e','r','t','y','u','i','o','p']);
const BOTTOM_ROW  = new Set(['z','x','c','v','b','n','m',',','.', '/']);
const LEFT_ALPHA  = new Set('qwertasdfgzxcvb'.split(''));
const RIGHT_ALPHA = new Set('yuiophjklnm'.split(''));

/**
 * generateCoachFeedback
 * Produces up to 3 specific, actionable AI coach insights.
 * @param {object} keyStats  — { key: { attempts, errors, times[] } }
 * @param {number} dep       — keyboard dependency percentage 0–100
 */
export const generateCoachFeedback = (keyStats = {}, dep = 50) => {
  const insights = [];

  /* Per-key analysis */
  Object.entries(keyStats).forEach(([key, s]) => {
    if (s.attempts < 3) return;
    const errRate = s.errors / s.attempts;
    const avgMs   = s.times.length ? s.times.reduce((a,b)=>a+b,0)/s.times.length : 0;

    if (errRate > 0.35 && HOME_ROW.has(key)) {
      insights.push({ priority:4, text: `${key.toUpperCase()} shows a ${Math.round(errRate*100)}% error rate — unexpected for a home row key. Double-check your resting finger placement on ASDF · JKL;.` });
    }
    if (errRate > 0.45 && (key === 'g' || key === 'h')) {
      insights.push({ priority:4, text: `The G/H boundary is a classic weak zone — both are inner index-finger keys requiring a subtle inward reach. This cross-hand transition often causes mis-hits. Drill these in Module 3.` });
    }
    if (avgMs > 1100 && TOP_ROW.has(key)) {
      insights.push({ priority:3, text: `You hesitate on ${key.toUpperCase()} (avg ${Math.round(avgMs)}ms). Top-row keys require upward finger extension — practice the reach arc in Module 4.` });
    }
    if (avgMs > 900 && BOTTOM_ROW.has(key)) {
      insights.push({ priority:2, text: `${key.toUpperCase()} (bottom row) averages ${Math.round(avgMs)}ms — bottom keys need a downward curl. Module 4 movement trails will build that muscle path.` });
    }
    if (errRate > 0.5 && s.attempts >= 5) {
      insights.push({ priority:3, text: `${key.toUpperCase()} has only a ${Math.round((1-errRate)*100)}% hit rate. This key may be outside your current spatial map — make it the focus of your next Module 3 drill.` });
    }
  });

  /* Hand balance analysis */
  const leftTimes  = [...LEFT_ALPHA] .flatMap(k => keyStats[k]?.times || []);
  const rightTimes = [...RIGHT_ALPHA].flatMap(k => keyStats[k]?.times || []);
  if (leftTimes.length > 8 && rightTimes.length > 8) {
    const lAvg = leftTimes.reduce((a,b)=>a+b,0)  / leftTimes.length;
    const rAvg = rightTimes.reduce((a,b)=>a+b,0) / rightTimes.length;
    if (lAvg > rAvg * 1.4) {
      insights.push({ priority:3, text: `Your left hand is ${Math.round((lAvg/rAvg-1)*100)}% slower than your right. Left-hand home keys (A S D F) may need focused drills in Module 3.` });
    } else if (rAvg > lAvg * 1.4) {
      insights.push({ priority:3, text: `Your right hand lags ${Math.round((rAvg/lAvg-1)*100)}% behind your left. Right-index keys (J U Y H N M) may need extra attention.` });
    }
  }

  /* Keyboard dependency analysis */
  if (dep > 65) {
    insights.push({ priority:5, text: `Keyboard dependency at ${Math.round(dep)}% — you're heavily relying on visual confirmation. Try Ghost mode in Module 2 to start breaking the visual crutch.` });
  } else if (dep < 18) {
    insights.push({ priority:0, text: `Outstanding! Keyboard dependency at just ${Math.round(dep)}% — you're achieving genuine touch-typing autonomy. Push to Hardcore Blind mode in Module 6.` });
  } else if (dep < 35) {
    insights.push({ priority:1, text: `Good independence at ${Math.round(dep)}% dependency. Try the No-Look Word Run challenge in Module 6 to pressure-test your spatial memory.` });
  }

  /* Sort by priority, take top 3 */
  return insights.sort((a,b) => b.priority - a.priority).slice(0,3).map(i => i.text);
};

/**
 * computeBlindScore
 * Returns a 0–100 score representing touch-typing mastery.
 * @param {{ keyStats, keyboardDependency }} data
 */
export const computeBlindScore = ({ keyStats = {}, keyboardDependency = 100 }) => {
  /* Finger memory score: overall accuracy */
  const allAttempts = Object.values(keyStats).reduce((a,s) => a + s.attempts, 0);
  const allErrors   = Object.values(keyStats).reduce((a,s) => a + s.errors,   0);
  const memScore    = allAttempts > 0 ? (1 - allErrors / allAttempts) * 100 : 0;

  /* Reaction confidence: % of keys answered within 800ms */
  const allTimes  = Object.values(keyStats).flatMap(s => s.times);
  const fastCount = allTimes.filter(t => t < 800).length;
  const reactionScore = allTimes.length > 0 ? (fastCount / allTimes.length) * 100 : 0;

  /* Independence score: inverse of dependency */
  const independenceScore = Math.max(0, 100 - keyboardDependency);

  /* Weighted composite */
  const w = allAttempts > 0 ? 1 : 0; // no score until data exists
  return w * Math.round(memScore * 0.45 + reactionScore * 0.30 + independenceScore * 0.25);
};

/**
 * analyzeParagraphSession
 * Performs cognitive rhythm analysis on a paragraph training session.
 */
export const analyzeParagraphSession = ({ text, timeMs, errors, timestamps = [] }) => {
  const words = (text || '').trim().split(/\s+/).length || 1;
  const chars = text?.length || 1;
  const minutes = timeMs / 60000 || 0.1;
  const wpm = Math.round((chars / 5) / minutes);
  const accuracy = Math.max(0, Math.round((1 - errors / chars) * 100));

  // keystroke intervals
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    const diff = timestamps[i].time - timestamps[i - 1].time;
    if (diff > 0 && diff < 3000) {
      intervals.push(diff);
    }
  }

  // flow consistency & speed deviation
  let flow = 70;
  let devMs = 120;
  if (intervals.length > 2) {
    const sorted = [...intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
    devMs = Math.round(Math.sqrt(variance));

    const withinRange = intervals.filter(t => Math.abs(t - median) < median * 0.35).length;
    flow = Math.round((withinRange / intervals.length) * 100);
  }

  // hesitation analysis
  let puncPauses = 0;
  let alphaPauses = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const diff = timestamps[i].time - timestamps[i - 1].time;
    if (diff > 400) {
      const char = timestamps[i].char || '';
      if (/[.,\/#!$%\^&\*;:{}=\-_`~()?]/.test(char)) {
        puncPauses++;
      } else {
        alphaPauses++;
      }
    }
  }

  const feedback = [];
  if (accuracy < 92) {
    feedback.push("Your accuracy drops during high-speed transitions. Focus on clean key strikes.");
  } else if (accuracy >= 98 && wpm > 60) {
    feedback.push("Superb precision! You are maintaining an elite accuracy profile at high WPM.");
  }

  if (flow < 60) {
    feedback.push("Your typing cadence has high irregularity. Aim for a steady metronome-like rhythm.");
  } else if (flow >= 85) {
    feedback.push("Outstanding flow! Your fingers are fluidly sequencing words without hesitation.");
  }

  if (puncPauses > alphaPauses && puncPauses > 1) {
    feedback.push("Punctuation transitions slow your rhythm. Practice anchoring before punctuation reaches.");
  } else if (alphaPauses > 3) {
    feedback.push("We detected hesitation on long word extensions. Spend time mapping upper/lower reaches.");
  }

  if (feedback.length === 0) {
    feedback.push("Stable rhythm and clean transitions. Keep pushing the pace!");
  }

  return {
    wpm,
    accuracy,
    flow,
    rhythmDeviationMs: devMs,
    hesitationIndex: puncPauses + alphaPauses,
    feedback: feedback.slice(0, 3)
  };
};

/**
 * analyzeWritingSession
 * Performs typing rhythm and cognitive flow analysis on a free writing session.
 */
export const analyzeWritingSession = (text, timeMs, timestamps = []) => {
  return analyzeParagraphSession({ text, timeMs, errors: 0, timestamps });
};


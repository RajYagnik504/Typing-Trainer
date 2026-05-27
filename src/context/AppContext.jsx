import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const DEFAULT_ACADEMY_PROGRESS = {
  keyStats: {}, keyboardDependency: null,
  fingerMemoryScore: 0, reactionConfidence: 0,
  blindScore: 0, rank: 'Beginner', weakKeys: [],
  masteryStage: 1,
  writingStats: { sessionsCount: 0, avgWpm: 0, avgAccuracy: 0, avgFlow: 0 },
};

const DEFAULT_GAME_METRICS = {
  bubblePop   : { sessions: [], best: {} },
  a2zSpeed    : { sessions: [], best: {} },
  neonWordRush: { sessions: [], best: {} },
  rhythmStrike: { sessions: [], best: {} },
};

export const AppProvider = ({ children }) => {

  /* ── User Profile & Settings ───────────────────────────────────────── */
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('tm_profile');
    return saved ? JSON.parse(saved) : {
      username  : 'Guest_Typist',
      skillLevel: 'Beginner',
      score     : 0,
      joinDate  : new Date().toISOString(),
    };
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tm_settings');
    return saved ? JSON.parse(saved) : {
      performanceMode: 'High',         // High | Medium | Minimal
      difficultyMode : 'Intermediate', // Beginner | Intermediate | Advanced | Zen | Hardcore
    };
  });

  /* ── Session & Metrics History ─────────────────────────────────────── */
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('tm_history');
    return saved ? JSON.parse(saved) : [];
  });

  /* ── Achievements ──────────────────────────────────────────────────── */
  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('tm_achievements');
    return saved ? JSON.parse(saved) : [];
  });

  /* ── Academy Progress ────────────────────────────────────────────────── */
  const [academyProgress, setAcademyProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('tm_academy');
      return saved ? { ...DEFAULT_ACADEMY_PROGRESS, ...JSON.parse(saved) } : DEFAULT_ACADEMY_PROGRESS;
    } catch { return DEFAULT_ACADEMY_PROGRESS; }
  });

  /* ── Cross-game Metrics Accumulator ───────────────────────────────── */
  const [gameMetrics, setGameMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem('tm_game_metrics');
      return saved ? { ...DEFAULT_GAME_METRICS, ...JSON.parse(saved) } : DEFAULT_GAME_METRICS;
    } catch { return DEFAULT_GAME_METRICS; }
  });

  /* ── Convenience: record a completed game session ─────────────────── */
  const recordGameSession = (gameKey, sessionData) => {
    setGameMetrics(prev => {
      const game     = prev[gameKey] || { sessions: [], best: {} };
      const sessions = [sessionData, ...game.sessions].slice(0, 50); // keep 50

      // Update bests (simple numeric field comparison)
      const best = { ...game.best };
      Object.entries(sessionData).forEach(([k, v]) => {
        if (typeof v === 'number') {
          // Higher is better for score/accuracy fields; lower for *_ms fields
          const lowerIsBetter = k.endsWith('_ms') || k.endsWith('_deviation');
          if (best[k] === undefined) {
            best[k] = v;
          } else if (lowerIsBetter ? v < best[k] : v > best[k]) {
            best[k] = v;
          }
        }
      });

      return { ...prev, [gameKey]: { sessions, best } };
    });
  };

  /* ── Persist to localStorage ───────────────────────────────────────── */
  useEffect(() => { localStorage.setItem('tm_profile',     JSON.stringify(profile));     }, [profile]);
  useEffect(() => { localStorage.setItem('tm_history',     JSON.stringify(history));     }, [history]);
  useEffect(() => { localStorage.setItem('tm_achievements',JSON.stringify(achievements)); }, [achievements]);
  useEffect(() => { localStorage.setItem('tm_game_metrics',JSON.stringify(gameMetrics)); }, [gameMetrics]);
  useEffect(() => { localStorage.setItem('tm_academy',      JSON.stringify(academyProgress)); }, [academyProgress]);

  useEffect(() => {
    localStorage.setItem('tm_settings', JSON.stringify(settings));
    document.body.classList.remove('perf-high', 'perf-medium', 'perf-minimal');
    document.body.classList.add(`perf-${settings.performanceMode.toLowerCase()}`);
  }, [settings]);

  const unlockAchievement = (id, name, desc, icon) => {
    setAchievements(prev => {
      if (prev.some(a => a.id === id)) return prev;
      return [...prev, { id, name, desc, icon, date: new Date().toISOString() }];
    });
  };

  const value = {
    profile, setProfile,
    settings, setSettings,
    history,  setHistory,
    achievements, setAchievements, unlockAchievement,
    gameMetrics,  setGameMetrics, recordGameSession,
    academyProgress, setAcademyProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);

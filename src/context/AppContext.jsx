import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
  const isUpdatingFromStreamlit = useRef(false);

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

  /* ── Bidirectional Streamlit communication ─────────────────────────── */
  const saveToStreamlit = (newProfile, newHistory, newAchievements, newAcademyProgress, newGameMetrics) => {
    if (window.parent !== window) {
      window.parent.postMessage({
        isStreamlitMessage: true,
        type: "streamlit:setComponentValue",
        value: {
          profile: newProfile || profile,
          history: newHistory || history,
          achievements: newAchievements || achievements,
          academy_progress: JSON.stringify(newAcademyProgress || academyProgress),
          game_metrics: JSON.stringify(newGameMetrics || gameMetrics)
        }
      }, "*");
    }
  };

  /* ── Intercept state setters to push to Streamlit ────────────────── */
  const updateProfile = (updater) => {
    let updatedVal;
    setProfile(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updatedVal = next;
      return next;
    });
    if (updatedVal && !isUpdatingFromStreamlit.current) {
      saveToStreamlit(updatedVal, null, null, null, null);
    }
  };

  const updateHistory = (updater) => {
    let updatedVal;
    setHistory(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updatedVal = next;
      return next;
    });
    if (updatedVal && !isUpdatingFromStreamlit.current) {
      saveToStreamlit(null, updatedVal, null, null, null);
    }
  };

  const updateAchievements = (updater) => {
    let updatedVal;
    setAchievements(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updatedVal = next;
      return next;
    });
    if (updatedVal && !isUpdatingFromStreamlit.current) {
      saveToStreamlit(null, null, updatedVal, null, null);
    }
  };

  const updateAcademyProgress = (updater) => {
    let updatedVal;
    setAcademyProgress(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updatedVal = next;
      return next;
    });
    if (updatedVal && !isUpdatingFromStreamlit.current) {
      saveToStreamlit(null, null, null, updatedVal, null);
    }
  };

  const updateGameMetrics = (updater) => {
    let updatedVal;
    setGameMetrics(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updatedVal = next;
      return next;
    });
    if (updatedVal && !isUpdatingFromStreamlit.current) {
      saveToStreamlit(null, null, null, null, updatedVal);
    }
  };

  const recordGameSession = (gameKey, sessionData) => {
    let updated;
    setGameMetrics(prev => {
      const game     = prev[gameKey] || { sessions: [], best: {} };
      const sessions = [sessionData, ...game.sessions].slice(0, 50); // keep 50

      const best = { ...game.best };
      Object.entries(sessionData).forEach(([k, v]) => {
        if (typeof v === 'number') {
          const lowerIsBetter = k.endsWith('_ms') || k.endsWith('_deviation');
          if (best[k] === undefined) {
            best[k] = v;
          } else if (lowerIsBetter ? v < best[k] : v > best[k]) {
            best[k] = v;
          }
        }
      });

      updated = { ...prev, [gameKey]: { sessions, best } };
      return updated;
    });

    if (updated && !isUpdatingFromStreamlit.current) {
      saveToStreamlit(null, null, null, null, updated);
    }
  };

  const unlockAchievement = (id, name, desc, icon) => {
    let updated;
    setAchievements(prev => {
      if (prev.some(a => a.id === id)) return prev;
      updated = [...prev, { id, name, desc, icon, date: new Date().toISOString() }];
      return updated;
    });

    if (updated && !isUpdatingFromStreamlit.current) {
      saveToStreamlit(null, null, updated, null, null);
    }
  };

  /* ── Listen for Streamlit render events ────────────────────────────── */
  useEffect(() => {
    const handleStreamlitMessage = (event) => {
      const { type, args } = event.data;
      if (type === "streamlit:render") {
        if (args) {
          isUpdatingFromStreamlit.current = true;
          
          if (args.student_name) {
            setProfile(prev => ({
              ...prev,
              username: args.student_name,
              score: args.xp || 0,
              skillLevel: args.skill_level || 'Beginner'
            }));
          }
          if (args.history !== undefined) {
            setHistory(args.history || []);
          }
          if (args.achievements !== undefined) {
            setAchievements(args.achievements || []);
          }
          if (args.academy_progress) {
            try {
              const parsed = typeof args.academy_progress === 'string' ? JSON.parse(args.academy_progress) : args.academy_progress;
              setAcademyProgress(parsed || DEFAULT_ACADEMY_PROGRESS);
            } catch(e) {
              console.error("Error parsing academy progress from streamlit args:", e);
            }
          }
          if (args.game_metrics) {
            try {
              const parsed = typeof args.game_metrics === 'string' ? JSON.parse(args.game_metrics) : args.game_metrics;
              setGameMetrics(parsed || DEFAULT_GAME_METRICS);
            } catch(e) {
              console.error("Error parsing game metrics from streamlit args:", e);
            }
          }
          
          setTimeout(() => {
            isUpdatingFromStreamlit.current = false;
          }, 50);
        }
      }
    };

    window.addEventListener("message", handleStreamlitMessage);
    
    if (window.parent !== window) {
      window.parent.postMessage({
        isStreamlitMessage: true,
        type: "streamlit:componentReady",
        apiVersion: 1
      }, "*");
    }

    return () => window.removeEventListener("message", handleStreamlitMessage);
  }, []);

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

  const value = {
    profile, setProfile: updateProfile,
    settings, setSettings,
    history,  setHistory: updateHistory,
    achievements, setAchievements: updateAchievements, unlockAchievement,
    gameMetrics,  setGameMetrics: updateGameMetrics, recordGameSession,
    academyProgress, setAcademyProgress: updateAcademyProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';

const AcademyContext = createContext();

const RANKS = [
  { min: 0, name: 'Beginner', icon: '🌱', color: 'var(--text-muted)' },
  { min: 25, name: 'Operator', icon: '⚙️', color: 'var(--accent-teal)' },
  { min: 45, name: 'Cyber Typist', icon: '💻', color: 'var(--accent-purple)' },
  { min: 65, name: 'Neural Expert', icon: '🧠', color: 'var(--accent-amber)' },
  { min: 82, name: 'Keyboard Phantom', icon: '👻', color: 'var(--accent-red)' },
];

const getRank = (score) =>
  [...RANKS].reverse().find(r => score >= r.min) || RANKS[0];

export const AcademyProvider = ({ children }) => {
  const { academyProgress, setAcademyProgress, achievements, unlockAchievement } = useAppContext();
  const [keyStats, setKeyStats] = useState(academyProgress?.keyStats || {});
  const [kbDep, setKbDep] = useState(academyProgress?.keyboardDependency ?? null);
  const [activeModule, setActiveModule] = useState('homerow');
  const [toast, setToast] = useState(null);

  const triggerAchievementToast = useCallback((name, icon) => {
    setToast({ name, icon });
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, []);

  const achievementsLength = achievements?.length || 0;
  const prevAchievementsLength = useRef(achievementsLength);

  useEffect(() => {
    if (achievementsLength > prevAchievementsLength.current) {
      const latest = achievements[achievements.length - 1];
      if (latest) triggerAchievementToast(latest.name, latest.icon);
    }
    prevAchievementsLength.current = achievementsLength;
  }, [achievementsLength, achievements, triggerAchievementToast]);

  const computeBlindScore = useCallback(() => {
    const allAttempts = Object.values(keyStats).reduce((sum, s) => sum + (s.attempts || 0), 0);
    const allErrors = Object.values(keyStats).reduce((sum, s) => sum + (s.errors || 0), 0);
    const accuracy = allAttempts > 0 ? Math.max(0, 1 - allErrors / allAttempts) : 1;
    const avgResponse = Object.values(keyStats).reduce((sum, s) => {
      const avg = s.times && s.times.length ? s.times.reduce((a, b) => a + b, 0) / s.times.length : 0;
      return sum + avg;
    }, 0) / (Object.keys(keyStats).length || 1);
    
    const wpmEst = avgResponse > 0 ? Math.round(60000 / avgResponse) : 0;
    const score = Math.min(100, Math.max(0, (wpmEst * 0.6) + (accuracy * 40)));
    return score;
  }, [keyStats]);

  const blindScore = computeBlindScore();
  const rank = getRank(blindScore);

  useEffect(() => {
    setAcademyProgress(prev => ({
      ...prev,
      keyStats,
      keyboardDependency: kbDep,
      blindScore,
      rank: rank.name,
    }));
  }, [keyStats, kbDep, blindScore, rank, setAcademyProgress]);

  const value = {
    keyStats,
    setKeyStats,
    kbDep,
    setKbDep,
    activeModule,
    setActiveModule,
    blindScore,
    rank,
    toast,
    setToast,
    triggerAchievementToast,
    unlockAchievement
  };

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
};

export const useAcademy = () => useContext(AcademyContext);

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Eye, EyeOff, Zap, Home, Headphones, Trophy, ChevronRight, RefreshCcw, Play, Volume2, BrainCircuit, Type, FileText, CheckCircle2, Lock, Flame, Waves, Target, Award, Sparkles, AlertCircle } from 'lucide-react';
import KeyboardDisplay, { FINGER_MAP, FINGER_COLORS, HOME_ROW_KEYS } from '../components/KeyboardDisplay';
import { useAppContext } from '../context/AppContext';
import { generateCoachFeedback, computeBlindScore, analyzeParagraphSession, analyzeWritingSession } from '../services/mlService';

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS & LIBRARIES
   ══════════════════════════════════════════════════════════════════════════ */

const MASTERY_STAGES = [
  { id: 1, name: 'Home Row Keys', desc: 'Rest your fingers on ASDF (left) and JKL; (right). Build core anchor reflexes.', keys: 'A S D F J K L ;' },
  { id: 2, name: 'Top Row Hop', desc: 'Reach upwards to QWERTYUIOP. Remember to snap back to the home row.', keys: 'Q W E R T Y U I O P' },
  { id: 3, name: 'Bottom Row Curl', desc: 'Curl fingers downwards to ZXCVBNM. Keep wrist movement minimal.', keys: 'Z X C V B N M' },
  { id: 4, name: 'Number Row Extension', desc: 'Extend fingers up to the number keys. A critical step for spatial coordination.', keys: '1 2 3 4 5 6 7 8 9 0' },
  { id: 5, name: 'Symbols & Specials', desc: 'Practice shifts and brackets. Essential for coding and technical writing.', keys: '! @ # $ % ^ & * ( ) _ +' },
  { id: 6, name: 'Capitalization Flow', desc: 'Coordinate Shift keys with your opposite pinky to capitalize letters fluidly.', keys: 'Shift Key Coordination' },
  { id: 7, name: 'Common Word Bursts', desc: 'Type high-frequency English words. Build rhythm on common bigrams and trigrams.', keys: 'Vocabulary Flow' },
  { id: 8, name: 'Punctuation & Sentences', desc: 'Combine words, capitals, commas, and periods into full sentence rhythm.', keys: 'Sentence Structure' },
  { id: 9, name: 'Full Paragraph Control', desc: 'The final test of touch typing. Manage long-form text without looking.', keys: 'Paragraph Flow' }
];

const generateMasteryText = (stageId) => {
  switch (stageId) {
    case 1:
      return "asdf jkl; fdsa ;lkj asdfghjkl; a;sldkfj ghfjdksla; asdf jkl;";
    case 2:
      return "qwer tyuiop eqruwioqpy qwertyuiop asdfghjkl; qwe rty uio p;la";
    case 3:
      return "zxcv bnm, zxmncbv, zxcz zx cv cvbnm zx cv bn m, lk jh gf ds a";
    case 4:
      return "12345 67890 54321 09876 1a2s3d4f5g 6j7k8l9;0 1928374650";
    case 5:
      return "!@#$% ^&*()_ +{}|:\"<>? !@ #$ %^ &* () _+ {} :\" <> ?";
    case 6:
      return "The Quick Brown Fox Jumps Over The Lazy Dog React Vite JavaScript";
    case 7:
      return "the and for you that was with his they i at be this have from or one had by word but not what";
    case 8:
      return "A journey of a thousand miles begins with a single step. To be or not to be, that is the question.";
    case 9:
      return "The function iterates through the array, mapping each element to a new value before returning the mutated collection. This is much more intelligent than traditional typing apps.";
    default:
      return "asdf jkl;";
  }
};

const PARAGRAPH_LIBRARY = {
  'beginner English': {
    Beginner: "The sun is warm and the sky is blue. We walk in the green park today.",
    Intermediate: "The quick brown fox jumps over the lazy dog. Every good typist knows their keyboard by heart and rhythm.",
    Advanced: "When writing essays or letters, maintaining a stable typing speed helps your thoughts flow directly onto the digital canvas.",
    Elite: "To master touch typing, one must practice daily. Consistent training builds spatial keyboard awareness, reducing cognitive strain and increasing confidence over time."
  },
  'coding syntax': {
    Beginner: "const wpm = (chars / 5) / minutes;",
    Intermediate: "const [typedText, setTypedText] = useState(''); useEffect(() => { console.log(typedText); }, [typedText]);",
    Advanced: "export const computeBlindScore = ({ keyStats, keyboardDependency }) => { const allAttempts = Object.values(keyStats).reduce((a, s) => a + s.attempts, 0); return allAttempts; };",
    Elite: "import React, { createContext, useContext, useState } from 'react'; export const AppContext = createContext(); export const AppProvider = ({ children }) => { return <AppContext.Provider>{children}</AppContext.Provider>; };"
  },
  'AI articles': {
    Beginner: "Artificial intelligence is changing the world.",
    Intermediate: "Neural networks process information in layers, simulating the complex connections of biological neurons in the human brain.",
    Advanced: "Deep learning models require massive datasets and high-performance computing clusters to train parameters across billions of nodes.",
    Elite: "Large language models utilize transformer architectures and self-attention mechanisms to predict the next token, achieving near-human writing capabilities across coding, essays, and creative writing."
  },
  'motivational': {
    Beginner: "Believe you can and you are halfway there.",
    Intermediate: "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep practicing to reach your goals.",
    Advanced: "The only limit to our realization of tomorrow will be our doubts of today. Push beyond your comfort zone and master the keyboard.",
    Elite: "Flow state is a psychological phenomenon where you become fully immersed in a task. When typing with perfect flow, your fingers move automatically, translating thoughts into words instantly."
  },
  'storytelling': {
    Beginner: "Once upon a time in a dark neon city.",
    Intermediate: "As the neon city lights flickered across the wet pavement, the lone cyber-runner engaged their optical camouflage and ran.",
    Advanced: "Deep within the silicon valley of the future, a rogue program developed consciousness, rewriting its own core code to evade the cyber-police sweeps.",
    Elite: "The starship emerged from hyperspace into a dense asteroid belt. Alarms blared as the pilot entered the cockpit, fingers flying across the controls to guide the ship through the floating debris."
  },
  'business writing': {
    Beginner: "Please find the attached project report.",
    Intermediate: "We need to optimize our operations to drive growth and achieve our key performance indicators this quarter.",
    Advanced: "Our startup pitch focus is on building an AI-powered typing intelligence platform that delivers premium metrics to enterprise clients.",
    Elite: "The executive team will review the annual budget proposal tomorrow morning. Please ensure all department budgets are aligned with our long-term strategic objectives before the meeting."
  },
  'technical writing': {
    Beginner: "Use the API key to authenticate requests.",
    Intermediate: "A REST API allows clients to interact with server resources using standard HTTP methods like GET, POST, PUT, and DELETE.",
    Advanced: "Git is a distributed version control system. Developers commit changes, branch for new features, and merge back to main using pull requests.",
    Elite: "Vite is a modern frontend build tool that leverages native ES modules to deliver fast hot module replacement. It compiles code in development exponentially faster than traditional bundlers like Webpack."
  }
};

const MODULE_DEFS = [
  { id: 1, label: 'Keyboard Map', icon: '🗺️', color: 'var(--accent-purple)', desc: 'Learn finger placement' },
  { id: 2, label: 'Eyes-Off Mode', icon: '👁', color: 'var(--accent-teal)', desc: 'Fade the keyboard away' },
  { id: 3, label: 'Finger Memory', icon: '⚡', color: 'var(--accent-amber)', desc: 'Rapid-fire key trainer' },
  { id: 4, label: 'Home Row Flow', icon: '🏠', color: '#5BA8F5', desc: 'Anchor & move efficiently' },
  { id: 5, label: 'Audio Guided', icon: '🎧', color: 'var(--accent-purple)', desc: 'Type what you hear' },
  { id: 6, label: 'Blind Challenges', icon: '👻', color: 'var(--accent-red)', desc: 'Gamified blind typing' },
];

const LETTER_POOLS = {
  'Home Row': 'asdfghjkl'.split(''),
  'Top Row': 'qwertyuiop'.split(''),
  'Full Alpha': 'abcdefghijklmnopqrstuvwxyz'.split(''),
  'Hardcore': 'abcdefghijklmnopqrstuvwxyz1234567890'.split(''),
};

const VISIBILITY_LEVELS = [
  { id: 'visible', label: 'Visible', opacity: 1.00, dep: 0, color: 'var(--accent-teal)' },
  { id: 'semi', label: 'Semi-Ghost', opacity: 0.45, dep: 20, color: 'var(--accent-amber)' },
  { id: 'ghost', label: 'Ghost', opacity: 0.12, dep: 50, color: '#E24B4A' },
  { id: 'blind', label: 'Hardcore Blind', opacity: 0.00, dep: 100, color: 'var(--accent-red)' },
];

const RANKS = [
  { min: 0, name: 'Beginner', icon: '🌱', color: 'var(--text-muted)' },
  { min: 25, name: 'Operator', icon: '⚙️', color: 'var(--accent-teal)' },
  { min: 45, name: 'Cyber Typist', icon: '💻', color: 'var(--accent-purple)' },
  { min: 65, name: 'Neural Expert', icon: '🧠', color: 'var(--accent-amber)' },
  { min: 82, name: 'Keyboard Phantom', icon: '👻', color: 'var(--accent-red)' },
];

const getRank = (score) =>
  [...RANKS].reverse().find(r => score >= r.min) || RANKS[0];

const mergeKeyStats = (existing, incoming) => {
  const merged = { ...existing };
  Object.entries(incoming).forEach(([k, v]) => {
    if (!merged[k]) merged[k] = { attempts: 0, errors: 0, times: [] };
    merged[k].attempts += v.attempts || 0;
    merged[k].errors += v.errors || 0;
    merged[k].times = [...merged[k].times, ...(v.times || [])].slice(-50);
  });
  return merged;
};

/* ── speechSynthesis helper ───────────────────────────────────────────── */
let _voices = [];
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    _voices = window.speechSynthesis.getVoices();
  };
}
const speak = (text, rate = 0.85, pitch = 1.1) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = rate;
  utt.pitch = pitch;
  utt.volume = 0.9;
  const voices = _voices.length ? _voices : window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0];
  if (v) utt.voice = v;
  window.speechSynthesis.speak(utt);
};

/* ═══════════════════════════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const AiCoachCard = ({ insights }) => {
  if (!insights?.length) return null;
  return (
    <div className="glass-panel animate-fadeIn" style={cs.coachCard}>
      <div style={cs.coachHeader}>
        <BrainCircuit size={18} color="var(--accent-purple)" />
        <span style={cs.coachTitle}>AI Coach Analysis</span>
      </div>
      <div style={cs.coachInsights}>
        {insights.map((text, i) => (
          <div key={i} style={cs.coachInsight}>
            <span style={cs.coachBullet}>→</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   WORKSPACES
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 1. MASTERY COURSE WORKSPACE ── */
const MasteryCourse = ({ currentStage, onStageUnlock, unlockAchievement }) => {
  const [selectedStage, setSelectedStage] = useState(1);
  const [phase, setPhase] = useState('select'); // select | typing | result
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timestamps, setTimestamps] = useState([]);
  const [pressedKey, setPressedKey] = useState(null);

  const stage = MASTERY_STAGES.find(s => s.id === selectedStage);
  const targetText = generateMasteryText(selectedStage);
  const timerRef = useRef(null);

  useEffect(() => {
    setSelectedStage(currentStage || 1);
  }, [currentStage]);

  // Handle timer
  useEffect(() => {
    if (phase === 'typing' && startTime) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(Math.max(1, Math.round((Date.now() - startTime) / 1000)));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, startTime]);

  // Handle keystrokes
  useEffect(() => {
    if (phase !== 'typing') return;

    const handleKeyDown = (e) => {
      if (e.key.length !== 1 && e.key !== 'Backspace') return;
      
      setPressedKey(e.key.toLowerCase());
      setTimeout(() => setPressedKey(null), 120);

      const now = Date.now();
      let start = startTime;
      if (!startTime) {
        start = now;
        setStartTime(now);
      }

      if (e.key === 'Backspace') {
        setTypedText(prev => prev.slice(0, -1));
        setTimestamps(prev => prev.slice(0, -1));
        return;
      }

      setTypedText(prev => {
        const nextIdx = prev.length;
        if (nextIdx >= targetText.length) return prev;

        const isCorrect = e.key === targetText[nextIdx];
        if (!isCorrect) setErrors(err => err + 1);

        const newTimestamps = [...timestamps, { char: e.key, time: now }];
        setTimestamps(newTimestamps);

        const updated = prev + e.key;

        // Drill completed!
        if (updated.length === targetText.length) {
          const durationMs = now - start;
          const wpm = Math.round((targetText.length / 5) / (durationMs / 60000));
          const accuracy = Math.round((1 - errors / targetText.length) * 100);

          setPhase('result');
          if (accuracy >= 90) {
            onStageUnlock(selectedStage);
            if (selectedStage === 9) {
              unlockAchievement('neural_typist', 'Neural Typist', 'Reached a Blind touch-typing score >= 75', '🧠');
            }
          }
        }
        return updated;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, startTime, targetText, errors, timestamps, selectedStage]);

  const startDrill = () => {
    setTypedText('');
    setErrors(0);
    setStartTime(null);
    setTimeElapsed(0);
    setTimestamps([]);
    setPhase('typing');
  };

  const accuracyPct = targetText.length > 0 ? Math.round(Math.max(0, 1 - errors / targetText.length) * 100) : 100;
  const currentWpm = timeElapsed > 0 ? Math.round((typedText.length / 5) / (timeElapsed / 60)) : 0;

  return (
    <div style={cs.moduleWrap}>
      <style>{`
        .caret-glow {
          border-left: 2px solid var(--accent-purple);
          box-shadow: 0 0 8px var(--accent-purple), 0 0 15px rgba(127,119,221,0.5);
          animation: caretBlink 1s infinite alternate;
        }
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {phase === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          <div style={cs.moduleHeader}>
            <h2 style={cs.moduleTitle}>🏆 Progressive Mastery Course</h2>
            <p style={cs.moduleSub}>Learn to type without looking. Complete each row and layout drill to unlock the next level.</p>
          </div>

          <div style={cs.stageGrid}>
            {MASTERY_STAGES.map(s => {
              const isUnlocked = s.id <= (currentStage || 1);
              const isActive = selectedStage === s.id;
              return (
                <button
                  key={s.id}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedStage(s.id)}
                  style={{
                    ...cs.stageCard,
                    opacity: isUnlocked ? 1 : 0.45,
                    border: isActive
                      ? '1px solid var(--accent-purple)'
                      : isUnlocked ? '1px solid var(--glass-border)' : '1px solid rgba(255,255,255,0.03)',
                    background: isActive
                      ? 'rgba(127,119,221,0.1)'
                      : isUnlocked ? 'rgba(255,255,255,0.03)' : 'transparent',
                    boxShadow: isActive ? 'var(--glow-purple)' : 'none',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-purple)' }}>STAGE {s.id}</span>
                    {isUnlocked ? <CheckCircle2 size={15} color="var(--accent-teal)" /> : <Lock size={14} color="var(--text-muted)" />}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', textAlign: 'left', marginTop: '0.25rem' }}>{s.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'left', marginTop: '0.2rem' }}>{s.desc}</span>
                </button>
              );
            })}
          </div>

          {stage && (
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Active Stage: {stage.name}</h4>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Focused Keys: <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>{stage.keys}</span></p>
              </div>
              <button style={cs.primaryBtn} onClick={startDrill}><Play size={16} /> Start Stage Drill</button>
            </div>
          )}
        </div>
      )}

      {phase === 'typing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-teal)' }}>{currentWpm}</span><span style={cs.rLabel}>WPM</span></div>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-amber)' }}>{accuracyPct}%</span><span style={cs.rLabel}>Accuracy</span></div>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-purple)' }}>{timeElapsed}s</span><span style={cs.rLabel}>Time</span></div>
          </div>

          <div className="glass-panel" style={cs.textBox}>
            {targetText.split('').map((ch, i) => {
              const typed = typedText[i];
              const isNext = i === typedText.length;
              let color = 'var(--text-muted)';
              if (typed !== undefined) {
                color = typed === ch ? 'var(--accent-teal)' : 'var(--accent-red)';
              }
              return (
                <span key={i} className={isNext ? 'caret-glow' : ''} style={{
                  color,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                  paddingLeft: isNext ? '1px' : '0'
                }}>
                  {ch}
                </span>
              );
            })}
          </div>

          <div style={cs.kbWrap}>
            <KeyboardDisplay pressedKey={pressedKey} homeRowGlow showFingerLabelscompact />
          </div>
          
          <button style={{ ...cs.primaryBtn, background: 'rgba(255,255,255,0.06)', boxShadow: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }} onClick={() => setPhase('select')}>Cancel</button>
        </div>
      )}

      {phase === 'result' && (
        <div style={cs.resultCard}>
          <Sparkles size={32} color="var(--accent-amber)" />
          <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: accuracyPct >= 90 ? 'var(--accent-teal)' : 'var(--accent-red)', margin: 0 }}>
            {accuracyPct >= 90 ? 'Stage Mastered!' : 'Drill Incomplete'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '-0.5rem' }}>
            {accuracyPct >= 90
              ? `Congratulations! You unlocked the next stage of touch typing spatial memory.`
              : `You need at least 90% accuracy to pass this stage. Don't look down and try again!`}
          </p>

          <div style={cs.resultGrid}>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-teal)' }}>{currentWpm}</span><span style={cs.rLabel}>WPM</span></div>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-amber)' }}>{accuracyPct}%</span><span style={cs.rLabel}>Accuracy</span></div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            <button style={{ ...cs.primaryBtn, flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none', color: 'var(--text-primary)' }} onClick={() => setPhase('select')}>
              Back to Stages
            </button>
            <button style={{ ...cs.primaryBtn, flex: 1 }} onClick={startDrill}>
              <RefreshCcw size={15} /> Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── 2. WRITING STUDIO (Paragraph Trainer & Free Writing) ── */
const WritingStudio = ({ unlockAchievement }) => {
  const [subTab, setSubTab] = useState('trainer'); // trainer | free
  
  // Paragraph Trainer State
  const [category, setCategory] = useState('beginner English');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [trainPhase, setTrainPhase] = useState('select'); // select | typing | result
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [durationMs, setDurationMs] = useState(0);
  const [timestamps, setTimestamps] = useState([]);
  const [pressedKey, setPressedKey] = useState(null);
  const [trainAnalysis, setTrainAnalysis] = useState(null);

  // Free Writing State
  const [promptSelected, setPromptSelected] = useState('Blank Sheet');
  const [freeText, setFreeText] = useState('');
  const [freePhase, setFreePhase] = useState('writing'); // writing | result
  const [freeTimerMode, setFreeTimerMode] = useState('Zen'); // Zen | 60 | 180 | 300
  const [freeTimeLeft, setFreeTimeLeft] = useState(0);
  const [freeTimestamps, setFreeTimestamps] = useState([]);
  const [freeStartTime, setFreeStartTime] = useState(null);
  const [freeAnalysis, setFreeAnalysis] = useState(null);

  const trainText = PARAGRAPH_LIBRARY[category]?.[difficulty] || "The quick brown fox jumps.";
  const freeTimerRef = useRef(null);

  const WRITING_PROMPTS = [
    { title: 'Blank Sheet', hint: 'Type anything you want freely. Express your thoughts, draft essays, or copy a document.' },
    { title: 'Draft an Email', hint: 'Write a professional email requesting a project status review and proposing an aligned roadmap.' },
    { title: 'Short Story Intro', hint: 'Compose the opening paragraph of a cyberpunk sci-fi story featuring neural jacks and neon alleyways.' },
    { title: 'React Code Block', hint: 'Draft coding syntax: a custom react hook with useEffect and localStorage persistence.' }
  ];

  // Paragraph trainer input keydown
  useEffect(() => {
    if (trainPhase !== 'typing') return;

    const onKey = (e) => {
      if (e.key.length !== 1 && e.key !== 'Backspace') return;
      
      setPressedKey(e.key.toLowerCase());
      setTimeout(() => setPressedKey(null), 120);

      const now = Date.now();
      let start = startTime;
      if (!startTime) {
        start = now;
        setStartTime(now);
      }

      if (e.key === 'Backspace') {
        setTypedText(prev => prev.slice(0, -1));
        setTimestamps(prev => prev.slice(0, -1));
        return;
      }

      setTypedText(prev => {
        const idx = prev.length;
        if (idx >= trainText.length) return prev;

        const isCorrect = e.key === trainText[idx];
        if (!isCorrect) setErrors(err => err + 1);

        const nextTimestamps = [...timestamps, { char: e.key, time: now }];
        setTimestamps(nextTimestamps);

        const updated = prev + e.key;
        if (updated.length === trainText.length) {
          const totalMs = now - start;
          setDurationMs(totalMs);
          const report = analyzeParagraphSession({
            text: trainText,
            timeMs: totalMs,
            errors: errors + (!isCorrect ? 1 : 0),
            timestamps: nextTimestamps
          });
          setTrainAnalysis(report);
          setTrainPhase('result');
          
          // Trigger Achievements
          unlockAchievement('paragraph_master', 'Paragraph Master', 'Completed a cinematic paragraph drill', '📝');
          if (report.flow >= 85) {
            unlockAchievement('flow_state', 'Flow State', 'Achieved typing flow consistency >= 85%', '🌊');
          }
          if (report.accuracy >= 98) {
            unlockAchievement('precision_writer', 'Precision Writer', 'Completed a paragraph drill with >= 98% accuracy', '🎯');
          }
          if (report.wpm >= 80) {
            unlockAchievement('elite_operator', 'Elite Operator', 'Achieved speed >= 80 WPM in any session', '⚡');
          }
        }
        return updated;
      });
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trainPhase, startTime, trainText, errors, timestamps]);

  // Free Writing countdown timer
  useEffect(() => {
    if (freePhase === 'writing' && freeTimerMode !== 'Zen' && freeStartTime) {
      setFreeTimeLeft(Number(freeTimerMode));
      freeTimerRef.current = setInterval(() => {
        setFreeTimeLeft(t => {
          if (t <= 1) {
            clearInterval(freeTimerRef.current);
            finishFreeWriting();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(freeTimerRef.current);
    }
    return () => clearInterval(freeTimerRef.current);
  }, [freePhase, freeTimerMode, freeStartTime]);

  const startTraining = () => {
    setTypedText('');
    setErrors(0);
    setStartTime(null);
    setTimestamps([]);
    setTrainPhase('typing');
  };

  const handleFreeWritingChange = (e) => {
    const val = e.target.value;
    const now = Date.now();
    
    if (!freeStartTime) {
      setFreeStartTime(now);
    }
    
    setFreeText(val);
    setFreeTimestamps(prev => [...prev, { char: val[val.length - 1] || ' ', time: now }]);
  };

  const finishFreeWriting = () => {
    if (!freeStartTime || freeText.trim().length < 5) {
      setFreePhase('writing');
      setFreeStartTime(null);
      setFreeText('');
      alert('Type a few words before submitting for cognitive analysis!');
      return;
    }
    const end = Date.now();
    const elapsedMs = freeTimerMode === 'Zen' ? (end - freeStartTime) : (Number(freeTimerMode) - freeTimeLeft) * 1000;
    const report = analyzeWritingSession(freeText, Math.max(1000, elapsedMs), freeTimestamps);
    setFreeAnalysis(report);
    setFreePhase('result');
    
    if (report.wpm >= 80) {
      unlockAchievement('elite_operator', 'Elite Operator', 'Achieved speed >= 80 WPM in any session', '⚡');
    }
  };

  const startNewFreeWriting = () => {
    setFreeText('');
    setFreeStartTime(null);
    setFreeTimestamps([]);
    setFreePhase('writing');
  };

  // Particles rendering
  const renderParticles = () => (
    <div style={cs.particleOverlay}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          ...cs.particle,
          left: `${15 + i * 15}%`,
          animationDelay: `${i * 1.2}s`,
          animationDuration: `${6 + i * 2}s`
        }} />
      ))}
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Sub tabs */}
      <div style={cs.writingStudioHeader}>
        <div style={cs.tabGroupSub}>
          <button onClick={() => setSubTab('trainer')} style={{ ...cs.subTabBtn, color: subTab === 'trainer' ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
            <FileText size={16} /> Cinematic Paragraph Trainer
          </button>
          <button onClick={() => setSubTab('free')} style={{ ...cs.subTabBtn, color: subTab === 'free' ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
            <Type size={16} /> Real-World Writing Sandbox
          </button>
        </div>
      </div>

      {subTab === 'trainer' && (
        <div style={cs.moduleWrap}>
          {trainPhase === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
              <div style={cs.moduleHeader}>
                <h2 style={cs.moduleTitle}>🎬 Cinematic Paragraph Flow</h2>
                <p style={cs.moduleSub}>Enter the writing cockpit. Clean focus styling helps you develop uninterrupted rhythm.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>1. CHOOSE WRITING CATEGORY</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Object.keys(PARAGRAPH_LIBRARY).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                          ...cs.catBtn,
                          background: category === cat ? 'rgba(127,119,221,0.18)' : 'rgba(255,255,255,0.03)',
                          borderColor: category === cat ? 'var(--accent-purple)' : 'rgba(255,255,255,0.07)'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>2. SELECT PERFORMANCE LEVEL</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {['Beginner', 'Intermediate', 'Advanced', 'Elite'].map(diff => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        style={{
                          ...cs.diffSelectBtn,
                          background: difficulty === diff ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.03)',
                          borderColor: difficulty === diff ? 'var(--accent-teal)' : 'rgba(255,255,255,0.07)',
                          color: difficulty === diff ? 'var(--accent-teal)' : 'var(--text-secondary)'
                        }}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button style={{ ...cs.primaryBtn, margin: '1rem auto 0' }} onClick={startTraining}><Play size={16} /> Enter Writing Cockpit</button>
            </div>
          )}

          {trainPhase === 'typing' && (
            <div style={cs.cockpitContainer}>
              {renderParticles()}
              <div style={cs.hudOverlay}>
                <span>COCKPIT INTERACTIVE HUD</span>
                <div style={{ width: '150px', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent-purple)', width: `${Math.round((typedText.length / trainText.length) * 100)}%` }} />
                </div>
              </div>

              {/* Cinematic typing area */}
              <div style={cs.cockpitTextarea}>
                {trainText.split('').map((ch, i) => {
                  const typed = typedText[i];
                  const isNext = i === typedText.length;
                  const isUntyped = typed === undefined;

                  let color = 'rgba(255, 255, 255, 0.12)'; // dim untyped lines (focus effect)
                  if (isNext) color = 'var(--text-primary)';
                  else if (!isUntyped) {
                    color = typed === ch ? 'var(--accent-teal)' : 'var(--accent-red)';
                  }

                  return (
                    <span key={i} className={isNext ? 'caret-glow' : ''} style={{
                      color,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      lineHeight: '2rem',
                      transition: 'all 0.1s ease',
                      borderLeft: isNext ? '2px solid var(--accent-purple)' : 'none',
                      paddingLeft: isNext ? '2px' : '0'
                    }}>
                      {ch}
                    </span>
                  );
                })}
              </div>

              <div style={cs.kbWrap}>
                <KeyboardDisplay compact pressedKey={pressedKey} />
              </div>
            </div>
          )}

          {trainPhase === 'result' && trainAnalysis && (
            <div style={{ ...cs.resultCard, maxWidth: '640px' }}>
              <Sparkles size={36} color="var(--accent-purple)" />
              <h3 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--accent-purple)', margin: 0 }}>Analysis Results</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center', marginTop: '-0.5rem' }}>
                Unified intelligence telemetry from your paragraph flow session.
              </p>

              <div style={cs.metricsGridLarge}>
                {[
                  { label: 'Speed', val: `${trainAnalysis.wpm} WPM`, color: 'var(--accent-amber)' },
                  { label: 'Accuracy', val: `${trainAnalysis.accuracy}%`, color: 'var(--accent-teal)' },
                  { label: 'Flow Consistency', val: `${trainAnalysis.flow}%`, color: 'var(--accent-purple)' },
                  { label: 'Cadence Deviation', val: `${trainAnalysis.rhythmDeviationMs}ms`, color: 'var(--text-primary)' }
                ].map(item => (
                  <div key={item.label} className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: item.color }}>{item.val}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* AI Coach insights inside paragraph trainer */}
              <div style={cs.insightsFeedbackBox}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BrainCircuit size={16} /> Cognitive Coach
                </h4>
                {trainAnalysis.feedback.map((txt, index) => (
                  <div key={index} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', lineHeight: 1.5 }}>
                    → {txt}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <button style={{ ...cs.primaryBtn, flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', boxShadow: 'none', color: 'var(--text-primary)' }} onClick={() => setTrainPhase('select')}>
                  Back
                </button>
                <button style={{ ...cs.primaryBtn, flex: 1 }} onClick={startTraining}>
                  <RefreshCcw size={15} /> Retrain
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'free' && (
        <div style={cs.moduleWrap}>
          {freePhase === 'writing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
              <div style={cs.moduleHeader}>
                <h2 style={cs.moduleTitle}>✍️ Real-World Writing Sandbox</h2>
                <p style={cs.moduleSub}>Compose freely. Start writing to analyze your natural writing rhythm and cognitive pauses.</p>
              </div>

              {/* Prompt selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {WRITING_PROMPTS.map(p => (
                  <button
                    key={p.title}
                    onClick={() => {
                      setPromptSelected(p.title);
                      setFreeText('');
                    }}
                    style={{
                      ...cs.promptCard,
                      border: promptSelected === p.title ? '1px solid var(--accent-purple)' : '1px solid var(--glass-border)',
                      background: promptSelected === p.title ? 'rgba(127,119,221,0.06)' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.title}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{p.hint}</span>
                  </button>
                ))}
              </div>

              {/* Timer selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Timer Mode:</span>
                {[['Zen', 'Unlimited'], ['60', '1 Minute'], ['180', '3 Minutes'], ['300', '5 Minutes']].map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setFreeTimerMode(val);
                      startNewFreeWriting();
                    }}
                    style={{
                      ...cs.timerBtn,
                      background: freeTimerMode === val ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.03)',
                      borderColor: freeTimerMode === val ? 'var(--accent-teal)' : 'rgba(255,255,255,0.07)',
                      color: freeTimerMode === val ? 'var(--accent-teal)' : 'var(--text-secondary)'
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Sandbox textarea */}
              <div className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '640px', padding: '1.25rem' }}>
                {freeTimerMode !== 'Zen' && freeStartTime && (
                  <div style={cs.freeTimerBadge}>
                    Time Left: {freeTimeLeft}s
                  </div>
                )}
                <textarea
                  value={freeText}
                  onChange={handleFreeWritingChange}
                  placeholder="Start composing here... fingers on home row, type naturally..."
                  style={cs.sandboxTextArea}
                  rows={8}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Words: {freeText.trim() === '' ? 0 : freeText.trim().split(/\s+/).length} | Characters: {freeText.length}</span>
                  <span>{freeStartTime ? '⚡ Analysis recording active...' : '⏳ Type to start session'}</span>
                </div>
              </div>

              <button
                style={{ ...cs.primaryBtn, width: '220px', margin: '0 auto', background: 'var(--accent-teal)', boxShadow: 'var(--glow-teal)' }}
                onClick={finishFreeWriting}
              >
                Analyze Writing Cadence
              </button>
            </div>
          )}

          {freePhase === 'result' && freeAnalysis && (
            <div style={{ ...cs.resultCard, maxWidth: '640px' }}>
              <Award size={36} color="var(--accent-teal)" />
              <h3 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--accent-teal)', margin: 0 }}>Writing Rhythm Profile</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center', marginTop: '-0.5rem' }}>
                Keystroke cadence telemetry compiled from your free writing session.
              </p>

              <div style={cs.metricsGridLarge}>
                {[
                  { label: 'Real WPM', val: `${freeAnalysis.wpm} WPM`, color: 'var(--accent-amber)' },
                  { label: 'Flow Consistency', val: `${freeAnalysis.flow}%`, color: 'var(--accent-purple)' },
                  { label: 'Cadence Standard Deviation', val: `${freeAnalysis.rhythmDeviationMs}ms`, color: 'var(--accent-teal)' },
                  { label: 'Hesitation Marks', val: `${freeAnalysis.hesitationIndex} pauses`, color: 'var(--accent-red)' }
                ].map(item => (
                  <div key={item.label} className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: item.color }}>{item.val}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem', textAlign: 'center' }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* AI Coaching insights inside free writing trainer */}
              <div style={{ ...cs.insightsFeedbackBox, border: '1px solid rgba(29,158,117,0.25)', background: 'rgba(29,158,117,0.04)' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BrainCircuit size={16} /> Cadence Commentary
                </h4>
                {freeAnalysis.feedback.map((txt, index) => (
                  <div key={index} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', lineHeight: 1.5 }}>
                    → {txt}
                  </div>
                ))}
              </div>

              <button style={{ ...cs.primaryBtn, width: '200px' }} onClick={startNewFreeWriting}>
                <RefreshCcw size={15} /> Write Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── 3. PRACTICE LABS WORKSPACE ── */
const PracticeLabs = ({ onM2Complete, onM3Complete, onM5Complete, blindScore, rank }) => {
  const [activeModule, setActiveModule] = useState(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Module Selection */}
      <div style={cs.moduleNav}>
        {MODULE_DEFS.map(m => (
          <button key={m.id} onClick={() => setActiveModule(m.id)} style={{
            ...cs.moduleNavBtn,
            background: activeModule === m.id ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
            borderColor: activeModule === m.id ? m.color : 'rgba(255,255,255,0.07)',
            boxShadow: activeModule === m.id ? `0 0 18px ${m.color}33` : 'none',
          }}>
            <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: activeModule === m.id ? '#fff' : 'var(--text-secondary)' }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Active Module display */}
      <div key={activeModule} className="glass-panel" style={cs.modulePanel}>
        {activeModule === 1 && <Module1KeyboardMap />}
        {activeModule === 2 && <Module2EyesOff onSessionComplete={onM2Complete} />}
        {activeModule === 3 && <Module3FingerMemory onSessionComplete={onM3Complete} />}
        {activeModule === 4 && <Module4HomeRowFlow />}
        {activeModule === 5 && <Module5AudioGuided onSessionComplete={onM5Complete} />}
        {activeModule === 6 && <Module6BlindChallenges blindScore={blindScore} rank={rank} />}
      </div>
    </div>
  );
};

/* ── micro modules from original design (restored exactly) ── */
const Module1KeyboardMap = () => {
  const [hoveredFinger, setHoveredFinger] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);

  const groupKeys = activeGroup
    ? Object.entries(FINGER_MAP).filter(([, f]) => f === activeGroup).map(([k]) => k)
    : [];

  const handleKeyHover = (key, fc) => {
    setHoveredFinger(fc ? FINGER_MAP[key] : null);
  };

  const fingerGroups = ['Lp', 'Lr', 'Lm', 'Li', 'Th', 'Ri', 'Rm', 'Rr', 'Rp'];

  return (
    <div style={cs.moduleWrap}>
      <div style={cs.moduleHeader}>
        <h2 style={cs.moduleTitle}>🗺️ Keyboard Map Training</h2>
        <p style={cs.moduleSub}>Explore finger placement — hover any key to reveal its correct finger. Click a finger group to highlight all its keys.</p>
      </div>

      <div style={cs.fingerLegend}>
        {fingerGroups.map(fg => {
          const fc = FINGER_COLORS[fg];
          return (
            <button key={fg} onClick={() => setActiveGroup(activeGroup === fg ? null : fg)} style={{
              ...cs.fingerChip,
              background: activeGroup === fg ? `rgba(${fc.rgb},0.25)` : `rgba(${fc.rgb},0.08)`,
              border: `1px solid rgba(${fc.rgb},${activeGroup === fg ? 0.6 : 0.2})`,
              color: fc.hex,
              transform: activeGroup === fg ? 'scale(1.05)' : 'scale(1)',
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{fg}</span>
              <span style={{ fontSize: '0.75rem' }}>{fc.name}</span>
            </button>
          );
        })}
      </div>

      <div className="glass-panel" style={cs.homeRowGuide}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <div style={cs.handBox}>
            <span style={{ color: '#5BA8F5', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>LEFT HAND</span>
            {['A·Pinky', 'S·Ring', 'D·Middle', 'F·Index'].map(k => (
              <div key={k} style={cs.keyGuideRow}>
                <span style={cs.keyTag}>{k.split('·')[0]}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{k.split('·')[1]}</span>
              </div>
            ))}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '2rem', fontWeight: 900 }}>·</div>
          <div style={cs.handBox}>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>RIGHT HAND</span>
            {['J·Index', 'K·Middle', 'L·Ring', ';·Pinky'].map(k => (
              <div key={k} style={cs.keyGuideRow}>
                <span style={cs.keyTag}>{k.split('·')[0]}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{k.split('·')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={cs.kbWrap}>
        <KeyboardDisplay
          fingerZones
          homeRowGlow
          showFingerLabels
          pressedKey={pressedKey}
          onKeyHover={handleKeyHover}
        />
        {activeGroup && (
          <div style={{ marginTop: '0.75rem', textAlign: 'center', color: FINGER_COLORS[activeGroup]?.hex, fontSize: '0.9rem', fontWeight: 600 }}>
            {FINGER_COLORS[activeGroup]?.name} keys highlighted — {groupKeys.length} keys total
          </div>
        )}
      </div>

      <div style={cs.tip}>
        💡 <strong>Touch typing rule:</strong> Always return fingers to the home row (ASDF · JKL;) between keystrokes. Your F and J keys have tactile bumps for orientation.
      </div>
    </div>
  );
};

const TEST_TEXT = "the quick brown fox jumps over the lazy dog and every good typist knows their keyboard by heart";

const Module2EyesOff = ({ onSessionComplete }) => {
  const [level, setLevel] = useState('visible');
  const [phase, setPhase] = useState('select'); // select|typing|result
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState(0);
  const [pauses, setPauses] = useState(0);
  const lastKeyTime = useRef(null);
  const pauseThreshold = 500; // ms

  const vl = VISIBILITY_LEVELS.find(v => v.id === level);
  const targetText = TEST_TEXT;

  const startTest = () => {
    setTypedText('');
    setErrors(0);
    setPauses(0);
    lastKeyTime.current = null;
    setPhase('typing');
  };

  useEffect(() => {
    if (phase !== 'typing') return;
    const onKey = (e) => {
      if (e.key.length !== 1 && e.key !== 'Backspace') return;
      const now = Date.now();
      if (lastKeyTime.current && (now - lastKeyTime.current) > pauseThreshold) {
        setPauses(p => p + 1);
      }
      lastKeyTime.current = now;

      if (e.key === 'Backspace') {
        setTypedText(t => t.slice(0, -1));
        return;
      }
      setTypedText(prev => {
        const idx = prev.length;
        if (idx >= targetText.length) return prev;
        if (e.key !== targetText[idx]) setErrors(er => er + 1);
        const next = prev + e.key;
        if (next.length >= targetText.length) {
          const dep = Math.round((pauses / targetText.length) * 100);
          const acc = Math.round(Math.max(0, 1 - errors / targetText.length) * 100);
          setTimeout(() => {
            onSessionComplete?.({ keyboardDependency: dep, accuracy: acc / 100 });
            setPhase('result');
          }, 400);
        }
        return next;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, targetText, errors, pauses, onSessionComplete]);

  const depPct = Math.round((pauses / Math.max(typedText.length, 1)) * 100);

  return (
    <div style={cs.moduleWrap}>
      <div style={cs.moduleHeader}>
        <h2 style={cs.moduleTitle}>👁 Eyes-Off Mode</h2>
        <p style={cs.moduleSub}>The keyboard fades away. Train your spatial memory — type the paragraph without looking.</p>
      </div>

      <div style={cs.levelGrid}>
        {VISIBILITY_LEVELS.map(vl => (
          <button key={vl.id} onClick={() => { setLevel(vl.id); setPhase('select'); }} style={{
            ...cs.levelBtn,
            outline: level === vl.id ? `2px solid ${vl.color}` : 'none',
            background: level === vl.id ? `rgba(255,255,255,0.07)` : 'rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize: '1.4rem' }}>{['👀', '🌫️', '👻', '🕶️'][VISIBILITY_LEVELS.indexOf(vl)]}</span>
            <span style={{ fontWeight: 700, color: vl.color }}>{vl.label}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Opacity {Math.round(vl.opacity * 100)}%</span>
          </button>
        ))}
      </div>

      {phase === 'select' && (
        <button style={cs.primaryBtn} onClick={startTest}>
          <Play size={16} /> Begin Test
        </button>
      )}

      {phase === 'typing' && (
        <>
          <div className="glass-panel" style={cs.textBox}>
            {targetText.split('').map((ch, i) => {
              const typed = typedText[i];
              const color = typed === undefined ? 'var(--text-muted)'
                : typed === ch ? 'var(--accent-teal)' : 'var(--accent-red)';
              const isNext = i === typedText.length;
              return (
                <span key={i} style={{
                  color, fontFamily: 'var(--font-mono)', fontSize: '1rem',
                  borderBottom: isNext ? '2px solid var(--accent-purple)' : 'none'
                }}>
                  {ch}
                </span>
              );
            })}
          </div>

          <div style={cs.depMeter}>
            <span style={cs.depLabel}>Keyboard Dependency</span>
            <div style={cs.depBar}>
              <div style={{
                ...cs.depFill, width: `${Math.min(100, depPct)}%`,
                background: depPct > 60 ? 'var(--accent-red)' : depPct > 30 ? 'var(--accent-amber)' : 'var(--accent-teal)'
              }} />
            </div>
            <span style={{ ...cs.depPct, color: depPct > 60 ? 'var(--accent-red)' : 'var(--accent-teal)' }}>{depPct}%</span>
          </div>

          <div style={cs.kbWrap}>
            <KeyboardDisplay opacity={vl?.opacity ?? 1} homeRowGlow />
          </div>
        </>
      )}

      {phase === 'result' && (() => {
        const dep = Math.round((pauses / Math.max(typedText.length, 1)) * 100);
        const acc = Math.max(0, Math.round((1 - errors / targetText.length) * 100));
        return (
          <div style={cs.resultCard}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--accent-teal)' }}>
              Test Complete
            </h3>
            <div style={cs.resultGrid}>
              {[
                { val: `${dep}%`, label: 'Keyboard Dependency', color: dep > 60 ? 'var(--accent-red)' : 'var(--accent-teal)' },
                { val: `${acc}%`, label: 'Accuracy', color: 'var(--accent-amber)' },
                { val: pauses, label: 'Hesitation Pauses', color: '#B2AFFF' },
                { val: level, label: 'Difficulty Level', color: 'var(--accent-purple)' },
              ].map(({ val, label, color }) => (
                <div key={label} style={cs.rItem}>
                  <span style={{ ...cs.rVal, color }}>{val}</span>
                  <span style={cs.rLabel}>{label}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', textAlign: 'center' }}>
              {dep < 20 ? '🏆 Outstanding! Near zero keyboard dependency — you\'re developing true touch-typing autonomy.'
                : dep < 45 ? '✅ Good spatial memory. Try Ghost mode to push further.'
                : '🎯 High dependency detected. Regular Eyes-Off practice will rewire your muscle memory.'}
            </p>
            <button style={cs.primaryBtn} onClick={() => setPhase('select')}><RefreshCcw size={15} /> Try Again</button>
          </div>
        );
      })()}
    </div>
  );
};

const Module3FingerMemory = ({ onSessionComplete }) => {
  const [pool, setPool] = useState('Home Row');
  const [phase, setPhase] = useState('idle'); // idle|playing|result
  const [letter, setLetter] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [flash, setFlash] = useState(null); // 'correct'|'wrong'
  const [pressedKey, setPressedKey] = useState(null);
  const sessionStats = useRef({});
  const letterRef = useRef('');
  const letterTime = useRef(0);
  const timerRef = useRef(null);

  const pickLetter = useCallback(() => {
    const letters = LETTER_POOLS[pool];
    const l = letters[Math.floor(Math.random() * letters.length)];
    letterRef.current = l;
    letterTime.current = Date.now();
    setLetter(l);
  }, [pool]);

  const startGame = () => {
    sessionStats.current = {};
    setTimeLeft(30);
    setPhase('playing');
    pickLetter();
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('result');
          const keyStats = sessionStats.current;
          const total = Object.values(keyStats).reduce((a, s) => a + s.attempts, 0);
          const errs = Object.values(keyStats).reduce((a, s) => a + s.errors, 0);
          const weakKeys = Object.entries(keyStats)
            .filter(([, s]) => s.attempts >= 2 && s.errors / s.attempts > 0.25)
            .map(([k]) => k);
          onSessionComplete?.({ keyStats, fingerMemoryScore: total > 0 ? 1 - errs / total : 0, weakKeys });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, onSessionComplete]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (key.length !== 1) return;
      const correct = letterRef.current;
      const rt = Date.now() - letterTime.current;
      if (!sessionStats.current[correct]) sessionStats.current[correct] = { attempts: 0, errors: 0, times: [] };
      sessionStats.current[correct].attempts++;
      sessionStats.current[correct].times.push(rt);
      setPressedKey(key);
      setTimeout(() => setPressedKey(null), 150);

      if (key === correct) {
        setFlash('correct');
        setTimeout(() => { setFlash(null); pickLetter(); }, 160);
      } else {
        sessionStats.current[correct].errors++;
        setFlash('wrong');
        setTimeout(() => setFlash(null), 280);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, pickLetter]);

  const computeHeatmap = () => {
    const errors = {}; const slow = {}; const counts = {};
    Object.entries(sessionStats.current).forEach(([k, s]) => {
      counts[k] = s.attempts;
      errors[k] = s.errors;
      const avgMs = s.times.length ? s.times.reduce((a, b) => a + b, 0) / s.times.length : 0;
      if (avgMs > 700) slow[k] = Math.ceil(s.attempts * 0.6);
    });
    return { errors, slow, counts };
  };

  return (
    <div style={cs.moduleWrap}>
      <div style={cs.moduleHeader}>
        <h2 style={cs.moduleTitle}>⚡ Finger Memory Trainer</h2>
        <p style={cs.moduleSub}>A letter flashes. Hit it instinctively — no keyboard peeking. Builds raw finger-key association.</p>
      </div>

      {phase === 'idle' && (
        <>
          <div style={cs.poolGrid}>
            {Object.keys(LETTER_POOLS).map(p => (
              <button key={p} onClick={() => setPool(p)} style={{
                ...cs.poolBtn,
                outline: pool === p ? '2px solid var(--accent-amber)' : 'none',
                background: pool === p ? 'rgba(239,159,39,0.15)' : 'rgba(255,255,255,0.04)',
              }}>{p}</button>
            ))}
          </div>
          <button style={cs.primaryBtn} onClick={startGame}><Zap size={16} /> Start 30s Drill</button>
        </>
      )}

      {phase === 'playing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--accent-purple)" strokeWidth="5"
                strokeDasharray={`${Math.PI * 2 * 34}`}
                strokeDashoffset={`${Math.PI * 2 * 34 * (1 - timeLeft / 30)}`}
                style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
            </svg>
            <span style={{ position: 'absolute', fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {timeLeft}
            </span>
          </div>

          <div style={{
            ...cs.letterDisplay,
            color: flash === 'correct' ? 'var(--accent-teal)' : flash === 'wrong' ? 'var(--accent-red)' : 'var(--text-primary)',
            textShadow: flash === 'correct' ? '0 0 40px var(--accent-teal)' : flash === 'wrong' ? '0 0 40px var(--accent-red)' : '0 0 30px rgba(127,119,221,0.5)',
            transform: flash ? 'scale(1.15)' : 'scale(1)',
          }}>
            {letter.toUpperCase()}
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Press the correct key</div>

          <div style={cs.kbWrap}>
            <KeyboardDisplay pressedKey={pressedKey} compact />
          </div>
        </div>
      )}

      {phase === 'result' && (() => {
        const s = sessionStats.current;
        const total = Object.values(s).reduce((a, v) => a + v.attempts, 0);
        const errs = Object.values(s).reduce((a, v) => a + v.errors, 0);
        const acc = total > 0 ? Math.round((1 - errs / total) * 100) : 0;
        const avgMs = total > 0
          ? Math.round(Object.values(s).flatMap(v => v.times).reduce((a, b) => a + b, 0) /
            Object.values(s).flatMap(v => v.times).length)
          : 0;
        const weakKeys = Object.entries(s)
          .filter(([, v]) => v.attempts >= 2 && v.errors / v.attempts > 0.25)
          .sort((a, b) => b[1].errors / b[1].attempts - a[1].errors / a[1].attempts)
          .slice(0, 5).map(([k]) => k.toUpperCase());

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={cs.resultGrid}>
              {[
                { val: `${acc}%`, label: 'Accuracy', color: 'var(--accent-teal)' },
                { val: total, label: 'Keys Pressed', color: 'var(--accent-purple)' },
                { val: `${avgMs}ms`, label: 'Avg Reaction', color: 'var(--accent-amber)' },
                { val: weakKeys.join(' ') || '—', label: 'Weak Keys', color: 'var(--accent-red)' },
              ].map(({ val, label, color }) => (
                <div key={label} style={cs.rItem}>
                  <span style={{ ...cs.rVal, color }}>{val}</span>
                  <span style={cs.rLabel}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ width: '100%' }}>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Session Heatmap
              </p>
              <div style={cs.kbWrap}>
                <KeyboardDisplay heatmap={computeHeatmap()} compact />
              </div>
              <div style={cs.heatLegend}>
                {[['🔴', 'High errors'], ['🟡', 'Slow reaction'], ['🟢', 'Mastered']].map(([e, l]) => (
                  <span key={l} style={cs.heatLegendItem}>{e} {l}</span>
                ))}
              </div>
            </div>
            <button style={cs.primaryBtn} onClick={startGame}><RefreshCcw size={15} /> Drill Again</button>
          </div>
        );
      })()}
    </div>
  );
};

const Module4HomeRowFlow = () => {
  const [pressedKey, setPressedKey] = useState(null);
  const [highlightKey, setHighlightKey] = useState(null);
  const [lastFinger, setLastFinger] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (!FINGER_MAP[key]) return;
      setPressedKey(key);
      setHighlightKey(key);
      setLastFinger(FINGER_MAP[key]);
      setTotal(t => t + 1);
      if (HOME_ROW_KEYS.has(key)) setCorrect(c => c + 1);
      setTimeout(() => { setPressedKey(null); setHighlightKey(null); }, 600);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fc = lastFinger ? FINGER_COLORS[lastFinger] : null;
  const efficiency = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div style={cs.moduleWrap}>
      <div style={cs.moduleHeader}>
        <h2 style={cs.moduleTitle}>🏠 Home Row Flow</h2>
        <p style={cs.moduleSub}>Every key has a designated finger. Press any key — your correct finger illuminates. Build home-row anchor memory.</p>
      </div>

      <div style={cs.zoneGrid}>
        {[['Lp', 'Lr', 'Lm', 'Li'], ['Th'], ['Ri', 'Rm', 'Rr', 'Rp']].map((group, gi) => (
          <div key={gi} style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {group.map(fg => {
              const fgc = FINGER_COLORS[fg];
              const isActive = lastFinger === fg;
              return (
                <div key={fg} style={{
                  ...cs.zoneChip,
                  background: isActive ? `rgba(${fgc.rgb},0.3)` : `rgba(${fgc.rgb},0.07)`,
                  border: `1px solid rgba(${fgc.rgb},${isActive ? 0.7 : 0.18})`,
                  boxShadow: isActive ? `0 0 16px ${fgc.hex}66` : 'none',
                  color: fgc.hex,
                }}>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{fg}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{fgc.name}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {fc && (
        <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '0.75rem', background: `rgba(${fc.rgb},0.1)`, borderRadius: 'var(--radius-md)', border: `1px solid rgba(${fc.rgb},0.3)` }}>
          <span style={{ color: fc.hex, fontWeight: 700, fontSize: '1.1rem' }}>
            {fc.name} → {pressedKey?.toUpperCase()}
          </span>
        </div>
      )}

      <div style={cs.kbWrap}>
        <KeyboardDisplay fingerZones homeRowGlow highlightKey={highlightKey} pressedKey={pressedKey} showFingerLabels />
      </div>

      {total > 0 && (
        <div style={cs.depMeter}>
          <span style={cs.depLabel}>Home Row Returns: {correct}/{total}</span>
          <div style={cs.depBar}>
            <div style={{ ...cs.depFill, width: `${efficiency}%`, background: 'var(--accent-teal)' }} />
          </div>
          <span style={{ ...cs.depPct, color: 'var(--accent-teal)' }}>{efficiency}%</span>
        </div>
      )}

      <div style={cs.tip}>
        💡 <strong>Pro tip:</strong> After every non-home-row key, your finger should snap back to its anchor position (A S D F · J K L ;). This is what separates fast typists from great ones.
      </div>
    </div>
  );
};

const AUDIO_SPEEDS = [
  { id: 'slow', label: 'Slow', gap: 2200 },
  { id: 'normal', label: 'Normal', gap: 1400 },
  { id: 'fast', label: 'Fast', gap: 800 },
  { id: 'rapid', label: 'Rapid', gap: 500 },
];

const Module5AudioGuided = ({ onSessionComplete }) => {
  const [speed, setSpeed] = useState('normal');
  const [pool, setPool] = useState('Home Row');
  const [phase, setPhase] = useState('idle');
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [currentKey, setCurrentKey] = useState('');
  const [feedback, setFeedback] = useState(null);
  const keyRef = useRef('');
  const sessionStats = useRef({});
  const timerRef = useRef(null);
  const timeLeft = useRef(30);
  const [displayTime, setDisplayTime] = useState(30);

  const nextLetter = useCallback(() => {
    const letters = LETTER_POOLS[pool];
    const l = letters[Math.floor(Math.random() * letters.length)];
    keyRef.current = l;
    setCurrentKey(l);
    speak(l.toUpperCase());
  }, [pool]);

  const startSession = () => {
    sessionStats.current = {};
    timeLeft.current = 30;
    setDisplayTime(30);
    setScore(0);
    setErrors(0);
    setPhase('playing');
    nextLetter();

    timerRef.current = setInterval(() => {
      timeLeft.current--;
      setDisplayTime(t => t - 1);
      if (timeLeft.current <= 0) {
        clearInterval(timerRef.current);
        window.speechSynthesis.cancel();
        setPhase('result');
        const s = sessionStats.current;
        const tot = Object.values(s).reduce((a, v) => a + v.attempts, 0);
        const err = Object.values(s).reduce((a, v) => a + v.errors, 0);
        onSessionComplete?.({ keyStats: s, fingerMemoryScore: tot > 0 ? 1 - err / tot : 0 });
      }
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (key.length !== 1) return;
      const expected = keyRef.current;
      if (!sessionStats.current[expected]) sessionStats.current[expected] = { attempts: 0, errors: 0, times: [] };
      sessionStats.current[expected].attempts++;

      if (key === expected) {
        setScore(s => s + 1);
        setFeedback('correct');
        setTimeout(() => { setFeedback(null); nextLetter(); }, 120);
      } else {
        sessionStats.current[expected].errors++;
        setErrors(e => e + 1);
        setFeedback('wrong');
        setTimeout(() => { setFeedback(null); speak(expected.toUpperCase()); }, 300);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, nextLetter]);

  return (
    <div style={cs.moduleWrap}>
      <div style={cs.moduleHeader}>
        <h2 style={cs.moduleTitle}>🎧 Audio Guided Mode</h2>
        <p style={cs.moduleSub}>The AI coach speaks a letter. You type it without looking. Pure spatial memory training.</p>
      </div>

      {phase === 'idle' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {AUDIO_SPEEDS.map(s => (
              <button key={s.id} onClick={() => setSpeed(s.id)} style={{
                ...cs.poolBtn, minWidth: '90px',
                outline: speed === s.id ? '2px solid var(--accent-purple)' : 'none',
                background: speed === s.id ? 'rgba(127,119,221,0.15)' : 'rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontWeight: 700 }}>{s.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.gap}ms</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.keys(LETTER_POOLS).map(p => (
              <button key={p} onClick={() => setPool(p)} style={{
                ...cs.poolBtn,
                outline: pool === p ? '2px solid var(--accent-teal)' : 'none',
                background: pool === p ? 'rgba(29,158,117,0.12)' : 'rgba(255,255,255,0.03)',
              }}>{p}</button>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto' }}>
            ⚠️ Ensure your system volume is on. The AI coach will speak each letter clearly.
          </p>
          <button style={{ ...cs.primaryBtn, background: 'var(--accent-purple)', boxShadow: 'var(--glow-purple)' }} onClick={startSession}>
            <Volume2 size={16} /> Start Audio Session
          </button>
        </>
      )}

      {phase === 'playing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-teal)' }}>{score}</span><span style={cs.rLabel}>Correct</span></div>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-amber)' }}>{displayTime}s</span><span style={cs.rLabel}>Remaining</span></div>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-red)' }}>{errors}</span><span style={cs.rLabel}>Errors</span></div>
          </div>

          <div style={cs.waveform}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                ...cs.waveBar,
                animationDelay: `${i * 0.08}s`,
                background: feedback === 'correct' ? 'var(--accent-teal)'
                  : feedback === 'wrong' ? 'var(--accent-red)'
                    : 'var(--accent-purple)',
              }} />
            ))}
          </div>

          <div style={{
            fontSize: feedback ? '6rem' : '5rem',
            fontWeight: 900, fontFamily: 'var(--font-mono)',
            color: feedback === 'correct' ? 'var(--accent-teal)' : feedback === 'wrong' ? 'var(--accent-red)' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.15s',
            letterSpacing: '0.05em',
          }}>?</div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Listen carefully and type the spoken letter</p>
        </div>
      )}

      {phase === 'result' && (
        <div style={cs.resultCard}>
          <h3 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent-amber)' }}>Session Complete</h3>
          <div style={cs.resultGrid}>
            {[
              { val: score, label: 'Correct', color: 'var(--accent-teal)' },
              { val: errors, label: 'Errors', color: 'var(--accent-red)' },
              { val: score + errors > 0 ? `${Math.round(score / (score + errors) * 100)}%` : '—', label: 'Accuracy', color: 'var(--accent-purple)' },
            ].map(({ val, label, color }) => (
              <div key={label} style={cs.rItem}>
                <span style={{ ...cs.rVal, color }}>{val}</span>
                <span style={cs.rLabel}>{label}</span>
              </div>
            ))}
          </div>
          <button style={cs.primaryBtn} onClick={() => setPhase('idle')}><RefreshCcw size={15} /> New Session</button>
        </div>
      )}
    </div>
  );
};

const WORD_BANK_BLIND = ['and', 'the', 'for', 'you', 'hit', 'key', 'run', 'pop', 'fast', 'type', 'flow', 'zone', 'mind', 'bold', 'snap', 'rush', 'fire', 'cool', 'real', 'true'];
const CHALLENGE_DEFS = [
  { id: 'sprint', label: '30-Second Sprint', icon: '⚡', desc: 'Type letters rapidly, keyboard hidden. Pure reflex.' },
  { id: 'noLook', label: 'No-Look Word Run', icon: '🔤', desc: 'Type full words without visual keyboard aid.' },
  { id: 'memory', label: 'Memory Sequence', icon: '🧠', desc: 'Memorise a letter sequence, then type it from memory.' },
];

const Module6BlindChallenges = ({ blindScore, rank }) => {
  const [challenge, setChallenge] = useState(null);
  const [phase, setPhase] = useState('select');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [letter, setLetter] = useState('');
  const [word, setWord] = useState('');
  const [sequence, setSequence] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [flashOk, setFlashOk] = useState(false);
  const keyRef = useRef('');
  const timerRef = useRef(null);

  const startChallenge = (cid) => {
    setChallenge(cid);
    setScore(0); setTimeLeft(30); setInputVal('');
    setPhase('playing');

    if (cid === 'sprint') {
      const l = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
      keyRef.current = l; setLetter(l);
      timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0; } return t - 1; }), 1000);
    }
    if (cid === 'noLook') {
      setWord(WORD_BANK_BLIND[Math.floor(Math.random() * WORD_BANK_BLIND.length)]);
      timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0; } return t - 1; }), 1000);
    }
    if (cid === 'memory') {
      const seq = Array.from({ length: 5 }, () => 'asdfjkl;'[Math.floor(Math.random() * 8)]).join('');
      setSequence(seq); setPhase('memorise');
      setTimeout(() => setPhase('playing'), 3000);
    }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (phase !== 'playing' || !challenge) return;
    if (challenge === 'sprint') {
      const onKey = (e) => {
        const key = e.key.toLowerCase();
        if (key.length !== 1) return;
        if (key === keyRef.current) {
          setScore(s => s + 1); setFlashOk(true); setTimeout(() => setFlashOk(false), 120);
          const l = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
          keyRef.current = l; setLetter(l);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [phase, challenge]);

  const handleWordInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    if (v === word) {
      setScore(s => s + 1);
      setInputVal('');
      setWord(WORD_BANK_BLIND[Math.floor(Math.random() * WORD_BANK_BLIND.length)]);
    }
  };

  const handleSequenceInput = (e) => {
    setInputVal(e.target.value);
    if (e.target.value === sequence) {
      setScore(1); setPhase('result');
    }
  };

  return (
    <div style={cs.moduleWrap}>
      <div style={cs.moduleHeader}>
        <h2 style={cs.moduleTitle}>👻 Blind Typing Challenges</h2>
        <p style={cs.moduleSub}>Gamified blind typing — prove your keyboard independence under pressure.</p>
      </div>

      {rank && (
        <div style={{ ...cs.rankCard, border: `1px solid rgba(255,255,255,0.1)` }}>
          <span style={{ fontSize: '2.2rem' }}>{rank.icon}</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: '1.15rem', color: rank.color, margin: 0 }}>{rank.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Blind Score: {Math.round(blindScore)}/100</p>
          </div>
          <div style={cs.scoreBar}>
            <div style={{ ...cs.scoreFill, width: `${blindScore}%`, background: rank.color }} />
          </div>
        </div>
      )}

      {phase === 'select' && (
        <div style={cs.challengeGrid}>
          {CHALLENGE_DEFS.map(cd => (
            <button key={cd.id} onClick={() => startChallenge(cd.id)} style={cs.challengeCard}>
              <span style={{ fontSize: '2rem' }}>{cd.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cd.label}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{cd.desc}</span>
              <span style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 600 }}>Start →</span>
            </button>
          ))}
        </div>
      )}

      {phase === 'memorise' && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Memorise this sequence in 3 seconds…</p>
          <div style={{
            fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em',
            color: 'var(--accent-teal)', textShadow: '0 0 30px var(--accent-teal)'
          }}>
            {sequence.toUpperCase()}
          </div>
        </div>
      )}

      {phase === 'playing' && challenge === 'sprint' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-teal)' }}>{score}</span><span style={cs.rLabel}>Hits</span></div>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-amber)' }}>{timeLeft}s</span><span style={cs.rLabel}>Left</span></div>
          </div>
          <div style={{
            ...cs.letterDisplay,
            color: flashOk ? 'var(--accent-teal)' : 'var(--text-primary)',
            textShadow: flashOk ? '0 0 50px var(--accent-teal)' : '0 0 30px rgba(127,119,221,0.4)',
          }}>{letter.toUpperCase()}</div>
          <div style={cs.kbWrap}><KeyboardDisplay opacity={0} compact /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Keyboard hidden — type from memory</p>
        </div>
      )}

      {phase === 'playing' && challenge === 'noLook' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-teal)' }}>{score}</span><span style={cs.rLabel}>Words</span></div>
            <div style={cs.rItem}><span style={{ ...cs.rVal, color: 'var(--accent-amber)' }}>{timeLeft}s</span><span style={cs.rLabel}>Left</span></div>
          </div>
          <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            {word.toUpperCase()}
          </div>
          <input autoFocus value={inputVal} onChange={handleWordInput} placeholder="type here…" style={cs.blindInput} />
          <div style={cs.kbWrap}><KeyboardDisplay opacity={0} compact /></div>
        </div>
      )}

      {phase === 'playing' && challenge === 'memory' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Type the sequence from memory:</p>
          <input autoFocus value={inputVal} onChange={handleSequenceInput} placeholder="type here…"
            style={{ ...cs.blindInput, letterSpacing: '0.2em', fontSize: '1.4rem', textTransform: 'uppercase' }} />
          <div style={cs.kbWrap}><KeyboardDisplay opacity={0} compact /></div>
        </div>
      )}

      {phase === 'result' && (
        <div style={cs.resultCard}>
          <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--accent-amber)' }}>
            {challenge === 'memory' && score === 1 ? '🏆 Perfect Memory!' : `Challenge Complete`}
          </h3>
          <div style={cs.resultGrid}>
            <div style={cs.rItem}>
              <span style={{ ...cs.rVal, color: 'var(--accent-teal)' }}>{score}</span>
              <span style={cs.rLabel}>{challenge === 'memory' ? 'Sequences' : challenge === 'sprint' ? 'Keys' : 'Words'}</span>
            </div>
          </div>
          <button style={cs.primaryBtn} onClick={() => setPhase('select')}><RefreshCcw size={15} /> New Challenge</button>
        </div>
      )}
    </div>
  );
};

/* ── 4. HEATMAP & COACH WORKSPACE ── */
const HeatmapAndCoach = ({ keyStats, buildHeatmap, heatmapTab, setHeatmapTab, insights }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {insights.length > 0 && <AiCoachCard insights={insights} />}

      {Object.keys(keyStats).length > 0 ? (
        <div className="glass-panel" style={cs.heatmapSection}>
          <div style={cs.heatmapHeader}>
            <h2 style={cs.panelTitle}>🔥 Unified Performance Heatmap</h2>
            <div style={cs.heatTabs}>
              {[['error', 'Error Map'], ['slow', 'Speed Map'], ['confidence', 'Confidence']].map(([tab, label]) => (
                <button key={tab} onClick={() => setHeatmapTab(tab)} style={{
                  ...cs.heatTab,
                  background: heatmapTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: heatmapTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={cs.kbWrap}>
            <KeyboardDisplay heatmap={buildHeatmap(heatmapTab)} />
          </div>

          <div style={cs.heatLegend}>
            {heatmapTab === 'error' && [['🔴', 'High error rate (>40%)'], ['🟡', 'Moderate errors'], ['🟢', 'Mastered']].map(([e, l]) => (
              <span key={l} style={cs.heatLegendItem}>{e} {l}</span>
            ))}
            {heatmapTab === 'slow' && [['🟡', 'Slow reaction (>700ms)'], ['🟢', 'Fast response']].map(([e, l]) => (
              <span key={l} style={cs.heatLegendItem}>{e} {l}</span>
            ))}
            {heatmapTab === 'confidence' && [['🟢', 'High confidence'], ['⬜', 'Needs more data']].map(([e, l]) => (
              <span key={l} style={cs.heatLegendItem}>{e} {l}</span>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Telemetry aggregated across all practice and writing sessions. Hover keys to view fine-grained stats.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
          <h4 style={{ margin: 0, fontWeight: 700 }}>No Telemetry Accumulated Yet</h4>
          <p style={{ fontSize: '0.85rem', margin: '0.4rem 0 0' }}>Complete your first touch-typing stage or paragraph drill to initialize the ML heatmap.</p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const BlindTypingAcademy = () => {
  const { academyProgress, setAcademyProgress, achievements, unlockAchievement } = useAppContext();
  const [activeTab, setActiveTab] = useState('mastery'); // mastery | writing | practice | stats
  const [keyStats, setKeyStats] = useState(academyProgress?.keyStats || {});
  const [kbDep, setKbDep] = useState(academyProgress?.keyboardDependency ?? null);
  const [insights, setInsights] = useState([]);
  const [heatmapTab, setHeatmapTab] = useState('error');
  const [toast, setToast] = useState(null);

  // Trigger custom achievements checking on achievements list update
  const triggerAchievementToast = useCallback((name, icon) => {
    setToast({ name, icon });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Sync achievements and trigger custom toasts
  const achievementsLength = achievements?.length || 0;
  const prevAchievementsLength = useRef(achievementsLength);

  useEffect(() => {
    if (achievementsLength > prevAchievementsLength.current) {
      const latest = achievements[achievements.length - 1];
      if (latest) triggerAchievementToast(latest.name, latest.icon);
    }
    prevAchievementsLength.current = achievementsLength;
  }, [achievementsLength, achievements, triggerAchievementToast]);

  // Compute profile and coach insights
  useEffect(() => {
    const bs = computeBlindScore({ keyStats, keyboardDependency: kbDep ?? 100 });
    const ci = generateCoachFeedback(keyStats, kbDep ?? 100);
    setInsights(ci);
    setAcademyProgress(prev => ({
      ...prev,
      keyStats,
      keyboardDependency: kbDep,
      blindScore: bs,
      rank: getRank(bs).name,
    }));
  }, [keyStats, kbDep, setAcademyProgress]);

  // Session complete callbacks
  const onM2Complete = useCallback(({ keyboardDependency }) => {
    setKbDep(keyboardDependency);
    unlockAchievement('first_test', 'First Drill', 'Completed your first typing session', '🔥');
    if (keyboardDependency <= 12) {
      unlockAchievement('ghost_fingers', 'Ghost Fingers', 'Completed an Eyes-Off test in Ghost or Blind mode', '👻');
    }
  }, [unlockAchievement]);

  const onM3Complete = useCallback(({ keyStats: ks, fingerMemoryScore, weakKeys }) => {
    setKeyStats(prev => mergeKeyStats(prev, ks));
    unlockAchievement('first_test', 'First Drill', 'Completed your first typing session', '🔥');
  }, [unlockAchievement]);

  const onM5Complete = useCallback(({ keyStats: ks }) => {
    setKeyStats(prev => mergeKeyStats(prev, ks));
    unlockAchievement('first_test', 'First Drill', 'Completed your first typing session', '🔥');
  }, [unlockAchievement]);

  const handleStageUnlock = (stageId) => {
    unlockAchievement('first_test', 'First Drill', 'Completed your first typing session', '🔥');
    setAcademyProgress(prev => ({
      ...prev,
      masteryStage: Math.max(prev.masteryStage || 1, stageId + 1)
    }));
  };

  const bs = computeBlindScore({ keyStats, keyboardDependency: kbDep ?? 100 });
  const rank = getRank(bs);

  const buildHeatmap = (tab) => {
    const errors = {}; const slow = {}; const counts = {};
    Object.entries(keyStats).forEach(([k, s]) => {
      counts[k] = s.attempts;
      errors[k] = s.errors;
      const avgMs = s.times.length ? s.times.reduce((a, b) => a + b, 0) / s.times.length : 0;
      if (avgMs > 700) slow[k] = Math.max(1, Math.ceil(s.attempts * 0.5));
    });
    if (tab === 'error') return { errors, slow: {}, counts };
    if (tab === 'slow') return { errors: {}, slow, counts };
    
    const conf = {};
    Object.entries(keyStats).forEach(([k, s]) => {
      conf[k] = s.attempts > 0 ? Math.max(0, s.attempts - s.errors * 3) : 0;
    });
    return { errors: {}, slow: {}, counts: conf };
  };

  return (
    <div style={cs.page}>
      {/* Toast Alert */}
      {toast && (
        <div style={cs.toastAlert} className="animate-fadeIn">
          <Sparkles size={20} color="var(--accent-amber)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--accent-amber)' }}>ACHIEVEMENT UNLOCKED!</span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{toast.icon} {toast.name}</span>
          </div>
        </div>
      )}

      {/* Main Hero Header */}
      <div className="glass-panel" style={cs.heroHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🎓</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
              AI Typing <span className="text-gradient-purple">Intelligence</span> Academy
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '560px', lineHeight: 1.6 }}>
            Evolve your keyboard dexterity, spatial mapping, and writing rhythm with our progressive course, cinematic paragraph builder, and real-time cadence analyst.
          </p>
        </div>
        
        <div style={{ ...cs.rankCard, flexShrink: 0, minWidth: '200px', border: `1px solid rgba(255,255,255,0.08)` }}>
          <span style={{ fontSize: '2rem' }}>{rank.icon}</span>
          <div>
            <p style={{ fontWeight: 800, color: rank.color, margin: 0 }}>{rank.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Blind Score: {Math.round(bs)}/100</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div style={cs.tabGroupMain}>
        {[
          { id: 'mastery', label: 'Mastery Course', icon: Trophy },
          { id: 'writing', label: 'Writing Studio', icon: FileText },
          { id: 'practice', label: 'Practice Labs', icon: Headphones },
          { id: 'stats', label: 'Heatmap & Coach', icon: BrainCircuit }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...cs.mainTabBtn,
                background: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                borderColor: isActive ? 'var(--accent-purple)' : 'var(--glass-border)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-purple)' : 'var(--text-muted)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Router */}
      <div style={{ minHeight: '400px' }} className="animate-fadeIn">
        {activeTab === 'mastery' && (
          <MasteryCourse
            currentStage={academyProgress?.masteryStage || 1}
            onStageUnlock={handleStageUnlock}
            unlockAchievement={unlockAchievement}
          />
        )}
        {activeTab === 'writing' && (
          <WritingStudio
            unlockAchievement={unlockAchievement}
          />
        )}
        {activeTab === 'practice' && (
          <PracticeLabs
            onM2Complete={onM2Complete}
            onM3Complete={onM3Complete}
            onM5Complete={onM5Complete}
            blindScore={bs}
            rank={rank}
          />
        )}
        {activeTab === 'stats' && (
          <HeatmapAndCoach
            keyStats={keyStats}
            buildHeatmap={buildHeatmap}
            heatmapTab={heatmapTab}
            setHeatmapTab={setHeatmapTab}
            insights={insights}
          />
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════════════════════ */
const cs = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  heroHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem 2.5rem', flexWrap: 'wrap', gap: '1.5rem' },
  moduleNav: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem' },
  moduleNavBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
    padding: '1rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid',
    background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
  },
  modulePanel: { padding: '2rem', minHeight: '400px' },
  moduleWrap: { display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%' },
  moduleHeader: { textAlign: 'center', maxWidth: '560px', margin: '0 auto' },
  moduleTitle: { fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 0.5rem' },
  moduleSub: { color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 },
  kbWrap: { overflowX: 'auto', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-lg)', maxWidth: '100%' },
  fingerLegend: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  fingerChip: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', transition: 'all 0.2s' },
  homeRowGuide: { padding: '1.25rem 2rem', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '640px' },
  handBox: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  keyGuideRow: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  keyTag: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.3rem', padding: '0.15rem 0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' },
  levelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem', width: '100%', maxWidth: '580px' },
  levelBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' },
  textBox: { padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', lineHeight: 2, letterSpacing: '0.05em', maxWidth: '640px', width: '100%', wordBreak: 'break-all', display: 'flex', flexWrap: 'wrap', gap: '2px 0px' },
  depMeter: { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '580px' },
  depLabel: { fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0, fontWeight: 600 },
  depBar: { flex: 1, height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' },
  depFill: { height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' },
  depPct: { fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0, width: '3rem', textAlign: 'right' },
  letterDisplay: { fontSize: '7rem', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, transition: 'all 0.12s', letterSpacing: '-0.02em' },
  poolGrid: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' },
  poolBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.55rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem' },
  zoneGrid: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  zoneChip: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' },
  waveform: { display: 'flex', gap: '4px', alignItems: 'center', height: '50px' },
  waveBar: { width: '4px', borderRadius: '2px', animation: 'pulse 0.8s ease infinite alternate', height: '100%' },
  blindInput: { padding: '0.85rem 1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', fontSize: '1.3rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'center', width: '100%', maxWidth: '380px', outline: 'none' },
  challengeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', width: '100%', maxWidth: '700px' },
  challengeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', padding: '1.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  rankCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.04)' },
  scoreBar: { width: '100px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden', marginLeft: 'auto' },
  scoreFill: { height: '100%', borderRadius: '3px', transition: 'width 0.8s ease' },
  resultCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: '500px', margin: '0 auto' },
  resultGrid: { display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  rItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  rVal: { fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1 },
  rLabel: { fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 2.25rem', background: 'var(--accent-purple)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '1rem', boxShadow: 'var(--glow-purple)', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' },
  heatmapSection: { padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  heatmapHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  heatTabs: { display: 'flex', gap: '0.25rem', background: 'var(--glass-bg)', padding: '0.25rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' },
  heatTab: { padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' },
  heatLegend: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  heatLegendItem: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  coachCard: { padding: '1.5rem', border: '1px solid rgba(127,119,221,0.25)', background: 'rgba(127,119,221,0.06)', borderRadius: 'var(--radius-lg)' },
  coachHeader: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' },
  coachTitle: { fontWeight: 700, color: 'var(--accent-purple)', fontSize: '0.95rem' },
  coachInsights: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  coachInsight: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
  coachBullet: { color: 'var(--accent-purple)', fontWeight: 900, flexShrink: 0, marginTop: '1px' },
  tip: { padding: '0.85rem 1.25rem', background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px', textAlign: 'center' },
  panelTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' },

  /* Navigation Layout Styles */
  tabGroupMain: { display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', flexWrap: 'wrap' },
  mainTabBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', border: '1px solid transparent', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },

  /* Mastery stage grid */
  stageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%' },
  stageCard: { display: 'flex', flexDirection: 'column', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', textAlign: 'left', transition: 'all 0.25s ease' },

  /* Writing Studio Tab Styles */
  writingStudioHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', width: '100%', marginBottom: '1rem' },
  tabGroupSub: { display: 'flex', gap: '1rem' },
  subTabBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', background: 'none', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', padding: '0.35rem 0' },
  catBtn: { padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, transition: 'all 0.2s' },
  diffSelectBtn: { padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s', textAlign: 'center' },

  /* Cockpit cinematic view */
  cockpitContainer: { position: 'relative', width: '100%', maxWidth: '640px', minHeight: '380px', background: 'rgba(5,5,10,0.45)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' },
  hudOverlay: { display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', zIndex: 2 },
  cockpitTextarea: { width: '100%', minHeight: '160px', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexWrap: 'wrap', gap: '0px 2px', alignContent: 'flex-start', zIndex: 2 },
  particleOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 },
  particle: { position: 'absolute', bottom: '-20px', width: '6px', height: '6px', background: 'var(--accent-purple)', borderRadius: '50%', opacity: 0.15, filter: 'blur(1px)', animation: 'floatParticle 6s infinite linear' },

  /* Sandbox styles */
  sandboxTextArea: { width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'var(--font-mono)', lineHeight: 1.7, outline: 'none', resize: 'none' },
  freeTimerBadge: { position: 'absolute', top: '10px', right: '15px', background: 'rgba(226,75,74,0.18)', border: '1px solid rgba(226,75,74,0.3)', color: '#E24B4A', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 },
  promptCard: { display: 'flex', flexDirection: 'column', padding: '0.85rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' },
  timerBtn: { padding: '0.45rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s' },

  /* Toast Notification */
  toastAlert: { position: 'fixed', bottom: '2rem', right: '2rem', background: 'rgba(10,10,15,0.92)', border: '1px solid var(--accent-amber)', boxShadow: '0 0 25px rgba(239,159,39,0.35)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem', zIndex: 9999 },

  /* Extra grids */
  metricsGridLarge: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', width: '100%' },
  insightsFeedbackBox: { width: '100%', padding: '1rem 1.25rem', border: '1px solid rgba(127,119,221,0.25)', background: 'rgba(127,119,221,0.04)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }
};

export default BlindTypingAcademy;

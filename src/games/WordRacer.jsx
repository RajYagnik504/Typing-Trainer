import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSound } from '../context/SoundContext';
import { useAppContext } from '../context/AppContext';
import { RefreshCcw, Play, Zap, Target, Clock } from 'lucide-react';

/* ── Word Pool (tiered by difficulty) ─────────────────────────────────────── */
const WORD_POOLS = {
  easy: [
    'the','and','for','are','but','not','you','all','can','her',
    'was','one','our','out','day','get','has','him','his','how',
    'man','new','now','old','see','two','way','who','boy','did',
    'its','let','put','say','she','too','use','dad','mom','cat',
    'dog','sun','run','fun','big','red','bed','hot','cold','fast',
  ],
  medium: [
    'about','after','again','below','could','every','first','found',
    'great','house','large','learn','never','other','place','plant',
    'point','right','small','sound','spell','still','study','their',
    'there','these','thing','think','three','water','where','which',
    'world','write','would','young','light','night','might','fight',
    'bring','clean','dream','green','order','raise','reach','round',
  ],
  hard: [
    'beautiful','beginning','between','challenge','complete','continue',
    'different','discover','distance','dynamic','element','essential',
    'example','exercise','expected','explain','function','generate',
    'important','keyboard','language','learning','magnetic','maximum',
    'movement','multiple','negative','northern','optimize','original',
    'physical','possible','practice','presence','principle','problem',
    'reaction','remember','resource','response','sequence','solution',
    'specific','strategy','strength','suitable','support','surprise',
    'together','transfer','ultimate','validate','velocity','vertical',
  ],
};

const TIME_LIMIT = 60; // seconds

/* ── Build randomised word queue ──────────────────────────────────────────── */
const buildQueue = (difficulty) => {
  const pool = difficulty === 'Beginner'
    ? WORD_POOLS.easy
    : difficulty === 'Advanced' || difficulty === 'Expert' || difficulty === 'Master' || difficulty === 'Grandmaster'
      ? [...WORD_POOLS.medium, ...WORD_POOLS.hard]
      : [...WORD_POOLS.easy, ...WORD_POOLS.medium];

  // Fisher-Yates shuffle, take 120
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Repeat to ensure we have 120 words
  while (arr.length < 120) arr.push(...arr.slice(0, 120 - arr.length));
  return arr.slice(0, 120);
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const WordRacer = ({ onComplete }) => {
  const { playKeyClick, playErrorBuzz, playSuccessChime, playBubblePop } = useSound();
  const { settings } = useAppContext();

  const [gameState, setGameState] = useState('idle'); // idle | playing | finished
  const [words, setWords]         = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput]         = useState('');
  const [timeLeft, setTimeLeft]   = useState(TIME_LIMIT);
  const [wordStatuses, setWordStatuses] = useState([]); // 'correct'|'wrong'|''
  const [combo, setCombo]         = useState(0);
  const [score, setScore]         = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [wrongWords, setWrongWords]   = useState(0);
  const [totalChars, setTotalChars]   = useState(0);
  const [inputShake, setInputShake]   = useState(false);

  const timerRef    = useRef(null);
  const inputRef    = useRef(null);
  const wordListRef = useRef(null);
  const startTime   = useRef(null);

  /* ── Start ───────────────────────────────────────────────────────────────── */
  const startGame = useCallback(() => {
    const queue = buildQueue(settings.difficultyMode || 'Intermediate');
    setWords(queue);
    setWordStatuses(Array(queue.length).fill(''));
    setCurrentIdx(0);
    setInput('');
    setTimeLeft(TIME_LIMIT);
    setCombo(0);
    setScore(0);
    setCorrectWords(0);
    setWrongWords(0);
    setTotalChars(0);
    startTime.current = Date.now();
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [settings.difficultyMode]);

  /* ── Timer ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  /* ── Fire onComplete when finished ──────────────────────────────────────── */
  useEffect(() => {
    if (gameState !== 'finished') return;
    const elapsed = (Date.now() - (startTime.current || Date.now())) / 1000;
    const wpm = elapsed > 0 ? Math.round((correctWords / elapsed) * 60) : 0;
    playSuccessChime();
    if (onComplete) onComplete({ wpm, score, correctWords, wrongWords });
  }, [gameState]); // eslint-disable-line

  /* ── Auto-scroll active word into view ─────────────────────────────────── */
  useEffect(() => {
    if (!wordListRef.current) return;
    const active = wordListRef.current.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIdx]);

  /* ── Input handling ─────────────────────────────────────────────────────── */
  const handleInput = useCallback((e) => {
    if (gameState !== 'playing') return;
    const val = e.target.value;

    // Space or Enter → submit word
    if (val.endsWith(' ') || val.endsWith('\n')) {
      const typed = val.trim();
      const target = words[currentIdx];

      if (typed === target) {
        // ✅ Correct
        const newCombo = combo + 1;
        const multiplier = Math.min(4, 1 + Math.floor(newCombo / 5) * 0.5);
        const pts = Math.floor(target.length * 10 * multiplier);

        setCombo(newCombo);
        setScore(s => s + pts);
        setCorrectWords(c => c + 1);
        setTotalChars(t => t + typed.length);
        setWordStatuses(prev => {
          const next = [...prev];
          next[currentIdx] = 'correct';
          return next;
        });
        playBubblePop();
      } else if (typed.length > 0) {
        // ❌ Wrong
        setCombo(0);
        setWrongWords(w => w + 1);
        setWordStatuses(prev => {
          const next = [...prev];
          next[currentIdx] = 'wrong';
          return next;
        });
        setInputShake(true);
        setTimeout(() => setInputShake(false), 350);
        playErrorBuzz();
      } else {
        return; // blank space, ignore
      }

      setCurrentIdx(i => i + 1);
      setInput('');
    } else {
      setInput(val);
      if (val.length > 0) playKeyClick();
    }
  }, [gameState, words, currentIdx, combo, playBubblePop, playErrorBuzz, playKeyClick]);

  /* ── Derived metrics ────────────────────────────────────────────────────── */
  const elapsed  = TIME_LIMIT - timeLeft;
  const liveWpm  = elapsed > 0 ? Math.round((correctWords / elapsed) * 60) : 0;
  const accuracy = (correctWords + wrongWords) > 0
    ? Math.round((correctWords / (correctWords + wrongWords)) * 100)
    : 100;
  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft > 20
    ? 'var(--accent-teal)'
    : timeLeft > 10
      ? 'var(--accent-amber)'
      : 'var(--accent-red)';

  /* ── Render word colour ─────────────────────────────────────────────────── */
  const wordColor = (idx) => {
    if (wordStatuses[idx] === 'correct') return 'var(--accent-teal)';
    if (wordStatuses[idx] === 'wrong')   return 'var(--accent-red)';
    if (idx === currentIdx)              return 'var(--text-primary)';
    return 'var(--text-muted)';
  };
  const wordBg = (idx) => {
    if (idx === currentIdx) return 'rgba(127,119,221,0.15)';
    if (wordStatuses[idx] === 'correct') return 'rgba(29,158,117,0.08)';
    if (wordStatuses[idx] === 'wrong')   return 'rgba(226,75,74,0.08)';
    return 'transparent';
  };

  /* ── Partial match highlight in current word ─────────────────────────────── */
  const renderCurrentWord = () => {
    const target = words[currentIdx] || '';
    return target.split('').map((ch, i) => {
      let color = 'var(--text-muted)';
      if (i < input.length) {
        color = input[i] === ch ? 'var(--accent-teal)' : 'var(--accent-red)';
      } else if (i === input.length) {
        color = 'var(--text-primary)';
      }
      return <span key={i} style={{ color, transition: 'color 0.1s' }}>{ch}</span>;
    });
  };

  /* ── JSX ─────────────────────────────────────────────────────────────────── */
  return (
    <div style={sty.container}>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div style={sty.statsBar}>
        <div style={sty.stat}>
          <Zap size={16} color="var(--accent-amber)" />
          <span style={sty.statVal}>{liveWpm}</span>
          <span style={sty.statUnit}>WPM</span>
        </div>
        <div style={sty.stat}>
          <Target size={16} color="var(--accent-purple)" />
          <span style={sty.statVal}>{accuracy}</span>
          <span style={sty.statUnit}>%</span>
        </div>
        <div style={{ ...sty.stat, color: timerColor }}>
          <Clock size={16} color={timerColor} />
          <span style={{ ...sty.statVal, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
            {timeLeft}
          </span>
          <span style={sty.statUnit}>sec</span>
        </div>
        <div style={sty.stat}>
          <span style={{ fontSize: '1rem' }}>🔥</span>
          <span style={{ ...sty.statVal, color: combo > 0 ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
            x{combo}
          </span>
          <span style={sty.statUnit}>combo</span>
        </div>
      </div>

      {/* ── Timer Bar ─────────────────────────────────────────────────────── */}
      {gameState === 'playing' && (
        <div style={sty.timerTrack}>
          <div style={{
            ...sty.timerFill,
            width: `${timerPct}%`,
            background: timerColor,
            boxShadow: `0 0 12px ${timerColor}55`,
            transition: 'width 1s linear, background 0.5s',
          }} />
        </div>
      )}

      {/* ── Game Board ────────────────────────────────────────────────────── */}
      <div className="glass-panel" style={sty.board}>

        {/* IDLE */}
        {gameState === 'idle' && (
          <div style={sty.overlay}>
            <div style={sty.overlayIcon}>⌨️</div>
            <h2 style={sty.overlayTitle}>Word Racer</h2>
            <p style={sty.overlaySubtitle}>
              Type as many words as possible in <strong>60 seconds</strong>.<br />
              Press <kbd style={sty.kbd}>Space</kbd> after each word to advance.
            </p>
            <button style={sty.startBtn} onClick={startGame}>
              <Play size={18} /> Start Race
            </button>
          </div>
        )}

        {/* FINISHED */}
        {gameState === 'finished' && (
          <div style={sty.overlay}>
            <div style={sty.overlayIcon}>🏁</div>
            <h2 style={{ ...sty.overlayTitle, color: 'var(--accent-amber)' }}>Race Finished!</h2>
            <div style={sty.resultGrid}>
              <div style={sty.resultItem}>
                <span style={sty.resultVal}>{liveWpm || Math.round((correctWords / TIME_LIMIT) * 60)}</span>
                <span style={sty.resultLabel}>WPM</span>
              </div>
              <div style={sty.resultItem}>
                <span style={{ ...sty.resultVal, color: 'var(--accent-teal)' }}>{accuracy}%</span>
                <span style={sty.resultLabel}>Accuracy</span>
              </div>
              <div style={sty.resultItem}>
                <span style={{ ...sty.resultVal, color: 'var(--accent-purple)' }}>{score}</span>
                <span style={sty.resultLabel}>Score</span>
              </div>
              <div style={sty.resultItem}>
                <span style={{ ...sty.resultVal, color: 'var(--accent-amber)' }}>{correctWords}</span>
                <span style={sty.resultLabel}>Words</span>
              </div>
            </div>
            <button style={sty.startBtn} onClick={startGame}>
              <RefreshCcw size={18} /> Race Again
            </button>
          </div>
        )}

        {/* PLAYING */}
        {gameState === 'playing' && (
          <div style={sty.playArea}>
            {/* Current word highlighted rendering */}
            <div style={sty.currentWordDisplay}>
              <span style={sty.currentWordText}>{renderCurrentWord()}</span>
              <span style={sty.cursorBlink}>|</span>
            </div>

            {/* Scrollable word stream */}
            <div ref={wordListRef} style={sty.wordStream}>
              {words.slice(Math.max(0, currentIdx - 4), currentIdx + 30).map((word, relIdx) => {
                const absIdx = Math.max(0, currentIdx - 4) + relIdx;
                const isActive = absIdx === currentIdx;
                return (
                  <span
                    key={absIdx}
                    data-active={isActive}
                    style={{
                      ...sty.wordChip,
                      color: wordColor(absIdx),
                      background: wordBg(absIdx),
                      outline: isActive ? '1px solid rgba(127,119,221,0.5)' : 'none',
                      transform: isActive ? 'scale(1.08)' : 'scale(1)',
                      fontWeight: isActive ? 700 : 400,
                      textDecoration: wordStatuses[absIdx] === 'wrong' ? 'line-through' : 'none',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              style={{
                ...sty.inputField,
                ...(inputShake ? sty.inputShake : {}),
                borderColor: input.length > 0
                  ? (words[currentIdx]?.startsWith(input) ? 'var(--accent-teal)' : 'var(--accent-red)')
                  : 'var(--glass-border-highlight)',
              }}
              value={input}
              onChange={handleInput}
              onKeyDown={e => { if (e.key === 'Tab') e.preventDefault(); }}
              placeholder="Type here…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />

            <p style={sty.hint}>
              <kbd style={sty.kbd}>Space</kbd> to submit · {correctWords} correct · {wrongWords} wrong
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────────── */
const sty = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
  statsBar: {
    display: 'flex',
    gap: '2rem',
    padding: '0 0.5rem',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.35rem',
    color: 'var(--text-secondary)',
  },
  statVal: {
    fontSize: '1.4rem',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  statUnit: {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
  },
  timerTrack: {
    height: '4px',
    background: 'var(--bg-tertiary)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: '2px',
  },
  board: {
    minHeight: '420px',
    position: 'relative',
    overflow: 'hidden',
  },

  /* Overlay (idle / finished) */
  overlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.25rem',
    padding: '3rem 2rem',
    minHeight: '420px',
    textAlign: 'center',
  },
  overlayIcon: { fontSize: '3rem', lineHeight: 1 },
  overlayTitle: { fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em' },
  overlaySubtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    maxWidth: '420px',
  },
  startBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.75rem 2.25rem',
    background: 'var(--accent-purple)',
    color: '#fff',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: '1rem',
    boxShadow: 'var(--glow-purple)',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.2s',
    marginTop: '0.5rem',
  },

  /* Result */
  resultGrid: {
    display: 'flex',
    gap: '2.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  resultVal: {
    fontSize: '2.5rem',
    fontWeight: 900,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  resultLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
  },

  /* Play area */
  playArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '2rem 2.5rem',
  },
  currentWordDisplay: {
    fontSize: '2.75rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    minHeight: '3.5rem',
  },
  currentWordText: { display: 'flex', gap: '0' },
  cursorBlink: {
    color: 'var(--accent-purple)',
    animation: 'pulse 1s steps(1) infinite',
    marginLeft: '2px',
    fontWeight: 300,
  },
  wordStream: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
    maxWidth: '680px',
    justifyContent: 'center',
    maxHeight: '120px',
    overflow: 'hidden',
    padding: '0.5rem',
  },
  wordChip: {
    display: 'inline-block',
    padding: '0.3rem 0.6rem',
    borderRadius: '0.4rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    transition: 'all 0.15s ease',
    lineHeight: 1.4,
  },
  inputField: {
    width: '100%',
    maxWidth: '480px',
    padding: '0.85rem 1.25rem',
    background: 'rgba(255,255,255,0.04)',
    border: '2px solid var(--glass-border-highlight)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    fontSize: '1.3rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    outline: 'none',
    textAlign: 'center',
    transition: 'border-color 0.15s',
    caretColor: 'var(--accent-purple)',
  },
  inputShake: {
    animation: 'inputShake 0.35s ease',
  },
  hint: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  kbd: {
    display: 'inline-block',
    padding: '0.1rem 0.5rem',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border-highlight)',
    borderRadius: '0.3rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
};

export default WordRacer;

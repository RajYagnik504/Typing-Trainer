import React, { useState, useCallback } from 'react';
import A2ZSpeed    from '../games/A2ZSpeed';
import BubblePop   from '../games/BubblePop';
import NeonWordRush from '../games/NeonWordRush';
import RhythmStrike from '../games/RhythmStrike';
import { useSound } from '../context/SoundContext';
import { useAppContext } from '../context/AppContext';
import { Gamepad2, Zap } from 'lucide-react';

/* ── Game metadata ───────────────────────────────────────────────────────── */
const GAMES = [
  {
    id         : 'bubble',
    label      : 'Bubble Pop',
    icon       : '🫧',
    accent     : 'var(--accent-purple)',
    accentRgb  : '127,119,221',
    gameKey    : 'bubblePop',
    description: 'Type falling letters before they escape. Build combos for bonus points.',
    tip        : 'Rare letters (Q X Z J V) are worth 3× more — watch for the purple glow!',
    trains     : 'Reaction speed · Key recognition · Combo precision',
  },
  {
    id         : 'a2z',
    label      : 'A–Z Speed',
    icon       : '⚡',
    accent     : 'var(--accent-teal)',
    accentRgb  : '29,158,117',
    gameKey    : 'a2zSpeed',
    description: 'Race through the full alphabet as fast as possible. Pure finger-muscle memory.',
    tip        : 'World-class typists hit A–Z in under 5 seconds. Sub-7s is excellent.',
    trains     : 'Finger sequence memory · Speed · Alphabetic automaticity',
  },
  {
    id         : 'rush',
    label      : 'Neon Word Rush',
    icon       : '🚀',
    accent     : 'var(--accent-red)',
    accentRgb  : '226,75,74',
    gameKey    : 'neonWordRush',
    description: 'Words fly right → left at increasing speed. Type the full word before it escapes.',
    tip        : 'Green = safe · Amber = hurry · Red = critical. Prioritise by danger colour!',
    trains     : 'Visual tracking · Burst typing · Pressure resistance',
  },
  {
    id         : 'rhythm',
    label      : 'Rhythm Strike',
    icon       : '🥁',
    accent     : '#B2AFFF',
    accentRgb  : '178,175,255',
    gameKey    : 'rhythmStrike',
    description: 'Hit D F J K keys in sync with the procedural beat. Timing is everything.',
    tip        : 'Perfect = ±50ms · Great = ±100ms · Good = ±160ms. The beat never lies.',
    trains     : 'Rhythm precision · Timing accuracy · Hand synchronisation',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
const Games = () => {
  const [activeId, setActiveId] = useState('bubble');
  const { playKeyClick }        = useSound();
  const { recordGameSession }   = useAppContext();

  const active = GAMES.find(g => g.id === activeId);

  const handleTabChange = useCallback((id) => {
    if (id === activeId) return;
    playKeyClick();
    setActiveId(id);
  }, [activeId, playKeyClick]);

  /* Each game's onComplete wires into the ML accumulator */
  const handleComplete = useCallback((gameKey) => (sessionData) => {
    if (sessionData && gameKey) {
      recordGameSession(gameKey, { ...sessionData, date: new Date().toISOString() });
    }
  }, [recordGameSession]);

  return (
    <div style={sty.container}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={sty.header}>
        <div style={sty.headerLeft}>
          <Gamepad2 size={22} color="var(--accent-purple)" />
          <h2 style={sty.pageTitle}>
            Mini <span className="text-gradient-purple">Games</span>
          </h2>
        </div>

        {/* ── Tab bar ── */}
        <div style={sty.tabBar} role="tablist">
          {GAMES.map(g => {
            const isActive = activeId === g.id;
            return (
              <button
                key={g.id}
                role="tab"
                aria-selected={isActive}
                style={{
                  ...sty.tab,
                  backgroundColor: isActive ? `rgba(${g.accentRgb},0.18)` : 'transparent',
                  color          : isActive ? '#fff' : 'var(--text-secondary)',
                  outline        : isActive ? `1px solid rgba(${g.accentRgb},0.4)` : 'none',
                  boxShadow      : isActive ? `0 0 18px rgba(${g.accentRgb},0.25)` : 'none',
                }}
                onClick={() => handleTabChange(g.id)}
              >
                <span style={sty.tabIcon}>{g.icon}</span>
                <span style={sty.tabLabel}>{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active game (key forces full remount on tab switch) ────── */}
      <div style={sty.gameWrap} key={activeId}>
        {activeId === 'bubble' && <BubblePop    onComplete={handleComplete('bubblePop')}    />}
        {activeId === 'a2z'    && <A2ZSpeed     onComplete={handleComplete('a2zSpeed')}     />}
        {activeId === 'rush'   && <NeonWordRush  onComplete={handleComplete('neonWordRush')} />}
        {activeId === 'rhythm' && <RhythmStrike  onComplete={handleComplete('rhythmStrike')} />}
      </div>

      {/* ── Info footer ─────────────────────────────────────────────── */}
      <div
        className="glass-panel animate-fadeIn"
        style={{ ...sty.infoCard, borderColor: `rgba(${active.accentRgb},0.22)` }}
      >
        <div style={sty.infoLeft}>
          <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{active.icon}</span>
          <div>
            <p style={{ fontWeight: 700, color: active.accent, marginBottom: '0.2rem', fontSize: '0.9rem' }}>
              {active.label}
            </p>
            <p style={sty.infoDesc}>{active.description}</p>
            <p style={{ ...sty.infoDesc, marginTop: '0.3rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              🧠 Trains: {active.trains}
            </p>
          </div>
        </div>
        <div style={sty.infoTip}>
          <Zap size={13} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <span>{active.tip}</span>
        </div>
      </div>
    </div>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────────── */
const sty = {
  container: {
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
    maxWidth: '960px', margin: '0 auto', width: '100%',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  pageTitle : { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' },

  tabBar: {
    display: 'flex',
    background: 'var(--glass-bg)',
    padding: '0.3rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--glass-border)',
    gap: '0.15rem',
    flexWrap: 'wrap',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 1rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600, fontSize: '0.85rem',
    border: 'none', cursor: 'pointer',
    transition: 'all 0.22s ease',
    whiteSpace: 'nowrap',
  },
  tabIcon : { fontSize: '1rem', lineHeight: 1 },
  tabLabel: {},

  gameWrap: { width: '100%', animation: 'fadeIn 0.3s ease both' },

  infoCard: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap',
    gap: '1rem', padding: '1rem 1.5rem', border: '1px solid',
  },
  infoLeft: { display: 'flex', alignItems: 'flex-start', gap: '0.85rem' },
  infoDesc: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
  infoTip : {
    display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
    fontSize: '0.78rem', color: 'var(--text-muted)',
    fontStyle: 'italic', maxWidth: '300px',
  },
};

export default Games;

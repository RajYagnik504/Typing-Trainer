import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { generateMasteryText } from '../data/lessonData';
import KeyboardDisplay from '../../components/KeyboardDisplay';
import { Play, RotateCcw } from 'lucide-react';

export default function HomeRowModule() {
  const { unlockAchievement } = useAcademy();
  const [phase, setPhase] = useState('select'); // select | typing | result
  const [pressedKey, setPressedKey] = useState(null);
  
  const targetText = generateMasteryText(1);
  const engine = useTypingEngine(targetText, ({ accuracy }) => {
    setPhase('result');
    if (accuracy >= 90) {
      unlockAchievement('homerow_master', 'Home Row Master', 'Mastered the home row keys', '🏠');
    }
  });

  const handleStart = () => {
    engine.startTest();
    setPhase('typing');
  };

  return (
    <div className="glass-panel animate-fadeIn" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '560px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>🏠 Home Row Anchor</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Rest your fingers on ASDF (left) and JKL; (right). Build muscle memory around your keyboard anchor keys.
        </p>
      </div>

      {phase === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 2rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 800, fontSize: '0.85rem' }}>KEYS: </span>
            <span style={{ fontFamily: 'monospace', color: 'white', fontWeight: 700 }}>A S D F J K L ;</span>
          </div>
          <button 
            onClick={handleStart}
            style={{
              padding: '0.75rem 2.25rem', background: 'var(--accent-purple)', color: '#white',
              borderRadius: '999px', fontWeight: 700, fontSize: '1rem',
              boxShadow: 'var(--glow-purple)', border: 'none', cursor: 'pointer'
            }}
          >
            <Play size={16} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Start Drill
          </button>
        </div>
      )}

      {phase === 'typing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div><span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-teal)' }}>{engine.currentWpm}</span> WPM</div>
            <div><span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-amber)' }}>{engine.accuracyPct}%</span> Accuracy</div>
            <div><span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-purple)' }}>{engine.timeElapsed}s</span> Time</div>
          </div>

          <div className="glass-panel" style={{
            padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '1.3rem',
            lineHeight: 1.8, letterSpacing: '0.05em', maxWidth: '640px', width: '100%',
            wordBreak: 'break-all', display: 'flex', flexWrap: 'wrap', gap: '2px 0px'
          }}>
            {targetText.split('').map((ch, i) => {
              const typed = engine.typedText[i];
              const isNext = i === engine.typedText.length;
              let color = 'var(--text-muted)';
              if (typed !== undefined) {
                color = typed === ch ? 'var(--accent-teal)' : 'var(--accent-red)';
              }
              return (
                <span key={i} style={{ color }} className={isNext ? 'caret-glow' : ''}>
                  {ch}
                </span>
              );
            })}
          </div>

          <div style={{ width: '100%', maxWidth: '680px' }}>
            <KeyboardDisplay pressedKey={pressedKey} homeRowGlow showFingerLabelscompact />
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: engine.accuracyPct >= 90 ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
            {engine.accuracyPct >= 90 ? 'Drill Completed!' : 'Drill Failed'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {engine.accuracyPct >= 90 ? 'Perfect! You are building great muscle memory.' : 'Try to get at least 90% accuracy without looking.'}
          </p>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>WPM: <strong>{engine.currentWpm}</strong></div>
            <div>Accuracy: <strong>{engine.accuracyPct}%</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setPhase('select')}
              style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
            >
              Back
            </button>
            <button 
              onClick={handleStart}
              style={{ padding: '0.6rem 1.5rem', background: 'var(--accent-purple)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
            >
              <RotateCcw size={14} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

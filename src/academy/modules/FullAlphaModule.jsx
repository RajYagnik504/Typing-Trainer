import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { generateMasteryText } from '../data/lessonData';
import KeyboardDisplay from '../../components/KeyboardDisplay';
import { Play, RotateCcw } from 'lucide-react';

const STAGES = [
  { id: 6, name: 'Capitalization Flow' },
  { id: 7, name: 'Common Word Bursts' },
  { id: 8, name: 'Punctuation & Sentences' },
  { id: 9, name: 'Full Paragraph Control' }
];

export default function FullAlphaModule() {
  const { unlockAchievement } = useAcademy();
  const [selectedStage, setSelectedStage] = useState(6);
  const [phase, setPhase] = useState('select');
  const [pressedKey, setPressedKey] = useState(null);

  const targetText = generateMasteryText(selectedStage);
  const engine = useTypingEngine(targetText, ({ accuracy }) => {
    setPhase('result');
    if (accuracy >= 90) {
      unlockAchievement(`fullalpha_stage_${selectedStage}`, 'Alpha Advanced Master', `Mastered Stage ${selectedStage} of Full Alpha`, '✨');
    }
  });

  const handleStart = () => {
    engine.startTest();
    setPhase('typing');
  };

  return (
    <div className="glass-panel animate-fadeIn" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '560px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>✨ Full Alpha & Paragraphs</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Integrate all rows, shift key coordination, punctuation, and sentence flow to unlock complete touch typing capability.
        </p>
      </div>

      {phase === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%' }}>
            {STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                style={{
                  padding: '1rem', background: selectedStage === s.id ? 'rgba(127,119,221,0.1)' : 'rgba(255,255,255,0.03)',
                  border: selectedStage === s.id ? '1px solid var(--accent-purple)' : '1px solid var(--glass-border)',
                  color: selectedStage === s.id ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 800 }}>STAGE {s.id}</span>
                <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{s.name}</div>
              </button>
            ))}
          </div>

          <button 
            onClick={handleStart}
            style={{
              padding: '0.75rem 2.25rem', background: 'var(--accent-purple)', color: 'white',
              borderRadius: '999px', fontWeight: 700, fontSize: '1rem',
              boxShadow: 'var(--glow-purple)', border: 'none', cursor: 'pointer', marginTop: '1rem'
            }}
          >
            <Play size={16} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Start Stage {selectedStage}
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
            padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '1.2rem',
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
            <KeyboardDisplay pressedKey={pressedKey} showFingerLabelscompact />
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: engine.accuracyPct >= 90 ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
            {engine.accuracyPct >= 90 ? 'Stage Mastered!' : 'Stage Incomplete'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {engine.accuracyPct >= 90 ? 'Amazing skill! You are building true keyboard coordination.' : 'Accuracy is key! Slow down a bit to maintain rhythm.'}
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

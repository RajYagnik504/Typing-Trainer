import React, { useState, useEffect } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { getRandomText } from '../data/typingTexts';
import { useAppContext } from '../context/AppContext';
import { predictSkill } from '../services/mlService';
import { RefreshCw, Activity, Target, Clock, Cpu } from 'lucide-react';
import Heatmap from '../components/Heatmap';

const SkillTest = () => {
  const { settings, profile, setProfile, setHistory } = useAppContext();
  const [targetText, setTargetText] = useState('');
  
  const engine = useTypingEngine(targetText);
  
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setTargetText(getRandomText(settings.difficultyMode));
  }, [settings.difficultyMode]);

  const handleRestart = () => {
    engine.restart();
    setTargetText(getRandomText(settings.difficultyMode));
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await predictSkill(engine);
      setAnalysisResult(result);
      
      // Update profile
      setProfile(prev => ({
        ...prev,
        skillLevel: result.skill_level,
        score: result.score
      }));
      
      // Save to history
      setHistory(prev => [{
        date: new Date().toISOString(),
        wpm: engine.wpm,
        accuracy: engine.accuracy,
        skillLevel: result.skill_level,
        score: result.score
      }, ...prev].slice(0, 50)); // keep last 50
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render the text with correct/incorrect highlighting
  const renderText = () => {
    return targetText.split('').map((char, index) => {
      let color = 'var(--text-muted)';
      let backgroundColor = 'transparent';
      let textShadow = 'none';
      
      if (index < engine.typedText.length) {
        if (engine.typedText[index] === char) {
          color = 'var(--accent-teal)';
          textShadow = 'var(--glow-teal)';
        } else {
          color = '#fff';
          backgroundColor = 'var(--accent-red)';
        }
      } else if (index === engine.typedText.length && engine.status === 'active') {
        color = '#fff';
        backgroundColor = 'rgba(255,255,255,0.2)';
        textShadow = '0 0 8px rgba(255,255,255,0.5)'; // Cursor glow
      }

      return (
        <span 
          key={index} 
          style={{ 
            color, 
            backgroundColor,
            textShadow,
            borderRadius: '2px',
            transition: 'color 0.1s',
            borderBottom: (index === engine.typedText.length && engine.status === 'active') ? '2px solid white' : 'none'
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div style={styles.container}>
      
      <div style={styles.header}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>
          <span className="text-gradient">Skill Evaluation</span>
        </h2>
        <div style={styles.modeBadge}>
          {settings.difficultyMode} Mode
        </div>
      </div>

      <div className="glass-panel" style={styles.typingArea}>
        <div style={styles.metricsBar}>
          <div style={styles.metric}><Activity size={18} color="var(--accent-teal)" /> WPM: <strong>{engine.wpm}</strong></div>
          <div style={styles.metric}><Target size={18} color="var(--accent-purple)" /> Acc: <strong>{Math.round(engine.accuracy * 100)}%</strong></div>
          <div style={styles.metric}><Clock size={18} color="var(--accent-amber)" /> {Math.round(engine.timeElapsedMs / 1000)}s</div>
        </div>
        
        <div style={styles.textDisplay}>
          {renderText()}
        </div>
        
        {engine.status === 'idle' && (
          <div style={styles.startOverlay}>
            Start typing to begin the test...
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button style={styles.iconButton} onClick={handleRestart} title="Restart Test">
          <RefreshCw size={24} color="var(--text-secondary)" />
        </button>
        
        {engine.status === 'finished' && !analysisResult && (
          <button 
            style={styles.analyzeButton} 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing Data...' : 'Analyze My Skill'}
            <Cpu size={20} style={{ marginLeft: '0.5rem' }} />
          </button>
        )}
      </div>

      {analysisResult && (
        <div className="glass-panel" style={{...styles.resultCard, animation: 'fadeIn 0.5s ease-out'}}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-purple)' }}>Analysis Complete</h3>
          
          <div style={styles.resultGrid}>
            <div style={styles.resultItem}>
              <span style={{ color: 'var(--text-secondary)' }}>Assigned Skill Level</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--accent-teal)' }}>{analysisResult.skill_level}</strong>
            </div>
            
            <div style={styles.resultItem}>
              <span style={{ color: 'var(--text-secondary)' }}>Composite Score</span>
              <strong style={{ fontSize: '1.8rem' }}>{analysisResult.score}/100</strong>
            </div>
            
            <div style={styles.resultItem}>
              <span style={{ color: 'var(--text-secondary)' }}>Rhythm Score</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--accent-amber)' }}>{Math.round(engine.rhythmScore * 100)}%</strong>
            </div>
          </div>
          
          <div style={styles.recommendationBox}>
            <strong>AI Insight:</strong> {analysisResult.recommendation}
          </div>
          
          <Heatmap slowKeys={engine.slowKeys} errorKeys={engine.errorKeys} />
        </div>
      )}

    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeBadge: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--accent-purple)',
    padding: '0.25rem 1rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.85rem',
    color: 'var(--accent-purple)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: 'var(--glow-purple)',
  },
  typingArea: {
    padding: '2.5rem',
    position: 'relative',
    minHeight: '250px',
  },
  metricsBar: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '1rem',
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
  },
  textDisplay: {
    fontSize: '1.8rem',
    lineHeight: '1.6',
    fontFamily: 'var(--font-mono)',
    position: 'relative',
    zIndex: 1,
  },
  startOverlay: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'var(--text-secondary)',
    animation: 'pulse 2s infinite',
    fontSize: '0.9rem',
    letterSpacing: '1px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    alignItems: 'center',
  },
  iconButton: {
    padding: '0.75rem',
    borderRadius: '50%',
    backgroundColor: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  analyzeButton: {
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--accent-purple)',
    color: 'white',
    borderRadius: 'var(--radius-full)',
    fontWeight: '600',
    fontSize: '1.1rem',
    boxShadow: 'var(--glow-purple-strong)',
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.2s',
  },
  resultCard: {
    padding: '2rem',
    marginTop: '1rem',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
  },
  recommendationBox: {
    padding: '1.25rem',
    borderLeft: '4px solid var(--accent-amber)',
    backgroundColor: 'rgba(239, 159, 39, 0.05)',
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
  }
};

export default SkillTest;

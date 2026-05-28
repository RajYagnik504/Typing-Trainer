import React from 'react';
import { Keyboard, Gamepad2, BookOpen, ArrowRight, Zap } from 'lucide-react';

export default function Practice({ onNavigate }) {
  const options = [
    {
      id: 'Skill Test',
      title: 'Skill Test',
      desc: 'Take a high-precision typing speed and accuracy test to analyze your keyboard mechanics and cognitive profile.',
      icon: Keyboard,
      accent: 'var(--accent-teal)',
      badge: 'Highly Recommended',
      badgeColor: 'badge-teal'
    },
    {
      id: 'Academy',
      title: 'Typing Academy',
      desc: 'Guided step-by-step curriculum with interactive keyboard maps, structured finger patterns, and milestones.',
      icon: BookOpen,
      accent: 'var(--accent-purple)',
      badge: 'Lessons',
      badgeColor: 'badge-purple'
    },
    {
      id: 'Games',
      title: 'Arcade Games',
      desc: 'Play keyboard speed games like Bubble Pop to train muscle memory, reflex speed, and finger coordinate precision.',
      icon: Gamepad2,
      accent: 'var(--accent-amber)',
      badge: 'Engaging',
      badgeColor: 'badge-amber'
    }
  ];

  return (
    <div style={styles.container} className="animate-fadeIn">
      <header style={styles.header}>
        <div style={styles.iconWrap}>
          <Zap size={24} color="var(--accent-purple)" />
        </div>
        <h1 style={styles.title} className="text-gradient-purple">Practice Lab Hub</h1>
        <p style={styles.subtitle}>Select a training module to refine your keyboard coordination and speed</p>
      </header>

      <div style={styles.grid}>
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <div 
              key={opt.id} 
              className="glass-panel" 
              style={{ ...styles.card, borderColor: `${opt.accent}25` }}
            >
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrap, background: `${opt.accent}12`, border: `1px solid ${opt.accent}30` }}>
                  <Icon size={24} color={opt.accent} />
                </div>
                <span className={`badge ${opt.badgeColor}`}>{opt.badge}</span>
              </div>
              
              <h2 style={styles.cardTitle}>{opt.title}</h2>
              <p style={styles.cardDesc}>{opt.desc}</p>
              
              <button 
                onClick={() => onNavigate(opt.id)}
                style={{ ...styles.actionBtn, background: `${opt.accent}15`, border: `1px solid ${opt.accent}40`, color: opt.accent }}
              >
                <span>Launch Session</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    padding: '20px 10px',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(127,119,221,0.08)',
    border: '1px solid rgba(127,119,221,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.03em'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: '520px',
    lineHeight: '1.4'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '960px'
  },
  card: {
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-lg)',
    transition: 'transform 0.2s, border-color 0.2s',
    boxSizing: 'border-box'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  cardIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'white',
    margin: '0 0 0.5rem 0'
  },
  cardDesc: {
    fontSize: '1.15rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: '0 0 1.5rem 0',
    flexGrow: 1
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '1.15rem',
    transition: 'all 0.2s',
    width: '100%'
  }
};

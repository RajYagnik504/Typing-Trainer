import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSound } from '../context/SoundContext';
import { Settings, Volume2, VolumeX, BarChart2, Award } from 'lucide-react';
// import { Line } from 'react-chartjs-2'; // For future ML evolution chart

const ACADEMY_ACHIEVEMENTS = [
  { id: 'first_test',       name: 'First Drill',         desc: 'Completed your first typing session', icon: '🔥' },
  { id: 'paragraph_master',  name: 'Paragraph Master',    desc: 'Completed a cinematic paragraph drill', icon: '📝' },
  { id: 'flow_state',        name: 'Flow State',          desc: 'Achieved typing flow consistency >= 85%', icon: '🌊' },
  { id: 'precision_writer',  name: 'Precision Writer',    desc: 'Completed a paragraph drill with >= 98% accuracy', icon: '🎯' },
  { id: 'neural_typist',     name: 'Neural Typist',       desc: 'Reached a Blind touch-typing score >= 75', icon: '🧠' },
  { id: 'ghost_fingers',     name: 'Ghost Fingers',       desc: 'Completed an Eyes-Off test in Ghost or Blind mode', icon: '👻' },
  { id: 'elite_operator',    name: 'Elite Operator',      desc: 'Achieved speed >= 80 WPM in any session', icon: '⚡' },
];

const Profile = () => {
  const { profile, setProfile, settings, setSettings, history, achievements } = useAppContext();
  const { soundEnabled, setSoundEnabled, volume, setVolume, playKeyClick } = useSound();
  
  const [activeTab, setActiveTab] = useState('Stats'); // Stats, Settings

  const handleModeChange = (mode) => {
    playKeyClick();
    setSettings(prev => ({ ...prev, performanceMode: mode }));
  };

  const handleDifficultyChange = (diff) => {
    playKeyClick();
    setSettings(prev => ({ ...prev, difficultyMode: diff }));
  };

  const toggleSound = () => {
    playKeyClick();
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div style={styles.container}>
      {/* Profile Header */}
      <div className="glass-panel" style={styles.headerCard}>
        <div style={styles.avatarPlaceholder}>
          {profile.username.charAt(0)}
        </div>
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>{profile.username}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Joined: {new Date(profile.joinDate).toLocaleDateString()}
          </p>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--accent-teal)', fontWeight: 'bold' }}>{profile.skillLevel}</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span>Score: {profile.score}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button 
          style={{...styles.tabBtn, borderBottom: activeTab === 'Stats' ? '2px solid var(--accent-purple)' : 'none'}}
          onClick={() => { playKeyClick(); setActiveTab('Stats') }}
        >
          <BarChart2 size={18} /> Stats & History
        </button>
        <button 
          style={{...styles.tabBtn, borderBottom: activeTab === 'Settings' ? '2px solid var(--accent-purple)' : 'none'}}
          onClick={() => { playKeyClick(); setActiveTab('Settings') }}
        >
          <Settings size={18} /> Settings
        </button>
      </div>

      {/* Content */}
      {activeTab === 'Stats' && (
        <div style={styles.statsGrid}>
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}><Award size={20} /> Achievements</h3>
            <div style={styles.achievementList}>
              {ACADEMY_ACHIEVEMENTS.map(ach => {
                const isUnlocked = achievements && achievements.some(a => a.id === ach.id);
                return (
                  <div key={ach.id} style={{
                    ...styles.achievementBadge,
                    opacity: isUnlocked ? 1 : 0.4,
                    border: isUnlocked ? '1px solid var(--accent-purple)' : '1px solid var(--glass-border)',
                    boxShadow: isUnlocked ? '0 0 10px rgba(127,119,221,0.15)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{ach.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {ach.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {ach.desc}
                      </span>
                    </div>
                    {isUnlocked && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: 'bold' }}>
                        Unlocked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="glass-panel" style={{...styles.panel, gridColumn: 'span 2'}}>
            <h3 style={styles.panelTitle}>Recent History</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No typing history yet.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '0.5rem' }}>Date</th>
                    <th style={{ padding: '0.5rem' }}>WPM</th>
                    <th style={{ padding: '0.5rem' }}>Accuracy</th>
                    <th style={{ padding: '0.5rem' }}>Skill</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{new Date(h.date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{h.wpm}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{Math.round(h.accuracy * 100)}%</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--accent-teal)' }}>{h.skillLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="glass-panel" style={styles.settingsPanel}>
          
          <div style={styles.settingGroup}>
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Performance Mode</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Adjust visual effects based on your device capabilities.</p>
            </div>
            <div style={styles.toggleGroup}>
              {['High', 'Medium', 'Minimal'].map(mode => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: settings.performanceMode === mode ? 'var(--accent-purple)' : 'transparent',
                    color: settings.performanceMode === mode ? 'white' : 'var(--text-primary)',
                    borderColor: settings.performanceMode === mode ? 'var(--accent-purple)' : 'var(--glass-border)'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

          <div style={styles.settingGroup}>
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Typing Difficulty</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Changes text complexity in the Skill Test.</p>
            </div>
            <div style={styles.toggleGroup}>
              {['Beginner', 'Intermediate', 'Advanced', 'Zen', 'Hardcore'].map(diff => (
                <button
                  key={diff}
                  onClick={() => handleDifficultyChange(diff)}
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: settings.difficultyMode === diff ? 'var(--accent-teal)' : 'transparent',
                    color: settings.difficultyMode === diff ? 'white' : 'var(--text-primary)',
                    borderColor: settings.difficultyMode === diff ? 'var(--accent-teal)' : 'var(--glass-border)',
                    fontSize: '0.8rem'
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

          <div style={styles.settingGroup}>
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Sound Effects
                <button onClick={toggleSound} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} color="var(--accent-red)" />}
                </button>
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Key clicks and UI sounds.</p>
            </div>
            
            {soundEnabled && (
              <div style={{ width: '200px' }}>
                <input 
                  type="range" 
                  min="0.1" max="1" step="0.1" 
                  value={volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    playKeyClick();
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

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
    maxWidth: '800px',
    margin: '0 auto',
  },
  headerCard: {
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  avatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-purple)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: 'var(--glow-purple)',
  },
  tabContainer: {
    display: 'flex',
    gap: '1.5rem',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '0.5rem',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '1.5rem',
  },
  panel: {
    padding: '1.5rem',
  },
  panelTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.2rem',
    marginBottom: '1rem',
    color: 'var(--text-secondary)',
  },
  achievementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  achievementBadge: {
    padding: '0.75rem',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  settingsPanel: {
    padding: '2rem',
  },
  settingGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  toggleGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  toggleBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    transition: 'all 0.2s',
  }
};

export default Profile;

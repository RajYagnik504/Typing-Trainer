import React, { useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const mockLeaderboard = [
  { rank: 1, username: 'NeonTyper_X', wpm: 178, accuracy: 99.2, skillLevel: 'Expert', score: 98, country: '🇰🇷' },
  { rank: 2, username: 'CypherKey', wpm: 165, accuracy: 98.5, skillLevel: 'Expert', score: 96, country: '🇺🇸' },
  { rank: 3, username: 'GhostInTheShell', wpm: 154, accuracy: 99.8, skillLevel: 'Expert', score: 95, country: '🇯🇵' },
  { rank: 4, username: 'Velocity', wpm: 142, accuracy: 97.1, skillLevel: 'Expert', score: 92, country: '🇩🇪' },
  { rank: 5, username: 'QwertyNinja', wpm: 135, accuracy: 96.5, skillLevel: 'Expert', score: 89, country: '🇬🇧' },
  { rank: 6, username: 'Synapse', wpm: 120, accuracy: 98.9, skillLevel: 'Advanced', score: 85, country: '🇨🇦' },
  { rank: 7, username: 'ByteMe', wpm: 115, accuracy: 95.4, skillLevel: 'Advanced', score: 82, country: '🇦🇺' },
  { rank: 8, username: 'KeySmasher', wpm: 105, accuracy: 94.2, skillLevel: 'Advanced', score: 79, country: '🇧🇷' },
  { rank: 9, username: 'CtrlAltElite', wpm: 98, accuracy: 99.1, skillLevel: 'Advanced', score: 78, country: '🇫🇷' },
  { rank: 10, username: 'Neo', wpm: 95, accuracy: 97.5, skillLevel: 'Advanced', score: 76, country: '🇺🇸' },
];

const Leaderboard = () => {
  const { profile } = useAppContext();
  const [filter, setFilter] = useState('All Time');
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (f) => {
    setLoading(true);
    setFilter(f);
    setTimeout(() => {
      setLoading(false);
    }, 700);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={20} color="#FFD700" />;
    if (rank === 2) return <Medal size={20} color="#C0C0C0" />;
    if (rank === 3) return <Award size={20} color="#CD7F32" />;
    return <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', paddingLeft: '8px' }}>{rank}</span>;
  };

  const getSkillColor = (skill) => {
    switch (skill) {
      case 'Expert': return 'var(--accent-purple)';
      case 'Advanced': return 'var(--accent-teal)';
      case 'Intermediate': return 'var(--accent-amber)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Global <span className="text-gradient">Leaderboard</span></h2>
        
        <div style={styles.filterGroup}>
          {['Today', 'This Week', 'All Time'].map(f => (
            <button 
              key={f}
              style={{
                ...styles.filterBtn,
                backgroundColor: filter === f ? 'var(--glass-border-highlight)' : 'transparent',
                color: filter === f ? 'white' : 'var(--text-secondary)'
              }}
              onClick={() => handleFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingWrapper}>
            <div style={styles.spinner}></div>
            <span>QUERYING GLOBAL INTELLIGENCE DATABASE...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>WPM</th>
                <th style={styles.th}>Accuracy</th>
                <th style={styles.th}>Skill Tier</th>
                <th style={styles.th}>Score</th>
              </tr>
            </thead>
            <tbody>
              {profile.score > 0 && (
                <tr style={{...styles.tr, ...styles.userRow}}>
                  <td style={styles.td}>11</td>
                  <td style={{...styles.td, fontWeight: 'bold', color: 'var(--accent-teal)'}}>
                    🏳️ {profile.username} (You)
                  </td>
                  <td style={styles.td}>--</td>
                  <td style={styles.td}>--</td>
                  <td style={{...styles.td, color: getSkillColor(profile.skillLevel)}}>{profile.skillLevel}</td>
                  <td style={styles.td}>{profile.score}</td>
                </tr>
              )}

              {mockLeaderboard.map((row) => (
                <tr key={row.rank} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.rankCell}>{getRankIcon(row.rank)}</div>
                  </td>
                  <td style={{...styles.td, fontWeight: 500}}>
                    <span style={{marginRight: '0.5rem'}}>{row.country}</span>
                    {row.username}
                  </td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{row.wpm}</td>
                  <td style={styles.td}>{row.accuracy}%</td>
                  <td style={{...styles.td, color: getSkillColor(row.skillLevel), fontWeight: 600}}>
                    {row.skillLevel}
                  </td>
                  <td style={styles.td}>{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    gap: '0.5rem',
    background: 'var(--glass-bg)',
    padding: '0.25rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
  },
  filterBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  tableContainer: {
    overflow: 'hidden',
    padding: '1px', // for border
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeader: {
    borderBottom: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  th: {
    padding: '1.25rem 1.5rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    transition: 'background 0.2s',
  },
  userRow: {
    backgroundColor: 'rgba(29, 158, 117, 0.1)',
    border: '1px solid var(--accent-teal)',
  },
  td: {
    padding: '1.25rem 1.5rem',
    color: 'var(--text-primary)',
  },
  rankCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '1rem',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    letterSpacing: '1px'
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(127, 119, 221, 0.1)',
    borderTop: '3px solid var(--accent-purple)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default Leaderboard;

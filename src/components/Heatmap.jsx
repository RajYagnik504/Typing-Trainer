import React from 'react';

// Standard QWERTY layout
const keyboardRows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const Heatmap = ({ slowKeys = {}, errorKeys = {} }) => {

  const getKeyColor = (key) => {
    const isError = errorKeys[key];
    const isSlow = slowKeys[key];
    
    if (isError) return 'rgba(226, 75, 74, 0.6)'; // Red for errors
    if (isSlow) return 'rgba(239, 159, 39, 0.6)'; // Amber for slow
    return 'rgba(255, 255, 255, 0.05)'; // Default
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Typing Heatmap</h4>
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.colorBox, backgroundColor: 'rgba(226, 75, 74, 0.6)'}}></div> Error Prone
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.colorBox, backgroundColor: 'rgba(239, 159, 39, 0.6)'}}></div> Hesitation / Slow
        </div>
      </div>
      
      <div style={styles.keyboard}>
        {keyboardRows.map((row, i) => (
          <div key={i} style={styles.row}>
            {row.map(k => (
              <div key={k} style={{
                ...styles.key,
                backgroundColor: getKeyColor(k),
                borderColor: (errorKeys[k] || slowKeys[k]) ? 'transparent' : 'var(--glass-border)'
              }}>
                {k.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 'var(--radius-md)',
  },
  title: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  legend: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  colorBox: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
  },
  keyboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'center',
  },
  row: {
    display: 'flex',
    gap: '6px',
  },
  key: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    border: '1px solid var(--glass-border)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  }
};

export default Heatmap;

import React, { useState } from 'react';
import { Keyboard, Home, Activity, Gamepad2, Trophy, User, BookOpen } from 'lucide-react';
import { useSound } from '../context/SoundContext';

const NAV_ITEMS = [
  { id: 'Home',        icon: Home,     accent: 'var(--accent-purple)' },
  { id: 'Skill Test',  icon: Activity, accent: 'var(--accent-teal)'   },
  { id: 'Games',       icon: Gamepad2, accent: 'var(--accent-amber)'  },
  { id: 'Leaderboard', icon: Trophy,   accent: 'var(--accent-amber)'  },
  { id: 'Academy',     icon: BookOpen, accent: '#5BA8F5'              },
  { id: 'Profile',     icon: User,     accent: 'var(--accent-purple)' },

];

const Navbar = ({ currentTab, setCurrentTab }) => {
  const { playKeyClick } = useSound();
  const [hovered, setHovered] = useState(null);

  const handleNavClick = (id) => {
    playKeyClick();
    setCurrentTab(id);
  };

  return (
    <nav style={styles.navbar} className="glass-panel">
      {/* Logo */}
      <div style={styles.logoContainer}>
        <div style={styles.logoIconWrap}>
          <Keyboard size={20} color="var(--accent-purple)" />
        </div>
        <h1 style={styles.logoText} className="text-gradient-purple">TypeMaster</h1>
        {/* Live pulse dot */}
        <span style={styles.liveDot} title="App active" />
      </div>

      {/* Nav links */}
      <div style={styles.navLinks} role="navigation">
        {NAV_ITEMS.map(({ id, icon: Icon, accent }) => {
          const isActive  = currentTab === id;
          const isHovered = hovered === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                ...styles.navButton,
                backgroundColor : isActive
                  ? 'rgba(127,119,221,0.14)'
                  : isHovered
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                color  : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: isActive ? `inset 0 0 0 1px ${accent}40, 0 0 16px ${accent}22` : 'none',
                transform: isHovered && !isActive ? 'translateY(-1px)' : 'none',
              }}
            >
              <Icon
                size={16}
                color={isActive ? accent : 'currentColor'}
                style={{ flexShrink: 0, transition: 'color 0.2s' }}
              />
              <span>{id}</span>
              {isActive && <span style={{ ...styles.activeDot, background: accent }} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────────── */
const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.75rem',
    margin: '1rem 2rem 0',
    zIndex: 10,
    borderRadius: 'var(--radius-lg)',
  },

  /* Logo */
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  logoIconWrap: {
    width: '34px',
    height: '34px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(127,119,221,0.12)',
    border: '1px solid rgba(127,119,221,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '1.3rem',
    fontWeight: 800,
    letterSpacing: '-0.05em',
  },
  liveDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--accent-teal)',
    boxShadow: '0 0 8px var(--accent-teal)',
    animation: 'pulse 2s ease infinite',
    flexShrink: 0,
  },

  /* Nav */
  navLinks: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.45rem 0.9rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.88rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    position: 'relative',
    whiteSpace: 'nowrap',
  },
  activeDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    flexShrink: 0,
  },
};

export default Navbar;

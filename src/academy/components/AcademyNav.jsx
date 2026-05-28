import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Home, ArrowUp, ArrowDown, Sparkles, Hash } from 'lucide-react';

export default function AcademyNav() {
  const { activeModule, setActiveModule } = useAcademy();

  const navs = [
    { id: 'homerow', label: 'Home Row', icon: Home },
    { id: 'toprow', label: 'Top Row', icon: ArrowUp },
    { id: 'bottomrow', label: 'Bottom Row', icon: ArrowDown },
    { id: 'fullalpha', label: 'Full Alpha', icon: Sparkles },
    { id: 'symbols', label: 'Symbols', icon: Hash }
  ];

  return (
    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
      {navs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeModule === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveModule(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
              borderColor: isActive ? 'var(--accent-purple)' : 'var(--glass-border)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <Icon size={16} color={isActive ? 'var(--accent-purple)' : 'var(--text-muted)'} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

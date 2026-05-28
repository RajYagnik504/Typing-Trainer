import React from 'react';
import { AcademyProvider, useAcademy } from './context/AcademyContext';
import AcademyNav from './components/AcademyNav';
import HomeRowModule from './modules/HomeRowModule';
import TopRowModule from './modules/TopRowModule';
import BottomRowModule from './modules/BottomRowModule';
import FullAlphaModule from './modules/FullAlphaModule';
import SymbolsModule from './modules/SymbolsModule';
import { Sparkles } from 'lucide-react';

function AcademyPageContent() {
  const { activeModule, blindScore, rank, toast } = useAcademy();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'rgba(10,10,15,0.92)',
          border: '1px solid var(--accent-amber)', boxShadow: '0 0 25px rgba(239,159,39,0.35)',
          borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem', zIndex: 9999
        }}>
          <Sparkles size={20} color="var(--accent-amber)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--accent-amber)' }}>ACHIEVEMENT UNLOCKED!</span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{toast.icon} {toast.name}</span>
          </div>
        </div>
      )}

      {/* Main Hero Header */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🎓</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
              AI Typing <span className="text-gradient-purple">Intelligence</span> Academy
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '560px', lineHeight: 1.6 }}>
            Evolve your keyboard dexterity, spatial mapping, and writing rhythm with our progressive course, row-specific drills, and live analytics.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '2rem' }}>{rank.icon}</span>
          <div>
            <p style={{ fontWeight: 800, color: rank.color, margin: 0 }}>{rank.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Blind Score: {Math.round(blindScore)}/100</p>
          </div>
        </div>
      </div>

      {/* Academy Navigation */}
      <AcademyNav />

      {/* Active Module Conditional Rendering */}
      <div style={{ minHeight: '400px', width: '100%' }}>
        {activeModule === 'homerow' && <HomeRowModule />}
        {activeModule === 'toprow' && <TopRowModule />}
        {activeModule === 'bottomrow' && <BottomRowModule />}
        {activeModule === 'fullalpha' && <FullAlphaModule />}
        {activeModule === 'symbols' && <SymbolsModule />}
      </div>
    </div>
  );
}

export default function AcademyPage() {
  return (
    <AcademyProvider>
      <AcademyPageContent />
    </AcademyProvider>
  );
}

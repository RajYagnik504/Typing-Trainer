import React, { useMemo, useState } from 'react';
import { Activity, Target, Zap, Trophy, Clock, Keyboard, Gamepad2, TrendingUp, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { computeIntelligenceProfile } from '../services/mlService';
import MetricCard   from '../components/MetricCard';
import AnimatedGauge from '../components/AnimatedGauge';

/* ── Achievement catalogue ───────────────────────────────────────────────── */
const ACH_META = {
  'first_test'     : { label: 'First Test',       emoji: '🎯', color: 'var(--accent-teal)'   },
  '60_wpm_club'    : { label: '60 WPM Club',       emoji: '⚡', color: 'var(--accent-amber)'  },
  '100_wpm_club'   : { label: '100 WPM Club',      emoji: '🔥', color: 'var(--accent-purple)' },
  'accuracy_master': { label: 'Accuracy Master',   emoji: '🎖️', color: 'var(--accent-teal)'  },
  'speed_demon'    : { label: 'Speed Demon',       emoji: '👹', color: 'var(--accent-red)'    },
  'bubble_popper'  : { label: 'Bubble Popper',     emoji: '🫧', color: 'var(--accent-purple)' },
  'alphabet_king'  : { label: 'Alphabet King',     emoji: '👑', color: 'var(--accent-amber)'  },
  'consistent'     : { label: 'Consistent Typist', emoji: '📈', color: 'var(--accent-teal)'   },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const Home = ({ onNavigate }) => {
  const { profile, history, achievements, gameMetrics } = useAppContext();

  /* ── Derived stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    if (!history.length) return { avgWpm: 0, avgAcc: 0, bestWpm: 0, sessions: 0 };
    const sessions = history.length;
    const avgWpm   = Math.round(history.reduce((s, h) => s + (h.wpm || 0), 0) / sessions);
    const avgAcc   = Math.round(history.reduce((s, h) => s + (h.accuracy || 0) * 100, 0) / sessions);
    const bestWpm  = Math.max(...history.map(h => h.wpm || 0));
    return { avgWpm, avgAcc, bestWpm, sessions };
  }, [history]);

  const trend = useMemo(() => {
    if (history.length < 2) return 0;
    const delta = (history[0].wpm || 0) - (history[1].wpm || 0);
    return Math.round((delta / Math.max(history[1].wpm || 1, 1)) * 100);
  }, [history]);

  /* ── Intelligence profile ─────────────────────────────────── */
  const intel = useMemo(() =>
    computeIntelligenceProfile(gameMetrics, history),
    [gameMetrics, history]
  );

  const recentSessions = history.slice(0, 5);
  const unlockedAch    = achievements.map(id => ACH_META[id]).filter(Boolean).slice(0, 4);

  /* ══════════════════════════════════════════════════════════
     JSX
     ══════════════════════════════════════════════════════════ */
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'Is TypeMaster suitable for primary school students?',
      a: 'Absolutely. TypeMaster is built with student privacy in mind. There are no external ads, tracking pixels, or chat rooms. The curriculum focuses on developmental keyboard ergonomics.'
    },
    {
      q: 'Can teachers track student progress and levels?',
      a: 'Yes. By registering a classroom code in the Entry Portal, students synchronize their training speeds, accuracy ratings, and level milestones directly to the teacher\'s local roster.'
    },
    {
      q: 'Are volume discount licenses available for entire school districts?',
      a: 'Yes, our Institution Plan supports bulk licensing for 100+ students, custom subdomains, unified teacher portals, and CSV spreadsheet exports. Contact us via the Contact form.'
    }
  ];

  return (
    <div style={sty.page}>

      {/* ── Institutional Hero Banner ───────────────────────────────── */}
      <div className="glass-panel animate-fadeIn" style={sty.schoolHero}>
        <div style={sty.schoolHeroContent}>
          <span className="badge badge-teal" style={{ marginBottom: '10px' }}>🏫 Educator Approved</span>
          <h1 className="text-gradient-purple" style={sty.schoolHeroTitle}>The #1 Typing Trainer for Schools & Institutions</h1>
          <p style={sty.schoolHeroDesc}>
            Accelerate student muscle-memory, track metrics in real-time, and run level curriculum and keyboard games. Built with advanced cognitive analysis.
          </p>
          <div style={sty.heroCTA}>
            <button style={sty.primaryBtn} onClick={() => onNavigate('Pricing')}>
              <Award size={16} /> Buy for Your Institution
            </button>
            <button style={sty.secondaryBtn} onClick={() => onNavigate('Practice')}>
              <Keyboard size={16} /> Try Practice Labs
            </button>
          </div>
        </div>
        <div style={sty.heroRight}>
          <div style={{ ...sty.archetypeBadge, borderColor: intel.color + '44' }}>
            <span style={sty.archetypeIcon}>{intel.icon}</span>
            <div>
              <p style={{ ...sty.archetypeName, color: intel.color }}>{intel.archetype}</p>
              <p style={sty.archetypeHint}>
                {intel.isNewPlayer ? 'Reveal your profile inside Practice' : 'Your cognitive typing archetype'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Student Greeting Hero ────────────────────────────────────── */}
      <div className="glass-panel animate-fadeIn" style={sty.studentHero}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={sty.greetingRow}>
            <span style={sty.greetingLabel}>Active Session:</span>
            <span className="badge badge-purple">{profile.skillLevel}</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Student User: {profile.username}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.15rem' }}>
            {history.length
              ? `${history.length} session${history.length > 1 ? 's' : ''} logged · Personal best ${stats.bestWpm} WPM`
              : 'No sessions logged yet. Try launching a practice session.'}
          </p>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────────── */}
      <div style={sty.metricsGrid}>
        <MetricCard title="Average WPM"  value={stats.avgWpm}  unit="wpm"   icon={<Activity size={18}/>} accentColor="var(--accent-teal)"   trend={trend} delay={0}   />
        <MetricCard title="Avg Accuracy" value={stats.avgAcc}  unit="%"     icon={<Target   size={18}/>} accentColor="var(--accent-purple)" delay={80}  />
        <MetricCard title="Best WPM"     value={stats.bestWpm} unit="wpm"   icon={<Zap      size={18}/>} accentColor="var(--accent-amber)"  delay={160} />
        <MetricCard title="Sessions"     value={stats.sessions} unit="total" icon={<Clock    size={18}/>} accentColor="var(--accent-red)"    delay={240} />
      </div>

      {/* ── Intelligence Profile (full card) ─────────────────────────── */}
      <div className="glass-panel animate-slideUp" style={sty.intelCard}>
        <div style={sty.intelHeader}>
          <span style={{ fontSize: '1.4rem' }}>{intel.icon}</span>
          <div>
            <h2 style={{ ...sty.intelTitle, color: intel.color }}>{intel.archetype}</h2>
            <p style={sty.intelDesc}>{intel.description}</p>
          </div>
          <div style={sty.intelGamesPlayed}>
            <span style={sty.intelGamesNum}>{intel.gamesPlayed}</span>
            <span style={sty.intelGamesLabel}>games played</span>
          </div>
        </div>

        {intel.isNewPlayer ? (
          <div style={sty.intelEmpty}>
            <p>Complete the <strong>Skill Test</strong> and at least 2 mini-games to unlock your full Intelligence Profile.</p>
            <div style={sty.intelEmptyBtns}>
              <button style={sty.intelBtn} onClick={() => onNavigate('Skill Test')}>Go to Skill Test →</button>
              <button style={{ ...sty.intelBtn, color: 'var(--accent-amber)' }} onClick={() => onNavigate('Games')}>Play Games →</button>
            </div>
          </div>
        ) : (
          <div style={sty.traitBars}>
            {intel.traits.map(t => (
              <div key={t.name} style={sty.traitRow}>
                <span style={sty.traitName}>{t.name}</span>
                <div style={sty.traitTrack}>
                  <div style={{
                    ...sty.traitFill,
                    width: `${t.value}%`,
                    background: t.color,
                    boxShadow : `0 0 8px ${t.color}55`,
                    transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <span style={{ ...sty.traitPct, color: t.color }}>{t.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom Grid ─────────────────────────────────────────────────── */}
      <div style={sty.bottomGrid}>

        {/* Recent Activity */}
        <div className="glass-panel animate-slideUp" style={{ ...sty.panel, animationDelay: '0.2s' }}>
          <div style={sty.panelHeader}>
            <TrendingUp size={18} color="var(--accent-teal)" />
            <h2 style={sty.panelTitle}>Recent Activity</h2>
          </div>
          <hr className="divider" />
          {recentSessions.length === 0 ? (
            <div style={sty.emptyState}>
              <span style={{ fontSize: '2rem' }}>📋</span>
              <p>No sessions yet. Take your first test!</p>
              <button style={sty.emptyBtn} onClick={() => onNavigate('Skill Test')}>Start now →</button>
            </div>
          ) : (
            <div style={sty.sessionList}>
              {recentSessions.map((s, i) => {
                const acc     = typeof s.accuracy === 'number' ? (s.accuracy <= 1 ? Math.round(s.accuracy * 100) : Math.round(s.accuracy)) : 0;
                const label   = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const wpmPct  = Math.min(100, (s.wpm / 150) * 100);
                return (
                  <div key={i} style={sty.sessionRow}>
                    <div style={sty.sessionLeft}>
                      <span style={sty.sessionDate}>{label}</span>
                      <span className="badge badge-teal" style={{ fontSize: '0.68rem' }}>{s.skillLevel || 'N/A'}</span>
                    </div>
                    <div style={sty.sessionRight}>
                      <div style={sty.sessionStats}>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>{s.wpm} WPM</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{acc}% acc</span>
                      </div>
                      <div style={sty.wpmBar}>
                        <div style={{ ...sty.wpmBarFill, width: `${wpmPct}%`, background: 'linear-gradient(90deg,var(--accent-teal),var(--accent-purple))', transition: `width 0.8s ${i*100}ms ease` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="glass-panel animate-slideUp" style={{ ...sty.panel, animationDelay: '0.35s' }}>
          <div style={sty.panelHeader}>
            <Trophy size={18} color="var(--accent-amber)" />
            <h2 style={sty.panelTitle}>Achievements</h2>
            <span style={{ marginLeft: 'auto', ...sty.achCount }}>{achievements.length} / {Object.keys(ACH_META).length}</span>
          </div>
          <hr className="divider" />
          {unlockedAch.length === 0 ? (
            <div style={sty.emptyState}>
              <span style={{ fontSize: '2rem' }}>🏅</span>
              <p>Complete tests to unlock achievements</p>
            </div>
          ) : (
            <div style={sty.achGrid}>
              {unlockedAch.map((ach, i) => (
                <div key={i} className="glass-panel" style={{ ...sty.achBadge, borderColor: ach.color + '55' }}>
                  <span style={{ fontSize: '1.8rem' }}>{ach.emoji}</span>
                  <span style={{ ...sty.achLabel, color: ach.color }}>{ach.label}</span>
                </div>
              ))}
            </div>
          )}
          {achievements.length > 0 && (
            <button style={sty.viewAllBtn} onClick={() => onNavigate('Profile')}>
              <Award size={14} /> View all achievements →
            </button>
          )}
        </div>

        {/* Performance Gauges */}
        <div className="glass-panel animate-slideUp" style={{ ...sty.panel, animationDelay: '0.5s' }}>
          <div style={sty.panelHeader}>
            <Zap size={18} color="var(--accent-purple)" />
            <h2 style={sty.panelTitle}>Performance Gauges</h2>
          </div>
          <hr className="divider" />
          <div style={sty.gaugesRow}>
            <AnimatedGauge value={stats.avgWpm  > 0 ? Math.min(100, Math.round((stats.avgWpm/150)*100)) : 0} label="Speed"    unit="WPM" color="var(--accent-teal)"   size={110} strokeWidth={8} />
            <AnimatedGauge value={stats.avgAcc  || 0}                                                        label="Accuracy" unit="%"   color="var(--accent-purple)" size={110} strokeWidth={8} />
            <AnimatedGauge value={stats.sessions > 0 ? Math.min(100, stats.sessions * 5) : 0}               label="Practice" unit="xp"  color="var(--accent-amber)"  size={110} strokeWidth={8} />
          </div>
          <p style={sty.gaugeNote}>Speed gauge normalised to 150 WPM. Practice XP: 5 pts / session.</p>
        </div>

      </div>

      {/* ── Trusted by Schools Section ───────────────────────────────── */}
      <div style={sty.trustedSection}>
        <h2 style={sty.sectionTitle}>Trusted by Classroom Educators</h2>
        <div style={sty.testimonialGrid}>
          <div className="glass-panel" style={sty.testCard}>
            <p style={sty.testQuote}>"TypeMaster has completely transformed my computer science lab. The progress dashboards make monitoring and grading tests a breeze!"</p>
            <span style={sty.testAuthor}>— Mr. Henderson, IT Coordinator, Oakridge</span>
          </div>
          <div className="glass-panel" style={sty.testCard}>
            <p style={sty.testQuote}>"Our students love the Arcade games, and I love that their speed profiles sync automatically. The trial and license pricing fits our budget."</p>
            <span style={sty.testAuthor}>— Mrs. Davis, Typing Instructor, Grade 7</span>
          </div>
        </div>
      </div>

      {/* ── FAQ Section ─────────────────────────────────────────────── */}
      <div className="glass-panel" style={sty.faqCard}>
        <h2 style={sty.faqHeading}>Frequently Asked Questions</h2>
        <div style={sty.faqList}>
          {faqs.map((faq, i) => (
            <div key={i} style={sty.faqItem}>
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={sty.faqQuestion}
              >
                <span>{faq.q}</span>
                <span style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
              </button>
              {openFaq === i && (
                <p style={sty.faqAnswer}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────────── */
const sty = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.75rem' },

  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5rem 3rem', gap: '2rem', flexWrap: 'wrap' },
  heroLeft: { flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  heroRight: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  greetingRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  greetingLabel: { fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 },
  heroName: { fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em' },
  heroSub: { color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 },
  heroCTA: { display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.75rem',
    background: 'var(--accent-purple)', color: '#fff', borderRadius: 'var(--radius-full)',
    fontWeight: 700, fontSize: '0.95rem', boxShadow: 'var(--glow-purple)', border: 'none', cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.2s',
  },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.75rem',
    background: 'transparent', color: 'var(--text-primary)',
    border: '1px solid var(--glass-border-highlight)', borderRadius: 'var(--radius-full)',
    fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s',
  },

  /* Archetype badge in hero */
  archetypeBadge: {
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    padding: '1.1rem 1.5rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid',
    borderRadius: 'var(--radius-lg)',
    minWidth: '220px',
  },
  archetypeIcon: { fontSize: '2.5rem', flexShrink: 0 },
  archetypeName: { fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' },
  archetypeHint: { fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.2rem' },

  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1.25rem' },

  /* Intelligence Profile card */
  intelCard: { padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  intelHeader: { display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' },
  intelTitle: { fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 },
  intelDesc: { fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: '480px', marginTop: '0.2rem' },
  intelGamesPlayed: { marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 },
  intelGamesNum: { fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' },
  intelGamesLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  intelEmpty: { display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 },
  intelEmptyBtns: { display: 'flex', gap: '1.5rem' },
  intelBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '0.9rem', padding: 0 },

  traitBars: { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  traitRow: { display: 'flex', alignItems: 'center', gap: '0.85rem' },
  traitName: { width: '78px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 },
  traitTrack: { flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' },
  traitFill: { height: '100%', borderRadius: '3px' },
  traitPct: { width: '32px', fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', flexShrink: 0 },

  bottomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem', alignItems: 'start' },
  panel: { padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  panelHeader: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  panelTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' },

  sessionList: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  sessionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  sessionLeft: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 },
  sessionDate: { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 },
  sessionRight: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  sessionStats: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  wpmBar: { height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' },
  wpmBarFill: { height: '100%', borderRadius: '2px' },

  achGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  achBadge: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid' },
  achLabel: { fontSize: '0.8rem', fontWeight: 600 },
  achCount: { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 },
  viewAllBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-amber)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.5rem', padding: 0 },

  gaugesRow: { display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0' },
  gaugeNote: { fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' },
  emptyBtn: { marginTop: '0.25rem', background: 'none', border: 'none', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
  
  schoolHero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3rem', gap: '2rem', flexWrap: 'wrap', background: 'rgba(127,119,221,0.03)', border: '1px solid rgba(127,119,221,0.15)' },
  schoolHeroContent: { flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' },
  schoolHeroTitle: { fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.04em', margin: '0 0 10px 0' },
  schoolHeroDesc: { fontSize: '1.3rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0', maxWidth: '580px' },
  
  studentHero: { padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)' },
  
  trustedSection: { display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' },
  sectionTitle: { fontSize: '1.8rem', fontWeight: 800, color: 'white', textAlign: 'center', letterSpacing: '-0.03em' },
  testimonialGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' },
  testCard: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--accent-teal)' },
  testQuote: { fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 },
  testAuthor: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-teal)', textAlign: 'right' },
  
  faqCard: { padding: '24px 28px', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  faqHeading: { fontSize: '1.8rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', margin: 0 },
  faqList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  faqItem: { borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' },
  faqQuestion: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 0', background: 'none', border: 'none', color: 'white', fontSize: '1.3rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' },
  faqAnswer: { fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '8px 0 0 0', paddingLeft: '4px' }
};

export default Home;

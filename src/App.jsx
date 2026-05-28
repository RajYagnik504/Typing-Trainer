import React, { lazy, Suspense, useState } from 'react';
import Navbar from './components/Navbar';
import { useAppContext } from './context/AppContext';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
const Home = lazy(() => import('./pages/Home'));
const SkillTest = lazy(() => import('./pages/SkillTest'));
const Games = lazy(() => import('./pages/Games'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));
const BlindTypingAcademy = lazy(() => import('./pages/BlindTypingAcademy'));
const TeacherPortal = lazy(() => import('./pages/TeacherPortal'));

const Loader = () => (
  <div style={styles.loaderWrap}>
    <div style={styles.spinner}></div>
    <span style={styles.loaderText}>LOADING COGNITIVE CORE...</span>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  const [currentTab, setCurrentTab] = useState('Home');
  const { settings } = useAppContext();

  const renderTab = () => {
    switch (currentTab) {
      case 'Home': return <Home onNavigate={setCurrentTab} />;
      case 'Skill Test': return <SkillTest />;
      case 'Games': return <Games />;
      case 'Leaderboard': return <Leaderboard />;
      case 'Profile': return <Profile />;
      case 'Academy': return <BlindTypingAcademy />;
      case 'Teacher Portal': return <TeacherPortal />;
      default: return <Home onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container" style={styles.container}>
      {/* Background visual effects based on performance mode */}
      {settings.performanceMode !== 'Minimal' && (
        <>
          <div style={styles.glowOrb1}></div>
          <div style={styles.glowOrb2}></div>
        </>
      )}
      
      <ScrollToTop currentTab={currentTab} />
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <main style={styles.mainContent}>
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            {renderTab()}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    paddingBottom: '80px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    zIndex: 1,
    position: 'relative',
  },
  glowOrb1: {
    position: 'fixed',
    top: '-20%',
    left: '-10%',
    width: '50vw',
    height: '50vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(127, 119, 221, 0.1) 0%, rgba(10, 10, 12, 0) 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  glowOrb2: {
    position: 'fixed',
    bottom: '-20%',
    right: '-10%',
    width: '60vw',
    height: '60vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(29, 158, 117, 0.05) 0%, rgba(10, 10, 12, 0) 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  loaderWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(127, 119, 221, 0.1)',
    borderTop: '4px solid var(--accent-purple)',
    borderRadius: '50%',
  },
  loaderText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    letterSpacing: '0.05em',
  }
};

export default App;

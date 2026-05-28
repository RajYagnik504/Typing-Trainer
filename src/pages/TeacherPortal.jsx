import React, { useEffect, useState } from 'react';
import { Users, BarChart3, Settings, AlertCircle, ShieldCheck } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

// Loading Spinner component
const LoadingSpinner = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#050810', gap: '1rem'
  }}>
    <div style={{
      width: '40px', height: '40px', border: '4px solid rgba(127, 119, 221, 0.1)',
      borderTop: '4px solid var(--accent-purple)', borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LOADING COGNITIVE CORE...</span>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Authenticated Teacher Dashboard sub-component
const TeacherDashboard = ({ teacher, students, sessions, handleSignOut }) => {
  if (!teacher) return <LoadingSpinner />;
  
  return (
    <div className="teacher-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      
      {/* Inline Styles injection */}
      <style>{`
        .teacher-portal,
        .teacher-dashboard,
        .teacher-container {
          min-height: 100vh !important;
          height: auto !important;
          overflow-y: auto !important;
          background: #050810 !important;
          color: #e8e6ff !important;
          padding-bottom: 80px !important;
        }

        .teacher-portal h1,
        .teacher-portal h2,
        .teacher-portal h3,
        .teacher-dashboard h1,
        .teacher-dashboard h2,
        .teacher-dashboard h3 {
          color: #ffffff !important;
        }

        .teacher-portal p,
        .teacher-portal span,
        .teacher-portal label,
        .teacher-dashboard p,
        .teacher-dashboard span,
        .teacher-dashboard label {
          color: #e8e6ff !important;
        }

        .teacher-portal input,
        .teacher-portal select,
        .teacher-portal textarea {
          background: rgba(255,255,255,0.06) !important;
          color: #e8e6ff !important;
          border: 1px solid rgba(127,119,221,0.3) !important;
          border-radius: 8px !important;
        }
      `}</style>

      {/* Roster Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="var(--accent-teal)" />
            Classroom Dashboard
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Welcome, {teacher?.name || 'Teacher'}! Monitor student progress, analyze typing metrics, and manage assignments.
          </p>
        </div>
        <button 
          onClick={handleSignOut}
          style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Metric summary boxes */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Students</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>24</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Class WPM</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>42.5</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Accuracy</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>94%</p>
        </div>
      </div>
      
      {/* Null checks on students maps */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Enrolled Student Roster</h3>
        {students && students.length > 0 ? (
          students.map((s, index) => (
            <div key={index} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
              {s?.name} - Average WPM: {s?.wpm}
            </div>
          ))
        ) : (
          <div style={{ color: '#8890b0', padding: '20px', textAlign: 'center', fontSize: '14px' }}>
            No students yet. Add your first student to get started.
          </div>
        )}
      </div>

      {/* Null checks on sessions maps */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Recent Practice Sessions</h3>
        {sessions && sessions.length > 0 ? (
          sessions.map((sess, index) => (
            <div key={index} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
              {sess?.studentName} logged {sess?.wpm} WPM on Level {sess?.level}
            </div>
          ))
        ) : (
          <div style={{ color: '#8890b0', padding: '20px', textAlign: 'center', fontSize: '14px' }}>
            No recent activity logged in this classroom.
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <BarChart3 size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
        <h3>Detailed Analytics Hub</h3>
        <p>Full student analytics and reporting modules are currently being migrated to the new React architecture.</p>
      </div>
    </div>
  );
};

const TeacherPortal = () => {
  const [teacher, setTeacher] = useState(undefined); // starts undefined for loading state
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  
  // Data lists tracking state for students, sessions, classrooms
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    console.log('TeacherPortal mounted, teacher state:', teacher);
    const saved = localStorage.getItem('teacher_session');
    if (saved) {
      try {
        setTeacher(JSON.parse(saved));
      } catch (e) {
        setTeacher(null);
      }
    } else {
      setTeacher(null);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const EDUCATOR_PASSCODE = 'Raj504';
    
    if (passcode !== EDUCATOR_PASSCODE) {
      setError('Invalid educator passcode');
      return;
    }
    
    const newTeacher = { name: 'Demo Teacher', role: 'teacher', loggedIn: true };
    localStorage.setItem('teacher_session', JSON.stringify(newTeacher));
    setTeacher(newTeacher);
    setError('');
  };

  const handleSignOut = () => {
    localStorage.removeItem('teacher_session');
    setTeacher(null);
  };

  if (teacher === undefined) {
    return <LoadingSpinner />;
  }

  if (!teacher) {
    return (
      <div className="teacher-portal" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#050810', color: '#e8e6ff', gap: '20px',
        fontFamily: 'Rajdhani, sans-serif', padding: '40px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '52px' }}>👩‍🏫</div>
        <div style={{ fontSize: '24px', fontFamily: 'Orbitron, monospace', color: '#7F77DD' }}>
          Teacher Portal
        </div>
        <div style={{ fontSize: '14px', color: '#8890b0', marginBottom: '1.5rem' }}>
          Register or log in to access your dashboard.
        </div>

        {/* Access Login Form */}
        <div className="glass-panel animate-fadeIn" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--accent-teal)" style={{ marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }} />
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 800, color: 'white' }}>Educator Access</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Enter your secure passcode to access classroom analytics and student progress tracking.
          </p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              placeholder="Enter Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><AlertCircle size={14} />{error}</div>}
            <button 
              type="submit"
              style={{
                padding: '0.8rem',
                background: 'var(--accent-teal)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: 'var(--glow-teal)'
              }}
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <TeacherDashboard
      teacher={teacher}
      students={students}
      sessions={sessions}
      handleSignOut={handleSignOut}
    />
  );
};

export default function TeacherPortalWithBoundary(props) {
  return (
    <ErrorBoundary>
      <TeacherPortal {...props} />
    </ErrorBoundary>
  );
}

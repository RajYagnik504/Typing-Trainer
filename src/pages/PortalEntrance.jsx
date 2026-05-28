import React, { useState, useEffect } from 'react';
import { 
  School, 
  User, 
  GraduationCap, 
  Copy, 
  Check, 
  LogOut, 
  ArrowRight, 
  BookOpen, 
  Activity, 
  Trophy, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { 
  saveStudent, 
  saveTeacher, 
  getStudent, 
  getTeacher, 
  generateClassroomCode, 
  isValidClassroomCode, 
  clearPortalSession 
} from '../utils/portalManager';

export default function PortalEntrance() {
  const [activeMode, setActiveMode] = useState('student'); // 'student' or 'teacher'
  const [studentName, setStudentName] = useState('');
  const [classroomCode, setClassroomCode] = useState('');
  const [studentError, setStudentError] = useState('');
  const [currentStudent, setCurrentStudent] = useState(null);

  const [teacherName, setTeacherName] = useState('');
  const [classroomName, setClassroomName] = useState('');
  const [teacherPasscode, setTeacherPasscode] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);
  
  const [copied, setCopied] = useState(false);
  const [joinedStudents, setJoinedStudents] = useState([]);

  // Load existing sessions on mount
  useEffect(() => {
    try {
      const student = getStudent();
      if (student) {
        setCurrentStudent(student);
      }
      
      const teacher = getTeacher();
      if (teacher) {
        setCurrentTeacher(teacher);
      }

      // Load all students registered in this browser
      const storedStudents = localStorage.getItem('tc_classroom_students');
      if (storedStudents) {
        setJoinedStudents(JSON.parse(storedStudents));
      }
    } catch (e) {
      console.error("Failed to load portal sessions on mount", e);
    }
  }, []);

  const handleStudentJoin = (e) => {
    e.preventDefault();
    setStudentError('');

    if (!studentName.trim()) {
      setStudentError('Please enter your name.');
      return;
    }
    if (!classroomCode.trim()) {
      setStudentError('Please enter a classroom code.');
      return;
    }
    if (!isValidClassroomCode(classroomCode)) {
      setStudentError('Invalid classroom code format. Must be TC-XXXX (e.g. TC-1234)');
      return;
    }

    try {
      const formattedCode = classroomCode.trim().toUpperCase();
      saveStudent(studentName.trim(), formattedCode);
      const studentObj = { 
        name: studentName.trim(), 
        classroomCode: formattedCode, 
        joinedAt: Date.now() 
      };
      
      // Save student to the global browser list for teacher dashboard visibility
      const storedStudents = localStorage.getItem('tc_classroom_students');
      const studentList = storedStudents ? JSON.parse(storedStudents) : [];
      if (!studentList.some(s => s.name.toLowerCase() === studentObj.name.toLowerCase() && s.classroomCode === studentObj.classroomCode)) {
        studentList.push(studentObj);
        localStorage.setItem('tc_classroom_students', JSON.stringify(studentList));
        setJoinedStudents(studentList);
      }
      
      setCurrentStudent(studentObj);
      setStudentName('');
      setClassroomCode('');
    } catch (err) {
      setStudentError('Failed to save student session. Please try again.');
    }
  };

  const handleTeacherRegister = (e) => {
    e.preventDefault();
    setTeacherError('');

    if (!teacherName.trim()) {
      setTeacherError('Please enter your name.');
      return;
    }
    if (!classroomName.trim()) {
      setTeacherError('Please enter a classroom name.');
      return;
    }
    if (teacherPasscode !== 'Raj504') {
      setTeacherError('Invalid educator passcode.');
      return;
    }

    try {
      const generatedCode = generateClassroomCode();
      saveTeacher(teacherName.trim(), classroomName.trim(), generatedCode);
      const teacherObj = {
        name: teacherName.trim(),
        classroomName: classroomName.trim(),
        classroomCode: generatedCode,
        createdAt: Date.now()
      };
      setCurrentTeacher(teacherObj);
      setTeacherName('');
      setClassroomName('');
      setTeacherPasscode('');
    } catch (err) {
      setTeacherError('Failed to register teacher session. Please try again.');
    }
  };

  const handleCopyCode = () => {
    if (!currentTeacher) return;
    try {
      navigator.clipboard.writeText(currentTeacher.classroomCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    try {
      clearPortalSession();
      setCurrentStudent(null);
      setCurrentTeacher(null);
    } catch (e) {}
  };

  const getFilteredStudents = () => {
    if (!currentTeacher) return [];
    return joinedStudents.filter(
      (s) => s.classroomCode === currentTeacher.classroomCode
    );
  };

  return (
    <div className="portal-entrance" style={styles.pageWrapper}>
      {/* Visual Header */}
      <header style={styles.header}>
        <div style={styles.iconContainer}>
          <School size={28} color="var(--accent-purple)" />
        </div>
        <h1 style={styles.title} className="text-gradient-purple">TypeCraft Academy Portal</h1>
        <p style={styles.subtitle}>Connect typing achievements directly to your educator dashboard</p>
      </header>

      {/* Main Panel */}
      <div style={styles.mainContent}>
        
        {/* Logged in States */}
        {currentStudent && (
          <div className="glass-panel" style={styles.card}>
            <div style={styles.statusHeader}>
              <span className="badge badge-teal">Student Account Active</span>
              <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
            
            <div style={styles.badgeLarge}>🎓</div>
            <h2 style={styles.cardTitle}>Welcome back, {currentStudent.name}!</h2>
            <p style={styles.cardDesc}>You have joined classroom</p>
            
            <div style={styles.codeContainer}>
              <span style={styles.classroomLabel}>CLASSROOM CODE</span>
              <span style={styles.classroomCodeVal}>{currentStudent.classroomCode}</span>
            </div>

            <div style={styles.infoAlert}>
              <BookOpen size={16} color="var(--accent-purple)" />
              <span>Your practice speeds (WPM) and accuracy scores will be accessible to your instructor.</span>
            </div>
          </div>
        )}

        {currentTeacher && !currentStudent && (
          <div className="glass-panel animate-fadeIn" style={{ ...styles.card, maxWidth: '650px' }}>
            <div style={styles.statusHeader}>
              <span className="badge badge-purple">Educator Account Active</span>
              <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            <h2 style={{ ...styles.cardTitle, textAlign: 'left', marginTop: '1rem' }}>
              👩‍🏫 {currentTeacher.classroomName}
            </h2>
            <p style={{ ...styles.cardDesc, textAlign: 'left', marginBottom: '1.5rem' }}>
              Instructor: {currentTeacher.name}
            </p>

            <div style={styles.teacherDashboardGrid}>
              
              {/* Classroom Code Area */}
              <div style={styles.codeShareCard}>
                <span style={styles.shareLabel}>SHARE CODE WITH STUDENTS</span>
                <div style={styles.largeCodeBox}>
                  <span style={styles.largeCode}>{currentTeacher.classroomCode}</span>
                  <button onClick={handleCopyCode} style={styles.copyBtn} title="Copy Code">
                    {copied ? <Check size={18} color="var(--accent-teal)" /> : <Copy size={18} />}
                  </button>
                </div>
                <span style={styles.copyTooltip}>
                  {copied ? 'Copied code to clipboard!' : 'Click the icon to copy code'}
                </span>
              </div>

              {/* Roster Area */}
              <div style={styles.rosterCard}>
                <h3 style={styles.rosterTitle}>Enrolled Students ({getFilteredStudents().length})</h3>
                <div style={styles.studentListScroll}>
                  {getFilteredStudents().length > 0 ? (
                    getFilteredStudents().map((student, idx) => (
                      <div key={idx} style={styles.studentRow}>
                        <div style={styles.studentInfo}>
                          <User size={14} color="var(--text-secondary)" />
                          <span style={styles.studentNameText}>{student.name}</span>
                        </div>
                        <span style={styles.studentTime}>
                          Joined {new Date(student.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyRoster}>
                      <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📋</span>
                      <span>No students have joined yet.</span>
                      <p style={styles.rosterTip}>
                        Students must enter code <strong style={{ color: 'var(--accent-teal)' }}>{currentTeacher.classroomCode}</strong> in Student Access.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Logged out: Selector & Forms */}
        {!currentStudent && !currentTeacher && (
          <div style={styles.flowContainer}>
            {/* Toggle Modes */}
            <div style={styles.toggleContainer}>
              <button 
                onClick={() => { setActiveMode('student'); setStudentError(''); }}
                style={{
                  ...styles.toggleBtn,
                  color: activeMode === 'student' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: activeMode === 'student' ? 'rgba(127,119,221,0.12)' : 'transparent',
                  border: activeMode === 'student' ? '1px solid rgba(127,119,221,0.3)' : '1px solid transparent',
                  boxShadow: activeMode === 'student' ? 'var(--glow-purple)' : 'none'
                }}
              >
                <GraduationCap size={16} />
                <span>Student Access</span>
              </button>
              <button 
                onClick={() => { setActiveMode('teacher'); setTeacherError(''); }}
                style={{
                  ...styles.toggleBtn,
                  color: activeMode === 'teacher' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: activeMode === 'teacher' ? 'rgba(29,158,117,0.12)' : 'transparent',
                  border: activeMode === 'teacher' ? '1px solid rgba(29,158,117,0.3)' : '1px solid transparent',
                  boxShadow: activeMode === 'teacher' ? 'var(--glow-teal)' : 'none'
                }}
              >
                <ShieldCheck size={16} />
                <span>Teacher Portal</span>
              </button>
            </div>

            {/* Student Form */}
            {activeMode === 'student' && (
              <div className="glass-panel animate-fadeIn" style={styles.card}>
                <h2 style={styles.cardHeading}>Join Your Classroom</h2>
                <p style={styles.cardIntro}>Enter your name and the classroom code provided by your teacher to synchronize metrics.</p>

                <form onSubmit={handleStudentJoin} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Your Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Alex Smith"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Classroom Code</label>
                    <input 
                      type="text"
                      placeholder="TC-XXXX"
                      value={classroomCode}
                      onChange={(e) => setClassroomCode(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  {studentError && (
                    <div style={styles.errorDiv}>
                      <AlertCircle size={14} />
                      <span>{studentError}</span>
                    </div>
                  )}

                  <button type="submit" style={{ ...styles.submitBtn, background: 'var(--accent-purple)', boxShadow: 'var(--glow-purple)' }}>
                    <span>Join Classroom</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            )}

            {activeMode === 'teacher' && (
              <div className="glass-panel animate-fadeIn" style={styles.card}>
                <h2 style={styles.cardHeading}>Create Classroom</h2>
                <p style={styles.cardIntro}>Set up an educator console to track student progress, verify level completion, and review typing stats.</p>

                <form onSubmit={handleTeacherRegister} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Educator Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Mrs. Davis"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Classroom Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Grade 9 Typing Lab"
                      value={classroomName}
                      onChange={(e) => setClassroomName(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Educator Passcode</label>
                    <input 
                      type="password"
                      placeholder="Enter passkey"
                      value={teacherPasscode}
                      onChange={(e) => setTeacherPasscode(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  {teacherError && (
                    <div style={styles.errorDiv}>
                      <AlertCircle size={14} />
                      <span>{teacherError}</span>
                    </div>
                  )}

                  <button type="submit" style={{ ...styles.submitBtn, background: 'var(--accent-teal)', boxShadow: 'var(--glow-teal)' }}>
                    <span>Register Classroom</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px 20px',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  iconContainer: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    background: 'rgba(127,119,221,0.12)',
    border: '1px solid rgba(127,119,221,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  },
  title: {
    margin: 0,
    fontSize: '2.2rem',
    fontWeight: 800,
    letterSpacing: '-0.03em'
  },
  subtitle: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '1.2rem',
    maxWidth: '500px'
  },
  mainContent: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  flowContainer: {
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  toggleContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    background: 'rgba(255,255,255,0.03)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)'
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '8px 12px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '1.2rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '24px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column'
  },
  cardHeading: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'white'
  },
  cardIntro: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.2rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  label: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  input: {
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1.3rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box'
  },
  errorDiv: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--accent-red)',
    fontSize: '1.1rem',
    background: 'rgba(226,75,74,0.08)',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(226,75,74,0.2)'
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '10px 16px',
    borderRadius: '8px',
    color: 'white',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.3rem',
    transition: 'transform 0.2s',
    marginTop: '0.5rem'
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '12px',
    marginBottom: '16px'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background 0.2s'
  },
  badgeLarge: {
    fontSize: '3rem',
    textAlign: 'center',
    margin: '1rem 0 0.5rem 0'
  },
  cardTitle: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.8rem',
    fontWeight: 800,
    textAlign: 'center',
    color: 'white'
  },
  cardDesc: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.2rem',
    color: 'var(--text-secondary)',
    textAlign: 'center'
  },
  codeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed var(--accent-teal)',
    padding: '1rem',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    boxShadow: 'inset 0 0 10px rgba(29, 158, 117, 0.05)'
  },
  classroomLabel: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--accent-teal)',
    letterSpacing: '0.08em',
    marginBottom: '4px'
  },
  classroomCodeVal: {
    fontSize: '2.2rem',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    color: 'white',
    letterSpacing: '0.05em'
  },
  infoAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    background: 'rgba(127,119,221,0.06)',
    border: '1px solid rgba(127,119,221,0.15)',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '1.15rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },
  teacherDashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
    width: '100%'
  },
  codeShareCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(127, 119, 221, 0.04)',
    border: '1px solid rgba(127, 119, 221, 0.15)',
    borderRadius: '10px',
    padding: '1.5rem'
  },
  shareLabel: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--accent-purple)',
    letterSpacing: '0.08em',
    marginBottom: '8px'
  },
  largeCodeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px'
  },
  largeCode: {
    fontSize: '2.5rem',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    color: 'white',
    letterSpacing: '0.05em'
  },
  copyBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--glass-border)',
    color: 'white',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  copyTooltip: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)'
  },
  rosterCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    borderRadius: '10px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  rosterTitle: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'white',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '8px'
  },
  studentListScroll: {
    maxHeight: '180px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '4px'
  },
  studentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.15)',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.02)'
  },
  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  studentNameText: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: 'white'
  },
  studentTime: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)'
  },
  emptyRoster: {
    padding: '24px 12px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '1.15rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  rosterTip: {
    margin: '8px 0 0 0',
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4'
  }
};

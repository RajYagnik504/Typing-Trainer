import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Building2, MessageSquare, Send } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [studentsCount, setStudentsCount] = useState('1-50');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmitInquiry = (e) => {
    e.preventDefault();
    setStatus('');
    setError('');

    if (!name.trim() || !institution.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const newInquiry = {
        name: name.trim(),
        institution: institution.trim(),
        email: email.trim(),
        studentsCount,
        message: message.trim(),
        timestamp: Date.now()
      };

      const existing = localStorage.getItem('tc_inquiries');
      const inquiryList = existing ? JSON.parse(existing) : [];
      inquiryList.push(newInquiry);
      localStorage.setItem('tc_inquiries', JSON.stringify(inquiryList));

      setStatus('Inquiry sent successfully! Our institution representative will reach out to you within 24 hours.');
      setName('');
      setInstitution('');
      setEmail('');
      setStudentsCount('1-50');
      setMessage('');
    } catch (err) {
      setError('Failed to submit your inquiry. Please try again.');
    }
  };

  return (
    <div style={styles.container} className="animate-fadeIn">
      <header style={styles.header}>
        <div style={styles.iconWrap}>
          <Mail size={24} color="var(--accent-teal)" />
        </div>
        <h1 style={styles.title} className="text-gradient-purple">Contact School Sales</h1>
        <p style={styles.subtitle}>Get in touch to request bulk licenses, custom pricing quotes, or a demonstration of the educator dashboard.</p>
      </header>

      <div style={styles.layoutGrid}>
        
        {/* Contact Form Card */}
        <div className="glass-panel" style={styles.formCard}>
          <h2 style={styles.cardTitle}>Send Institutional Inquiry</h2>
          <p style={styles.cardSubtitle}>Fields marked with * are required</p>

          <form onSubmit={handleSubmitInquiry} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Your Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Principal Rogers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Institution Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Oakridge High School"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>School Email Address *</label>
                <input 
                  type="email" 
                  placeholder="e.g. administration@oakridge.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Estimated Student Accounts</label>
                <select 
                  value={studentsCount}
                  onChange={(e) => setStudentsCount(e.target.value)}
                  style={styles.select}
                >
                  <option value="1-50">1 - 50 Students</option>
                  <option value="51-200">51 - 200 Students</option>
                  <option value="201-500">201 - 500 Students</option>
                  <option value="500+">500+ Students</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Your Message *</label>
              <textarea 
                rows="4"
                placeholder="Details of your request (e.g. custom integrations, budget requirements, trial expansion requests...)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={styles.textarea}
              />
            </div>

            {error && (
              <div style={styles.errorDiv}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {status && (
              <div style={styles.successDiv}>
                <Check size={16} />
                <span>{status}</span>
              </div>
            )}

            <button type="submit" style={styles.submitBtn}>
              <Send size={14} />
              <span>Submit Inquiry</span>
            </button>
          </form>
        </div>

        {/* Informative Side Cards */}
        <div style={styles.sideInfoGrid}>
          
          <div className="glass-panel" style={styles.infoCard}>
            <div style={styles.infoIconWrap}>
              <Building2 size={20} color="var(--accent-purple)" />
            </div>
            <h3 style={styles.infoTitle}>Bulk School Licenses</h3>
            <p style={styles.infoDesc}>We offer scalable subscription models for school systems and entire school districts with single sign-on (SSO) options.</p>
          </div>

          <div className="glass-panel" style={styles.infoCard}>
            <div style={styles.infoIconWrap}>
              <MessageSquare size={20} color="var(--accent-amber)" />
            </div>
            <h3 style={styles.infoTitle}>Dedicated Onboarding</h3>
            <p style={styles.infoDesc}>Every institutional customer gets assigned a support lead to guide curriculum setting, classroom code generation, and setup.</p>
          </div>

        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    padding: '20px 10px',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(29,158,117,0.08)',
    border: '1px solid rgba(29,158,117,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.03em'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: '520px',
    lineHeight: '1.4'
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '960px',
    alignItems: 'start'
  },
  formCard: {
    padding: '30px 24px',
    borderRadius: 'var(--radius-lg)',
    boxSizing: 'border-box'
  },
  cardTitle: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'white',
    margin: '0 0 4px 0'
  },
  cardSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    margin: '0 0 1.5rem 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    flexWrap: 'wrap'
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
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--glass-border)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '1.25rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  select: {
    padding: '10px 12px',
    background: 'rgba(26,26,31,0.95)',
    border: '1px solid var(--glass-border)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '1.25rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  textarea: {
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--glass-border)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '1.25rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'var(--accent-teal)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '1.25rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    boxShadow: 'var(--glow-teal)',
    marginTop: '0.5rem'
  },
  successDiv: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    color: 'var(--accent-teal)',
    fontSize: '1.15rem',
    background: 'rgba(29,158,117,0.08)',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid rgba(29,158,117,0.2)',
    lineHeight: '1.4'
  },
  errorDiv: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--accent-red)',
    fontSize: '1.15rem',
    background: 'rgba(226,75,74,0.08)',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid rgba(226,75,74,0.2)'
  },
  sideInfoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  infoCard: {
    padding: '20px 24px',
    borderRadius: 'var(--radius-lg)',
    boxSizing: 'border-box'
  },
  infoIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem'
  },
  infoTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'white',
    margin: '0 0 0.5rem 0'
  },
  infoDesc: {
    fontSize: '1.15rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    margin: 0
  }
};

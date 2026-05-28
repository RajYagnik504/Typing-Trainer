import React, { useState, useEffect } from 'react';
import { getTrialTimeLeftMs, formatTimeLeft, isTrialExpired, isFullAccess, unlockOwner } from '../utils/trialManager';
import { openRazorpay } from '../utils/razorpay';

export default function SubscriptionWall({ onUnlocked }) {
  const [timeLeft, setTimeLeft] = useState(getTrialTimeLeftMs());
  const [expired, setExpired] = useState(isTrialExpired());
  const [secretInput, setSecretInput] = useState('');
  const [shake, setShake] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    if (isFullAccess()) { onUnlocked(); return; }
    const interval = setInterval(() => {
      const left = getTrialTimeLeftMs();
      setTimeLeft(left);
      if (left <= 0) { setExpired(true); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleSecretSubmit(e) {
    e.preventDefault();
    // Secret owner check — input is disguised as "Session Key"
    if (secretInput === '@Monday504') {
      unlockOwner();
      onUnlocked();
    } else {
      setShake(true);
      setSecretInput('');
      setTimeout(() => setShake(false), 600);
    }
  }

  if (!expired) {
    return (
      <div style={{
        position: 'fixed', top: 0, right: 0, zIndex: 9999,
        background: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(127,119,221,0.3)', borderRadius: '12px',
        padding: '10px 16px', margin: '16px', display: 'flex',
        alignItems: 'center', gap: '10px', boxShadow: '0 0 20px rgba(127,119,221,0.15)'
      }}>
        <div style={{ fontSize: '11px', color: '#8890b0', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.5px' }}>
          FREE TRIAL
        </div>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '16px', fontWeight: '700',
          color: timeLeft < 60000 ? '#ff6b6b' : '#7F77DD',
          textShadow: timeLeft < 60000 ? '0 0 10px rgba(255,107,107,0.5)' : '0 0 10px rgba(127,119,221,0.4)'
        }}>
          {formatTimeLeft(timeLeft)}
        </div>
        <button
          onClick={() => openRazorpay({ onSuccess: () => { setPaySuccess(true); onUnlocked(); } })}
          style={{
            padding: '5px 12px', background: 'rgba(127,119,221,0.15)',
            border: '1px solid rgba(127,119,221,0.4)', borderRadius: '8px',
            color: '#7F77DD', fontSize: '11px', fontWeight: '700',
            cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.5px'
          }}>
          UPGRADE ₹299
        </button>
      </div>
    );
  }

  // Trial expired — show full screen wall
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5,8,16,0.97)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '52px', marginBottom: '16px' }}>⏱️</div>
      <div style={{
        fontFamily: 'Orbitron, monospace', fontSize: '24px', fontWeight: '900',
        color: '#7F77DD', marginBottom: '8px',
        textShadow: '0 0 20px rgba(127,119,221,0.5)'
      }}>
        YOUR FREE TRIAL HAS ENDED
      </div>
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontSize: '15px',
        color: '#8890b0', marginBottom: '32px', maxWidth: '400px', lineHeight: '1.6'
      }}>
        You have used your 10-minute free trial. Upgrade now to get unlimited access to all games, lessons, and skill tracking.
      </div>

      <button
        onClick={() => openRazorpay({
          onSuccess: () => { setPaySuccess(true); onUnlocked(); },
          onFailure: () => {}
        })}
        style={{
          padding: '14px 40px', background: 'linear-gradient(135deg, #7F77DD, #1D9E75)',
          border: 'none', borderRadius: '12px', color: '#fff',
          fontFamily: 'Orbitron, monospace', fontSize: '16px', fontWeight: '900',
          cursor: 'pointer', marginBottom: '12px', width: '100%', maxWidth: '320px',
          boxShadow: '0 0 30px rgba(127,119,221,0.4)', letterSpacing: '1px'
        }}>
        🚀 GET FULL ACCESS — ₹299
      </button>
      <div style={{ fontSize: '12px', color: '#5560a0', marginBottom: '32px' }}>
        One-time payment · Unlimited access forever · No subscription
      </div>

      <div style={{ width: '100%', maxWidth: '320px' }}>
        <div style={{ height: '1px', background: 'rgba(127,119,221,0.15)', marginBottom: '20px' }} />
        <form onSubmit={handleSecretSubmit}>
          <input
            type="text"
            value={secretInput}
            onChange={e => setSecretInput(e.target.value)}
            placeholder="Enter session key"
            style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(127,119,221,${shake ? '0.8' : '0.15'})`,
              borderRadius: '8px', color: '#5560a0', fontSize: '13px',
              outline: 'none', fontFamily: 'Rajdhani, sans-serif',
              textAlign: 'center', letterSpacing: '2px',
              transition: 'border-color 0.2s',
              animation: shake ? 'shake 0.4s ease' : 'none'
            }}
          />
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

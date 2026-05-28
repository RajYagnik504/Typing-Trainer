import React, { useState, useEffect } from 'react';
import { getTrialTimeLeftMs, formatTimeLeft, isTrialExpired, isFullAccess, unlockOwner } from '../utils/trialManager';
import { openRazorpay } from '../utils/razorpay';
import { ShieldCheck, Check, AlertCircle, Sparkles, CreditCard, Ticket } from 'lucide-react';

export default function SubscriptionWall({ onUnlocked }) {
  const [timeLeft, setTimeLeft] = useState(getTrialTimeLeftMs());
  const [expired, setExpired] = useState(isTrialExpired());
  const [couponInput, setCouponInput] = useState('');
  const [shake, setShake] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
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

  function handleCouponSubmit(e) {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (couponInput.trim() === '@Monday504') {
      try {
        setCouponSuccess('Coupon applied! Activating lifetime license...');
        unlockOwner();
        setTimeout(() => {
          onUnlocked();
        }, 1500);
      } catch (err) {
        setCouponError('Failed to activate session. Try again.');
      }
    } else {
      setShake(true);
      setCouponError('Invalid promo or coupon code.');
      setCouponInput('');
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
      justifyContent: 'center', padding: '24px', textAlign: 'center',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px', width: '100%', padding: '36px 30px', 
        borderRadius: '16px', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', boxSizing: 'border-box', border: '1px solid rgba(127,119,221,0.2)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏱️</div>
        
        <h2 style={{
          fontFamily: 'Orbitron, monospace', fontSize: '2rem', fontWeight: '900',
          color: 'white', marginBottom: '8px',
          textShadow: '0 0 20px rgba(127,119,221,0.3)'
        }}>
          FREE TRIAL EXPIRED
        </h2>
        
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '1.25rem',
          color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5'
        }}>
          Unlock unlimited practice to continue building muscle memory, playing speed arcade games, and connecting to school dashboards.
        </p>

        {/* Action Options */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          
          {/* Option A: Buy Tier */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
            borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: 'white', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--accent-purple)" />
                Get Full Student Access
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>₹299</span>
            </div>
            <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              One-time activation for lifetime access. Includes AI profile insights.
            </p>
            <button
              onClick={() => openRazorpay({
                onSuccess: () => { setPaySuccess(true); onUnlocked(); },
                onFailure: () => {}
              })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', background: 'var(--accent-purple)',
                border: 'none', borderRadius: '6px', color: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: '700',
                cursor: 'pointer', boxShadow: 'var(--glow-purple)'
              }}>
              <CreditCard size={14} />
              <span>Purchase License</span>
            </button>
          </div>

          {/* Option B: School Coupon */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
            borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left'
          }}>
            <span style={{ fontWeight: 800, color: 'white', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Ticket size={16} color="var(--accent-teal)" />
              Have a School Promo / Coupon?
            </span>
            <form onSubmit={handleCouponSubmit} style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <input
                type="text"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                placeholder="Enter Promo Code"
                style={{
                  flex: 1, padding: '8px 12px',
                  background: 'rgba(0,0,0,0.25)',
                  border: `1px solid rgba(127,119,221,${shake ? '0.8' : '0.15'})`,
                  borderRadius: '6px', color: 'white', fontSize: '1.25rem',
                  outline: 'none', transition: 'border-color 0.2s',
                  animation: shake ? 'shake 0.4s ease' : 'none'
                }}
              />
              <button 
                type="submit"
                style={{
                  padding: '8px 16px', background: 'var(--accent-teal)',
                  border: 'none', borderRadius: '6px', color: '#white',
                  fontWeight: 700, fontSize: '1.25rem', cursor: 'pointer',
                  boxShadow: 'var(--glow-teal)'
                }}>
                Apply
              </button>
            </form>

            {couponSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-teal)', fontSize: '1.1rem' }}>
                <Check size={14} />
                <span>{couponSuccess}</span>
              </div>
            )}

            {couponError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)', fontSize: '1.1rem' }}>
                <AlertCircle size={14} />
                <span>{couponError}</span>
              </div>
            )}
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} />
          <span>Secured offline verification and billing</span>
        </div>
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

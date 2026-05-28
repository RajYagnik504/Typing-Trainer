import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { isFullAccess, unlockOwner } from '../utils/trialManager';
import { openRazorpay } from '../utils/razorpay';

export default function Pricing({ onNavigate }) {
  const [promoCode, setPromoCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(isFullAccess());

  useEffect(() => {
    setIsPremium(isFullAccess());
  }, []);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (promoCode.trim() === '@Monday504') {
      try {
        unlockOwner();
        setIsPremium(true);
        setSuccessMsg('Promo code "@Monday504" applied! Lifetime access unlocked.');
        setPromoCode('');
      } catch (err) {
        setErrorMsg('Failed to apply promo code. Try again.');
      }
    } else {
      setErrorMsg('Invalid promo code. Please check and try again.');
    }
  };

  const handleUpgradePayment = () => {
    openRazorpay({
      onSuccess: () => {
        setIsPremium(true);
        setSuccessMsg('Payment successful! Full access unlocked.');
      },
      onFailure: () => {
        setErrorMsg('Payment cancelled or failed.');
      }
    });
  };

  const tiers = [
    {
      title: 'Free Plan',
      price: '₹0',
      period: '10-minute trial',
      features: [
        'Access to basic typing exercises',
        'Real-time accuracy & WPM feedback',
        'Standard profile dashboard view',
        '10 minutes of trial practice time'
      ],
      cta: 'Start Practice',
      action: () => onNavigate('Practice'),
      accent: 'var(--text-secondary)',
      popular: false
    },
    {
      title: 'Student Plan',
      price: '₹299',
      period: 'Lifetime license',
      features: [
        'Unlimited lifetime typing practice',
        'Access all typing arcade games',
        'Guided Typing Academy levels',
        'AI Cognitive intelligence profile',
        'Unlock all achievements & trophies'
      ],
      cta: isPremium ? 'Premium Active' : 'Get Lifetime Access',
      action: isPremium ? null : handleUpgradePayment,
      accent: 'var(--accent-purple)',
      popular: true
    },
    {
      title: 'Institution Plan',
      price: 'Custom',
      period: 'Annual bulk pricing',
      features: [
        'Educator dashboard administration',
        'Generate custom classroom codes',
        'Student progress roster tracking',
        'Export speed/WPM metrics to CSV',
        'Dedicated server hosting & support'
      ],
      cta: 'Contact Us for Bulk Pricing',
      action: () => onNavigate('Contact'),
      accent: 'var(--accent-teal)',
      popular: false
    }
  ];

  return (
    <div style={styles.container} className="animate-fadeIn">
      <header style={styles.header}>
        <div style={styles.iconWrap}>
          <Sparkles size={24} color="var(--accent-amber)" />
        </div>
        <h1 style={styles.title} className="text-gradient-purple">Simple & Fair Pricing</h1>
        <p style={styles.subtitle}>Unlock unlimited practice and educator administration tools for your classroom</p>
      </header>

      {/* Pricing Cards Grid */}
      <div style={styles.grid}>
        {tiers.map((tier, idx) => (
          <div 
            key={idx} 
            className="glass-panel" 
            style={{ 
              ...styles.card, 
              borderColor: tier.popular ? 'var(--accent-purple)' : 'var(--glass-border)',
              boxShadow: tier.popular ? 'var(--glow-purple-strong)' : 'none'
            }}
          >
            {tier.popular && <span style={styles.popularBadge}>Most Popular</span>}
            
            <h2 style={styles.cardTitle}>{tier.title}</h2>
            <div style={styles.priceContainer}>
              <span style={styles.price}>{tier.price}</span>
              <span style={styles.period}>{tier.period}</span>
            </div>
            
            <div style={styles.divider} />
            
            <ul style={styles.featureList}>
              {tier.features.map((feat, fIdx) => (
                <li key={fIdx} style={styles.featureItem}>
                  <Check size={14} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={tier.action}
              disabled={tier.action === null}
              style={{ 
                ...styles.ctaBtn, 
                background: tier.popular ? 'var(--accent-purple)' : 'rgba(255,255,255,0.04)',
                border: tier.popular ? 'none' : '1px solid var(--glass-border-highlight)',
                color: tier.popular ? 'white' : 'var(--text-primary)',
                cursor: tier.action === null ? 'default' : 'pointer',
                opacity: tier.action === null ? 0.7 : 1
              }}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Coupon Input Area */}
      <div className="glass-panel" style={styles.couponCard}>
        <div style={styles.couponHeader}>
          <ShieldCheck size={20} color="var(--accent-teal)" />
          <h3 style={styles.couponTitle}>Have an Institutional Promo / Coupon Code?</h3>
        </div>
        <p style={styles.couponDesc}>Enter the coupon code issued to your school to activate your unlimited license.</p>
        
        <form onSubmit={handleApplyPromo} style={styles.couponForm}>
          <input 
            type="text"
            placeholder="Enter Code (e.g. @Monday504)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={isPremium}
            style={styles.couponInput}
          />
          <button 
            type="submit" 
            disabled={isPremium || !promoCode}
            style={{ 
              ...styles.couponBtn,
              opacity: isPremium || !promoCode ? 0.6 : 1
            }}
          >
            Apply Code
          </button>
        </form>

        {successMsg && (
          <div style={styles.successDiv}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={styles.errorDiv}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
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
    background: 'rgba(239,159,39,0.08)',
    border: '1px solid rgba(239,159,39,0.2)',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '960px',
    marginBottom: '3rem',
    alignItems: 'stretch'
  },
  card: {
    padding: '30px 24px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'relative'
  },
  popularBadge: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    background: 'rgba(127,119,221,0.15)',
    border: '1px solid var(--accent-purple)',
    color: 'var(--accent-purple)',
    borderRadius: '999px',
    padding: '2px 10px',
    fontSize: '0.95rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'white',
    margin: '0 0 0.5rem 0'
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginBottom: '1rem'
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: 900,
    color: 'white'
  },
  period: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)'
  },
  divider: {
    height: '1px',
    background: 'var(--glass-border)',
    border: 'none',
    margin: '1rem 0'
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 2rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    flexGrow: 1
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '1.15rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },
  ctaBtn: {
    padding: '11px',
    borderRadius: '8px',
    fontSize: '1.25rem',
    fontWeight: 700,
    transition: 'all 0.2s',
    width: '100%',
    boxSizing: 'border-box'
  },
  couponCard: {
    width: '100%',
    maxWidth: '560px',
    padding: '20px 24px',
    boxSizing: 'border-box'
  },
  couponHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  couponTitle: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'white'
  },
  couponDesc: {
    fontSize: '1.15rem',
    color: 'var(--text-secondary)',
    margin: '0 0 1.25rem 0',
    lineHeight: '1.4'
  },
  couponForm: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  couponInput: {
    flex: 1,
    minWidth: '180px',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--glass-border)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '1.2rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  couponBtn: {
    padding: '8px 16px',
    background: 'var(--accent-teal)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '1.2rem',
    cursor: 'pointer',
    boxShadow: 'var(--glow-teal)'
  },
  successDiv: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--accent-teal)',
    fontSize: '1.15rem',
    background: 'rgba(29,158,117,0.08)',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(29,158,117,0.2)',
    marginTop: '12px'
  },
  errorDiv: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--accent-red)',
    fontSize: '1.15rem',
    background: 'rgba(226,75,74,0.08)',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(226,75,74,0.2)',
    marginTop: '12px'
  }
};

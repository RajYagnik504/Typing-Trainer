import React, { useEffect, useRef, useState } from 'react';

/**
 * MetricCard — animated stat card with count-up and trend indicator
 * @param {string}  title
 * @param {number}  value
 * @param {string}  unit
 * @param {React.ReactNode} icon
 * @param {string}  accentColor   - CSS var or hex
 * @param {number}  trend         - positive = up, negative = down, 0 = neutral
 * @param {number}  delay         - animation delay in ms
 */
const MetricCard = ({
  title = '',
  value = 0,
  unit = '',
  icon = null,
  accentColor = 'var(--accent-purple)',
  trend = 0,
  delay = 0,
}) => {
  const [displayed, setDisplayed] = useState(0);
  const [visible, setVisible] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    let start = null;
    const duration = 800;
    const endVal = typeof value === 'number' ? value : 0;

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(parseFloat((endVal * eased).toFixed(1)));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, visible]);

  const trendArrow = trend > 0 ? '▲' : trend < 0 ? '▼' : '–';
  const trendColor = trend > 0 ? 'var(--accent-teal)' : trend < 0 ? 'var(--accent-red)' : 'var(--text-muted)';

  // Format displayed — show integer if value is a whole number
  const formattedDisplay = Number.isInteger(value)
    ? Math.round(displayed)
    : displayed.toFixed(1);

  return (
    <div
      className="glass-panel"
      style={{
        ...styles.card,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ${delay}ms ease, transform 0.5s ${delay}ms ease`,
        borderTop: `2px solid ${accentColor}`,
      }}
    >
      {/* Header Row */}
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        {icon && (
          <div style={{ ...styles.iconWrap, background: `${accentColor}22`, color: accentColor }}>
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div style={styles.valueRow}>
        <span style={{ ...styles.value, color: accentColor }}>
          {formattedDisplay}
        </span>
        <span style={styles.unit}>{unit}</span>
      </div>

      {/* Trend indicator */}
      {trend !== 0 && (
        <div style={{ ...styles.trend, color: trendColor }}>
          {trendArrow} {Math.abs(trend)}% vs last
        </div>
      )}

      {/* Bottom accent bar */}
      <div
        style={{
          ...styles.accentBar,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />
    </div>
  );
};

const styles = {
  card: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default',
    minHeight: '140px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  iconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.35rem',
  },
  value: {
    fontSize: '2.4rem',
    fontWeight: '800',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1,
    letterSpacing: '-0.03em',
  },
  unit: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  trend: {
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '2px',
    width: '100%',
    opacity: 0.4,
  },
};

export default MetricCard;

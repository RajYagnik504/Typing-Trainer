import React, { useEffect, useRef, useState } from 'react';

/**
 * AnimatedGauge — SVG circular progress gauge
 * @param {number}  value      - 0–100
 * @param {string}  label
 * @param {string}  unit       - e.g. 'WPM', '%', '/100'
 * @param {string}  color      - CSS color or var()
 * @param {number}  size       - px (default 120)
 * @param {number}  strokeWidth
 */
const AnimatedGauge = ({
  value = 0,
  label = '',
  unit = '',
  color = 'var(--accent-purple)',
  size = 120,
  strokeWidth = 9,
}) => {
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef(null);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  // Count-up animation for the numeric value
  useEffect(() => {
    let start = null;
    const duration = 900;
    const startVal = displayed;
    const endVal = clampedValue;

    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayed(Math.round(startVal + (endVal - startVal) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const center = size / 2;

  return (
    <div style={styles.wrapper}>
      <svg width={size} height={size} style={styles.svg}>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
        {/* Center value */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize={size * 0.22}
          fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
        >
          {displayed}
        </text>
        {/* Unit label below */}
        <text
          x={center}
          y={center + size * 0.17}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-muted)"
          fontSize={size * 0.11}
          fontWeight="500"
        >
          {unit}
        </text>
      </svg>
      <span style={styles.label}>{label}</span>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  svg: {
    overflow: 'visible',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },
};

export default AnimatedGauge;

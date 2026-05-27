import React, { useState } from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   KEYBOARD DISPLAY — Holographic QWERTY component
   Used across all Blind Typing Academy modules.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Full QWERTY layout: [display, internalKey, widthUnits] ─────────────── */
const ROWS = [
  [['`','`',1],['1','1',1],['2','2',1],['3','3',1],['4','4',1],['5','5',1],
   ['6','6',1],['7','7',1],['8','8',1],['9','9',1],['0','0',1],['-','-',1],['=','=',1],['⌫','backspace',2]],
  [['Tab','tab',1.5],['Q','q',1],['W','w',1],['E','e',1],['R','r',1],['T','t',1],
   ['Y','y',1],['U','u',1],['I','i',1],['O','o',1],['P','p',1],['[','[',1],[']',']',1],['\\','\\',1.5]],
  [['Caps','caps',1.75],['A','a',1],['S','s',1],['D','d',1],['F','f',1],['G','g',1],
   ['H','h',1],['J','j',1],['K','k',1],['L','l',1],[';',';',1],["'","'",1],['↵','enter',2.25]],
  [['⇧','lshift',2.25],['Z','z',1],['X','x',1],['C','c',1],['V','v',1],['B','b',1],
   ['N','n',1],['M','m',1],[',',',',1],['.','.', 1],['/','/',1],['⇧','rshift',2.75]],
  [['⎵',' ',6.5]],
];

/* ── Finger assignment map ───────────────────────────────────────────────── */
export const FINGER_MAP = {
  '`':'Lp','1':'Lp','2':'Lr','3':'Lm','4':'Li','5':'Li','6':'Ri','7':'Ri','8':'Rm','9':'Rr','0':'Rp','-':'Rp','=':'Rp',
  'q':'Lp','w':'Lr','e':'Lm','r':'Li','t':'Li','y':'Ri','u':'Ri','i':'Rm','o':'Rr','p':'Rp','[':'Rp',']':'Rp','\\':'Rp',
  'a':'Lp','s':'Lr','d':'Lm','f':'Li','g':'Li','h':'Ri','j':'Ri','k':'Rm','l':'Rr',';':'Rp',"'":'Rp',
  'z':'Lp','x':'Lr','c':'Lm','v':'Li','b':'Li','n':'Ri','m':'Ri',',':'Rm','.':'Rr','/':'Rp',
  ' ':'Th',
};

/* ── Finger colour palette ──────────────────────────────────────────────── */
export const FINGER_COLORS = {
  Lp: { hex:'#7F77DD', rgb:'127,119,221', name:'Left Pinky'   },
  Lr: { hex:'#5BA8F5', rgb:'91,168,245',  name:'Left Ring'    },
  Lm: { hex:'#1D9E75', rgb:'29,158,117',  name:'Left Middle'  },
  Li: { hex:'#EF9F27', rgb:'239,159,39',  name:'Left Index'   },
  Th: { hex:'#A1A1AA', rgb:'161,161,170', name:'Thumbs'       },
  Ri: { hex:'#EF9F27', rgb:'239,159,39',  name:'Right Index'  },
  Rm: { hex:'#1D9E75', rgb:'29,158,117',  name:'Right Middle' },
  Rr: { hex:'#5BA8F5', rgb:'91,168,245',  name:'Right Ring'   },
  Rp: { hex:'#7F77DD', rgb:'127,119,221', name:'Right Pinky'  },
};

export const HOME_ROW_KEYS = new Set(['a','s','d','f','g','h','j','k','l',';']);

const KEY_H    = 40;  // px key height
const KEY_UNIT = 44;  // px per 1 width unit (includes gap)
const KEY_GAP  = 4;   // px gap between keys

/* ══════════════════════════════════════════════════════════════════════════ */
const KeyboardDisplay = ({
  fingerZones      = false,   // tint keys by finger colour
  homeRowGlow      = false,   // pulse home row
  highlightKey     = null,    // single key to illuminate
  pressedKey       = null,    // flash on keypress
  heatmap          = null,    // { errors:{k:n}, slow:{k:n}, counts:{k:n} }
  opacity          = 1,       // 0–1 for eyes-off fade
  showFingerLabels = false,   // show finger code below letter
  onKeyHover       = null,    // (key, fingerColor) => void
  compact          = false,   // smaller render
}) => {
  const [hoveredKey, setHoveredKey] = useState(null);
  const scale = compact ? 0.75 : 1;
  const kH    = Math.round(KEY_H    * scale);
  const kU    = Math.round(KEY_UNIT * scale);
  const kG    = Math.round(KEY_GAP  * scale);

  const getKeyStyle = (iKey) => {
    const finger = FINGER_MAP[iKey];
    const fc     = finger ? FINGER_COLORS[finger] : null;
    const isHome = HOME_ROW_KEYS.has(iKey);

    const isHighlight = highlightKey && iKey === highlightKey.toLowerCase();
    const isPressed   = pressedKey   && iKey === pressedKey.toLowerCase();
    const isHov       = hoveredKey === iKey;

    /* ── heatmap colour override ── */
    let heatBg = null;
    if (heatmap) {
      const err   = heatmap.errors?.[iKey]  || 0;
      const slow  = heatmap.slow?.[iKey]    || 0;
      const total = heatmap.counts?.[iKey]  || 0;
      const eRate = total > 0 ? err  / total : 0;
      const sRate = total > 0 ? slow / total : 0;
      if      (eRate > 0.4)  heatBg = `rgba(226,75,74,${Math.min(0.85, eRate)})`;
      else if (eRate > 0.15) heatBg = `rgba(239,159,39,${Math.min(0.75, eRate * 2.5)})`;
      else if (sRate > 0.35) heatBg = `rgba(239,159,39,${Math.min(0.6, sRate)})`;
      else if (total >= 5)   heatBg = `rgba(29,158,117,${Math.min(0.55, total / 35)})`;
    }

    /* ── compute visual state ── */
    let bg     = 'rgba(22,22,34,0.85)';
    let border = `1px solid rgba(255,255,255,0.07)`;
    let shadow = 'none';
    let color  = 'var(--text-muted)';
    let transform = 'scale(1)';

    if (heatBg) {
      bg     = heatBg;
      border = '1px solid rgba(255,255,255,0.12)';
    } else if (fingerZones && fc) {
      bg     = `rgba(${fc.rgb},0.11)`;
      border = `1px solid rgba(${fc.rgb},0.22)`;
      color  = fc.hex;
    }

    if (isHome && homeRowGlow && !heatBg) {
      border = '1px solid rgba(29,158,117,0.5)';
      shadow = '0 0 10px rgba(29,158,117,0.35), inset 0 0 6px rgba(29,158,117,0.1)';
    }

    if (isHighlight && !isPressed) {
      const c = fc || { hex:'#7F77DD', rgb:'127,119,221' };
      bg      = `rgba(${c.rgb},0.28)`;
      border  = `2px solid ${c.hex}`;
      shadow  = `0 0 22px ${c.hex}99, inset 0 0 12px ${c.hex}33`;
      color   = c.hex;
    }

    if (isPressed) {
      const c = fc || { hex:'#7F77DD', rgb:'127,119,221' };
      bg        = `rgba(${c.rgb},0.6)`;
      border    = `2px solid ${c.hex}`;
      shadow    = `0 0 32px ${c.hex}, 0 0 70px ${c.hex}55`;
      color     = '#fff';
      transform = 'scale(0.91)';
    }

    if (isHov && !isHighlight && !isPressed) {
      bg     = 'rgba(255,255,255,0.08)';
      border = '1px solid rgba(255,255,255,0.2)';
    }

    return { bg, border, shadow, color, transform };
  };

  /* Tooltip for hovered key */
  const hoveredFinger = hoveredKey ? FINGER_MAP[hoveredKey] : null;
  const hoveredFC     = hoveredFinger ? FINGER_COLORS[hoveredFinger] : null;

  return (
    <div style={{ opacity, transition: 'opacity 0.9s ease', userSelect: 'none', position: 'relative' }}>
      {/* Rows */}
      {ROWS.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: `${kG}px`, marginBottom: `${kG}px` }}>
          {row.map(([display, iKey, wUnits]) => {
            const ks    = getKeyStyle(iKey);
            const width = Math.round(wUnits * kU - kG);
            const isSpec = wUnits > 1;
            return (
              <div
                key={iKey}
                style={{
                  width        : `${width}px`,
                  height       : `${kH}px`,
                  background   : ks.bg,
                  border       : ks.border,
                  boxShadow    : ks.shadow,
                  borderRadius : `${Math.round(5 * scale)}px`,
                  display      : 'flex',
                  flexDirection: 'column',
                  alignItems   : 'center',
                  justifyContent:'center',
                  fontSize     : isSpec ? `${Math.round(10 * scale)}px` : `${Math.round(12 * scale)}px`,
                  fontFamily   : 'var(--font-mono)',
                  fontWeight   : 700,
                  color        : ks.color,
                  transition   : 'all 0.12s ease',
                  cursor       : 'default',
                  flexShrink   : 0,
                  gap          : '1px',
                  transform    : ks.transform,
                }}
                onMouseEnter={() => {
                  setHoveredKey(iKey);
                  onKeyHover?.(iKey, FINGER_COLORS[FINGER_MAP[iKey]]);
                }}
                onMouseLeave={() => {
                  setHoveredKey(null);
                  onKeyHover?.(null, null);
                }}
              >
                <span>{display}</span>
                {showFingerLabels && !isSpec && FINGER_MAP[iKey] && (
                  <span style={{
                    fontSize : `${Math.round(7 * scale)}px`,
                    color    : FINGER_COLORS[FINGER_MAP[iKey]]?.hex,
                    opacity  : 0.65,
                    lineHeight: 1,
                  }}>
                    {FINGER_MAP[iKey]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Hover tooltip */}
      {hoveredKey && hoveredFC && (
        <div style={{
          position:'absolute', bottom:'-36px', left:'50%', transform:'translateX(-50%)',
          background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
          borderRadius:'var(--radius-full)', padding:'0.3rem 0.85rem',
          fontSize:'0.78rem', fontWeight:600, color: hoveredFC.hex,
          whiteSpace:'nowrap', pointerEvents:'none', zIndex:20,
          boxShadow:`0 0 12px ${hoveredFC.hex}44`,
        }}>
          {hoveredFC.name}
        </div>
      )}
    </div>
  );
};

export default KeyboardDisplay;

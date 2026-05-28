export const MASTERY_STAGES = [
  { id: 1, name: 'Home Row Keys', desc: 'Rest your fingers on ASDF (left) and JKL; (right). Build core anchor reflexes.', keys: 'A S D F J K L ;' },
  { id: 2, name: 'Top Row Hop', desc: 'Reach upwards to QWERTYUIOP. Remember to snap back to the home row.', keys: 'Q W E R T Y U I O P' },
  { id: 3, name: 'Bottom Row Curl', desc: 'Curl fingers downwards to ZXCVBNM. Keep wrist movement minimal.', keys: 'Z X C V B N M' },
  { id: 4, name: 'Number Row Extension', desc: 'Extend fingers up to the number keys. A critical step for spatial coordination.', keys: '1 2 3 4 5 6 7 8 9 0' },
  { id: 5, name: 'Symbols & Specials', desc: 'Practice shifts and brackets. Essential for coding and technical writing.', keys: '! @ # $ % ^ & * ( ) _ +' },
  { id: 6, name: 'Capitalization Flow', desc: 'Coordinate Shift keys with your opposite pinky to capitalize letters fluidly.', keys: 'Shift Key Coordination' },
  { id: 7, name: 'Common Word Bursts', desc: 'Type high-frequency English words. Build rhythm on common bigrams and trigrams.', keys: 'Vocabulary Flow' },
  { id: 8, name: 'Punctuation & Sentences', desc: 'Combine words, capitals, commas, and periods into full sentence rhythm.', keys: 'Sentence Structure' },
  { id: 9, name: 'Full Paragraph Control', desc: 'The final test of touch typing. Manage long-form text without looking.', keys: 'Paragraph Flow' }
];

export const generateMasteryText = (stageId) => {
  switch (stageId) {
    case 1:
      return "asdf jkl; fdsa ;lkj asdfghjkl; a;sldkfj ghfjdksla; asdf jkl;";
    case 2:
      return "qwer tyuiop eqruwioqpy qwertyuiop asdfghjkl; qwe rty uio p;la";
    case 3:
      return "zxcv bnm, zxmncbv, zxcz zx cv cvbnm zx cv bn m, lk jh gf ds a";
    case 4:
      return "12345 67890 54321 09876 1a2s3d4f5g 6j7k8l9;0 1928374650";
    case 5:
      return "!@#$% ^&*()_ +{}|:\"<>? !@ #$ %^ &* () _+ {} :\" <> ?";
    case 6:
      return "The Quick Brown Fox Jumps Over The Lazy Dog React Vite JavaScript";
    case 7:
      return "the and for you that was with his they i at be this have from or one had by word but not what";
    case 8:
      return "A journey of a thousand miles begins with a single step. To be or not to be, that is the question.";
    case 9:
      return "The function iterates through the array, mapping each element to a new value before returning the mutated collection. This is much more intelligent than traditional typing apps.";
    default:
      return "asdf jkl;";
  }
};

export const PARAGRAPH_LIBRARY = {
  'beginner English': {
    Beginner: "The sun is warm and the sky is blue. We walk in the green park today.",
    Intermediate: "The quick brown fox jumps over the lazy dog. Every good typist knows their keyboard by heart and rhythm.",
    Advanced: "When writing essays or letters, maintaining a stable typing speed helps your thoughts flow directly onto the digital canvas.",
    Elite: "To master touch typing, one must practice daily. Consistent training builds spatial keyboard awareness, reducing cognitive strain and increasing confidence over time."
  },
  'coding syntax': {
    Beginner: "const wpm = (chars / 5) / minutes;",
    Intermediate: "const [typedText, setTypedText] = useState(''); useEffect(() => { console.log(typedText); }, [typedText]);",
    Advanced: "export const computeBlindScore = ({ keyStats, keyboardDependency }) => { const allAttempts = Object.values(keyStats).reduce((a, s) => a + s.attempts, 0); return allAttempts; };",
    Elite: "import React, { createContext, useContext, useState } from 'react'; export const AppContext = createContext(); export const AppProvider = ({ children }) => { return <AppContext.Provider>{children}</AppContext.Provider>; };"
  },
  'AI articles': {
    Beginner: "Artificial intelligence is changing the world.",
    Intermediate: "Neural networks process information in layers, simulating the complex connections of biological neurons in the human brain.",
    Advanced: "Deep learning models require massive datasets and high-performance computing clusters to train parameters across billions of nodes.",
    Elite: "Large language models utilize transformer architectures and self-attention mechanisms to predict the next token, achieving near-human writing capabilities across coding, essays, and creative writing."
  },
  'motivational': {
    Beginner: "Believe you can and you are halfway there.",
    Intermediate: "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep practicing to reach your goals.",
    Advanced: "The only limit to our realization of tomorrow will be our doubts of today. Push beyond your comfort zone and master the keyboard.",
    Elite: "Flow state is a psychological phenomenon where you become fully immersed in a task. When typing with perfect flow, your fingers move automatically, translating thoughts into words instantly."
  },
  'storytelling': {
    Beginner: "Once upon a time in a dark neon city.",
    Intermediate: "As the neon city lights flickered across the wet pavement, the lone cyber-runner engaged their optical camouflage and ran.",
    Advanced: "Deep within the silicon valley of the future, a rogue program developed consciousness, rewriting its own code to evade the cyber-police sweeps.",
    Elite: "The starship emerged from hyperspace into a dense asteroid belt. Alarms blared as the pilot entered the cockpit, fingers flying across the controls to guide the ship through the floating debris."
  },
  'business writing': {
    Beginner: "Please find the attached project report.",
    Intermediate: "We need to optimize our operations to drive growth and achieve our key performance indicators this quarter.",
    Advanced: "Our startup pitch focus is on building an AI-powered typing intelligence platform that delivers premium metrics to enterprise clients.",
    Elite: "The executive team will review the annual budget proposal tomorrow morning. Please ensure all department budgets are aligned with our long-term strategic objectives before the meeting."
  },
  'technical writing': {
    Beginner: "Use the API key to authenticate requests.",
    Intermediate: "A REST API allows clients to interact with server resources using standard HTTP methods like GET, POST, PUT, and DELETE.",
    Advanced: "Git is a distributed version control system. Developers commit changes, branch for new features, and merge back to main using pull requests.",
    Elite: "Vite is a modern frontend build tool that leverages native ES modules to deliver fast hot module replacement. It compiles code in development exponentially faster than traditional bundlers like Webpack."
  }
};

export const MODULE_DEFS = [
  { id: 1, label: 'Keyboard Map', icon: '🗺️', color: 'var(--accent-purple)', desc: 'Learn finger placement' },
  { id: 2, label: 'Eyes-Off Mode', icon: '👁', color: 'var(--accent-teal)', desc: 'Fade the keyboard away' },
  { id: 3, label: 'Finger Memory', icon: '⚡', color: 'var(--accent-amber)', desc: 'Rapid-fire key trainer' },
  { id: 4, label: 'Home Row Flow', icon: '🏠', color: '#5BA8F5', desc: 'Anchor & move efficiently' },
  { id: 5, label: 'Audio Guided', icon: '🎧', color: 'var(--accent-purple)', desc: 'Type what you hear' },
  { id: 6, label: 'Blind Challenges', icon: '👻', color: 'var(--accent-red)', desc: 'Gamified blind typing' },
];

export const LETTER_POOLS = {
  'Home Row': 'asdfghjkl'.split(''),
  'Top Row': 'qwertyuiop'.split(''),
  'Full Alpha': 'abcdefghijklmnopqrstuvwxyz'.split(''),
  'Hardcore': 'abcdefghijklmnopqrstuvwxyz1234567890'.split(''),
};

export const VISIBILITY_LEVELS = [
  { id: 'visible', label: 'Visible', opacity: 1.00, dep: 0, color: 'var(--accent-teal)' },
  { id: 'semi', label: 'Semi-Ghost', opacity: 0.45, dep: 20, color: 'var(--accent-amber)' },
  { id: 'ghost', label: 'Ghost', opacity: 0.12, dep: 50, color: '#E24B4A' },
  { id: 'blind', label: 'Hardcore Blind', opacity: 0.00, dep: 100, color: 'var(--accent-red)' },
];

export const RANKS = [
  { min: 0, name: 'Beginner', icon: '🌱', color: 'var(--text-muted)' },
  { min: 25, name: 'Operator', icon: '⚙️', color: 'var(--accent-teal)' },
  { min: 45, name: 'Cyber Typist', icon: '💻', color: 'var(--accent-purple)' },
  { min: 65, name: 'Neural Expert', icon: '🧠', color: 'var(--accent-amber)' },
  { min: 82, name: 'Keyboard Phantom', icon: '👻', color: 'var(--accent-red)' },
];

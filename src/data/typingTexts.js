export const typingTexts = {
  Beginner: [
    { text: "The quick brown fox jumps over the lazy dog.", category: "classic" },
    { text: "A journey of a thousand miles begins with a single step.", category: "motivational" },
    { text: "To be or not to be, that is the question.", category: "storytelling" }
  ],
  Intermediate: [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "motivational" },
    { text: "Artificial intelligence is a branch of computer science aiming to create machines that can simulate human intelligence.", category: "AI" },
    { text: "In the world of gaming, quick reflexes and strategic thinking often determine the difference between victory and defeat.", category: "gaming" }
  ],
  Advanced: [
    { text: "The function iterates through the array, mapping each element to a new value before returning the mutated collection.", category: "coding" },
    { text: "Quantum computing leverages the principles of superposition and entanglement to perform complex calculations exponentially faster than classical computers.", category: "technical" },
    { text: "As the neon city lights flickered across the wet pavement, the lone cyber-runner engaged their optical camouflage.", category: "storytelling" }
  ],
  Zen: [
    { text: "Breathe in the calm, exhale the stress. The rhythm of your fingers is the only thing that matters right now.", category: "motivational" },
    { text: "Water shapes its course according to the nature of the ground over which it flows; the soldier works out his victory in relation to the foe whom he is facing.", category: "storytelling" }
  ],
  Hardcore: [
    { text: "const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;", category: "coding" },
    { text: "import { Component } from 'react'; class App extends Component { render() { return <div className=\"app\">{this.props.title}</div>; } }", category: "coding" },
    { text: "Xylophones, zebras, and quicksilver: just a few words testing your dexterity. 123-456-7890! Can you handle it?", category: "technical" }
  ]
};

export const getRandomText = (difficulty) => {
  const texts = typingTexts[difficulty] || typingTexts['Intermediate'];
  const randomIndex = Math.floor(Math.random() * texts.length);
  return texts[randomIndex].text;
};

import React, { useState, useEffect } from 'react';
import './RiddleOverlay.css';
import { useParams } from 'react-router-dom';

// Define types
interface RiddleOverlayProps {
  onClose: () => void;
}

interface RiddleData {
  number: number;
  title: string;
  text: string;
  hint: string;
  answer: string;
  nextRiddleKey?: string;
}

// Define the riddles with random keys for each
const RIDDLES: RiddleData[] = [
  {
    number: 1,
    title: "Unlock the Hunt",
    text: "A city hidden, not by sight, seek its trail with keen insight. A tag of play, a call to peek, search the phrase where filters speak. Three words combined, the hunt shall leak.",
    hint: "The #GrazAndSeek tag?",
    answer: "internet",
    nextRiddleKey: "vQ7zAj9pXt3B"
  },
  {
    number: 2,
    title: "Mission: Meltdown",
    text: "A stealthy slab is loitering on a tabletop, wrapped up like a spy in violet. Give that wrapper a flip, and you’ll spot a digit posing for a selfie. Write it down before the bar melts or “escapes.”",
    hint: "No hits here, but you're close.",
    answer: "map",
    nextRiddleKey: "R2nH6fTgK8dL"
  },
  {
    number: 3,
    title: "The 28-Day Calendar Conundrum",
    text: "At least how many months in a year have 28 days? Take only the final digit of that number and write it down.",
    hint: "No hits here, but we're sure you're close.",
    answer: "compass",
    nextRiddleKey: "p5mS9yE2cX4V"
  },
  {
    number: 4,
    title: "Someone?",
    text: "There’s a globe-trotting dev who commits in coordinates, peppering the planet with pixel-bright pins instead of pull requests. His trail of markers forms a secret checksum of his travels. Curious? Swing by the team page. His rank stands proudly beside his name, but what matters is the tally of pins he’s logged: count them all no more, no less and you’ll unlock the number you seek.",
    hint: "No hits here, but this one is easy.",
    answer: "land",
    nextRiddleKey: "Z3kW8bJ7rU6D"
  },
  {
    number: 5,
    title: "The Alphabetical-Order Number",
    text: "Exactly one English number-word between 1 and 100 has its letters arranged in perfect alphabetical order. How many letters are in that word?",
    hint: "No hits again, it's the last one.",
    answer: "experience",
  }
];

// Secret salt for the hash - this adds security so people can't easily guess riddle URLs
const SECRET_SALT = "Wm4pp1nR1ddl3S4lt!";

// First riddle has a special key
const FIRST_RIDDLE_KEY = "a7G3pL9qZ5xC";

const RiddleOverlay: React.FC<RiddleOverlayProps> = ({ onClose }) => {
  const [riddleData, setRiddleData] = useState<RiddleData | null>(null);
  
  const { riddleKey } = useParams<{ riddleKey: string }>();
  
  // Validate the riddle key and find the corresponding riddle
  useEffect(() => {
    if (!riddleKey) {
      return;
    }
    
    try {
      // Try to find the riddle that matches the key
      let foundRiddle: RiddleData | null = null;
      
      // First riddle has a special key
      if (riddleKey === FIRST_RIDDLE_KEY) {
        foundRiddle = RIDDLES[0];
      } else {
        // For all other riddles, check if the key matches any of our nextRiddleKeys
        for (let i = 0; i < RIDDLES.length; i++) {
          if (i > 0 && RIDDLES[i-1].nextRiddleKey === riddleKey) {
            foundRiddle = RIDDLES[i];
            break;
          }
        }
      }
      
      if (foundRiddle) {
        setRiddleData(foundRiddle);
      } else {
        // Invalid riddle key - redirect to homepage
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Error processing riddle key:", error);
      window.location.href = '/';
    }
  }, [riddleKey]);

  // If no riddle data is available, don't render anything
  if (!riddleData) {
    return null;
  }

  return (
    <div className={`riddle-overlay riddle-overlay-${riddleData.number}`}>
      <div className="riddle-content">
        <button className="riddle-close" onClick={onClose}>×</button>
        
        <div className="riddle-header">
          <div className="riddle-number">{riddleData.number}</div>
          <h2 className="riddle-title">{riddleData.title}</h2>
        </div>
        
        <p className="riddle-text">{riddleData.text}</p>
        <p className="riddle-hint">{riddleData.hint}</p>
        
        <div className="riddle-decoration riddle-decoration-1"></div>
        <div className="riddle-decoration riddle-decoration-2"></div>
        
        <div className="riddle-progress">
          {RIDDLES.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index + 1 === riddleData.number
                  ? 'active'
                  : index + 1 < riddleData.number
                  ? 'completed'
                  : ''
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get the first riddle URL
const getFirstRiddleUrl = () => {
  return `/riddle/${FIRST_RIDDLE_KEY}`;
};

export default RiddleOverlay; 
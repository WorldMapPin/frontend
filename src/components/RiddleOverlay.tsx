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
    title: "Graz Clue",
    text: "Where rivers meet and clocktowers climb, find the city frozen in time. Count the letters of its name, then subtract the buzz — what number remains?",
    hint: "No hits here, but you're close.",
    answer: "map",
    nextRiddleKey: "R2nH6fTgK8dL"
  },
  {
    number: 3,
    title: "Buzz Party",
    text: "Beneath the neon, nights ignite, a party's roar, a city's light. Count the times we've danced till day — The Buzz has called — now, what's the way?",
    hint: "No hits here, but you're close.",
    answer: "compass",
    nextRiddleKey: "p5mS9yE2cX4V"
  },
  {
    number: 4,
    title: "The Dev",
    text: "In maps and codes he hides his trace, a silent scribe in digital space. His posts are keys, but here's the feat: Find the sum, then add no cheat.",
    hint: "No hits here, but this one is easy.",
    answer: "land",
    nextRiddleKey: "Z3kW8bJ7rU6D"
  },
  {
    number: 5,
    title: "The Explorer's Secret",
    text: "I am an odd number, remove one letter and I become even. Think not in sums, but in the riddle's reason. Solve my name, and you will see — The number you seek is found in me.",
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
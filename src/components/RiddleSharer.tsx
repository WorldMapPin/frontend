import React, { useState } from 'react';
import { getFirstRiddleUrl } from './RiddleRouter';
import './RiddleOverlay.css';

interface RiddleSharerProps {
  onClose: () => void;
}

const RiddleSharer: React.FC<RiddleSharerProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const riddleUrl = `${window.location.origin}${getFirstRiddleUrl()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(riddleUrl);
    setCopied(true);
    
    // Reset the copied state after 3 seconds
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleShareOnTwitter = () => {
    const text = "Join the WorldMappin Treasure Hunt! Can you solve these geography riddles?";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(riddleUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(riddleUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="riddle-overlay riddle-overlay-1">
      <div className="riddle-content">
        <button className="riddle-close" onClick={onClose}>×</button>
        
        <div className="riddle-header">
          <h2 className="riddle-title">Share The Treasure Hunt</h2>
        </div>
        
        <p className="riddle-text">
          Challenge your friends to solve these geography riddles! Copy the link below or share directly.
        </p>
        
        <div className="riddle-decoration riddle-decoration-1"></div>
        <div className="riddle-decoration riddle-decoration-2"></div>
        
        <div className="riddle-solution" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="riddle-input"
              value={riddleUrl}
              readOnly
              style={{ paddingRight: '100px' }}
            />
            <button 
              className="riddle-submit"
              onClick={handleCopyLink}
              style={{ 
                position: 'absolute', 
                right: '5px',
                top: '5px',
                padding: '7px 12px',
                fontSize: '14px'
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
            <button 
              className="riddle-submit"
              onClick={handleShareOnTwitter}
              style={{ 
                background: 'linear-gradient(135deg, #1DA1F2 0%, #0d8ad3 100%)',
                flex: 1 
              }}
            >
              Twitter
            </button>
            <button 
              className="riddle-submit"
              onClick={handleShareOnFacebook}
              style={{ 
                background: 'linear-gradient(135deg, #4267B2 0%, #365899 100%)',
                flex: 1 
              }}
            >
              Facebook
            </button>
          </div>
        </div>
        
        <p className="riddle-hint" style={{ marginTop: '20px' }}>
          The Treasure Hunt consists of 5 geography-themed riddles that anyone can solve!
        </p>
      </div>
    </div>
  );
};

export default RiddleSharer; 
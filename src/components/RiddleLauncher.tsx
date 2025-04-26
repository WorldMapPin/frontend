import React, { useState } from 'react';
import { getFirstRiddleUrl } from './RiddleRouter';
import RiddleSharer from './RiddleSharer';

interface RiddleLauncherProps {
  className?: string;
  buttonText?: string;
  showAsMenuItem?: boolean;
}

const RiddleLauncher: React.FC<RiddleLauncherProps> = ({ 
  className = '', 
  buttonText = 'Geography Treasure Hunt', 
  showAsMenuItem = false 
}) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLaunchRiddle = () => {
    window.location.href = getFirstRiddleUrl();
  };

  const handleShareRiddle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  // For menu item display
  if (showAsMenuItem) {
    return (
      <>
        <div 
          className="menu-item"
          onClick={handleLaunchRiddle}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '10px 15px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            borderRadius: '4px'
          }}
        >
          <span>{buttonText}</span>
          <button
            onClick={handleShareRiddle}
            style={{
              background: 'none',
              border: 'none',
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#4d7ea8',
            }}
          >
            Share
          </button>
        </div>
        
        {showShareModal && <RiddleSharer onClose={handleCloseShareModal} />}
      </>
    );
  }

  // For standalone button display
  return (
    <>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          className={`riddle-submit ${className}`}
          onClick={handleLaunchRiddle}
          style={{
            background: 'linear-gradient(135deg, #5983fc 0%, #2935c0 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          {buttonText}
        </button>
        
        <button
          onClick={handleShareRiddle}
          style={{
            background: 'none',
            border: '1px solid #5983fc',
            padding: '10px 15px',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#5983fc',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
        >
          Share
        </button>
      </div>
      
      {showShareModal && <RiddleSharer onClose={handleCloseShareModal} />}
    </>
  );
};

export default RiddleLauncher; 
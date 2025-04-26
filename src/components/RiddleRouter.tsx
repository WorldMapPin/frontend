import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import RiddleOverlay from './RiddleOverlay';

// First riddle has a special key - must match the one in RiddleOverlay.tsx
const FIRST_RIDDLE_KEY = "a7G3pL9qZ5xC";

interface RiddleRouterProps {
  // Add any props if needed
}

const RiddleRouter: React.FC<RiddleRouterProps> = () => {
  const [showRiddle, setShowRiddle] = useState(false);

  // Handle closing the riddle overlay
  const handleCloseRiddle = () => {
    setShowRiddle(false);
    // Use history API directly instead of navigate
    window.history.pushState({}, '', '/');
  };

  // Use useEffect to determine if we should show the riddle overlay
  useEffect(() => {
    // Check if the current path matches the riddle path pattern
    const isRiddlePath = window.location.pathname.includes('/riddle/');
    setShowRiddle(isRiddlePath);
  }, [window.location.pathname]);

  return (
    <Routes>
      <Route 
        path="/riddle/:riddleKey" 
        element={showRiddle ? <RiddleOverlay onClose={handleCloseRiddle} /> : null} 
      />
    </Routes>
  );
};

// Generate a random code for the riddle URL
export const getFirstRiddleUrl = () => {
  return `/riddle/${FIRST_RIDDLE_KEY}`;
};

export default RiddleRouter; 
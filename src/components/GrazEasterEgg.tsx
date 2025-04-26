import React, { useState, useRef, useEffect } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import './GrazEasterEgg.css';
import HiveAuth from './HiveAuth';

// Graz coordinates
const GRAZ_COORDINATES = { lat: 47.07749, lng: 15.43124 };
const CORRECT_CODE = '1234';

interface GrazEasterEggProps {
  onClose: () => void;
}

const GrazEasterEgg: React.FC<GrazEasterEggProps> = ({ onClose }) => {
  // State
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [numpadVisible, setNumpadVisible] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [alreadyOnLeaderboard, setAlreadyOnLeaderboard] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  // Refs
  const numpadRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);
  const isProcessingClick = useRef(false);

  // Function to send data to the server
  const sendRowToServer = async (username: string) => {
    try {
      setIsSubmitting(true);
      
      // First, get all the existing data from the leaderboard
      const readResponse = await fetch("https://graz-leaderboard-b38087ab62cf.herokuapp.com/read", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!readResponse.ok) {
        console.error("Failed to read leaderboard data");
        return {
          success: false,
          alreadyExists: false,
          rank: null
        };
      }
      
      // Parse the leaderboard data
      let leaderboardData;
      try {
        const responseText = await readResponse.text();
        
        // Check if the response is empty or whitespace
        if (!responseText || !responseText.trim()) {
          console.log("Server returned empty response, assuming empty leaderboard");
          leaderboardData = [];
        } else {
          // Try to parse the JSON
          leaderboardData = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error("Error parsing leaderboard JSON:", parseError);
        // Fallback to empty array if parsing fails
        leaderboardData = [];
      }
      
      // Check if user already exists and find their rank if they do
      let userExists = false;
      let userRank: number | null = null;
      
      // First, validate that we have an array of entries
      if (Array.isArray(leaderboardData) && leaderboardData.length > 0) {
        // Create a map to track unique usernames and their first occurrence
        const userRankMap = new Map<string, number>();
        let rankCounter = 1;
        
        // Filter out duplicate users and assign ranks
        leaderboardData.forEach(entry => {
          // Entry format is [number, username, date, time]
          if (Array.isArray(entry) && entry.length >= 2) {
            const entryUsername = String(entry[1]).toLowerCase(); // Normalize username to lowercase
            const currentUsername = username.toLowerCase(); // Normalize input username to lowercase
            
            // If this username hasn't been seen before, assign it a rank
            if (!userRankMap.has(entryUsername)) {
              userRankMap.set(entryUsername, rankCounter++);
            }
            
            // Check if this is our current user (case insensitive comparison)
            if (entryUsername === currentUsername) {
              userExists = true;
            }

          }
        });
        
        // If user exists, get their rank
        if (userExists) {
          const rank = userRankMap.get(username.toLowerCase());
          userRank = rank !== undefined ? rank : null;
          console.log(`User ${username} already exists on leaderboard with rank ${userRank}`);
          
          return {
            success: true,
            alreadyExists: true,
            rank: userRank
          };
        }
        
        // If user doesn't exist, their rank is the next number in sequence
        userRank = rankCounter;
      } else {
        // If there's no valid data, this user will be the first entry
        userRank = 1;
      }
      
      // Create the new row
      const now = new Date();
      const date = now.toLocaleDateString("en-US");
      const time = now.toLocaleTimeString("en-US");

      // Store the actual rank in the row data (not the index)
      // This way the rank is directly readable from the leaderboard data
      const row = [userRank, username, date, time];

      console.log(`Adding ${username} to leaderboard with rank ${userRank}`);

      // Send data to server
      try {
        const response = await fetch("https://graz-leaderboard-b38087ab62cf.herokuapp.com/append", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [row],
          }),
        });

        if (response.ok) {
          console.log("Row added to leaderboard with rank", userRank);
          return {
            success: true,
            alreadyExists: false,
            rank: userRank
          };
        } else {
          const errorText = await response.text();
          console.error("Failed to add row to leaderboard:", errorText);
          return {
            success: false,
            alreadyExists: false,
            rank: null
          };
        }
      } catch (appendError) {
        console.error("Error appending to leaderboard:", appendError);
        return {
          success: false,
          alreadyExists: false,
          rank: null
        };
      }
    } catch (error) {
      console.error("Error submitting to leaderboard:", error);
      return {
        success: false,
        alreadyExists: false,
        rank: null
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize numpad as hidden
  useEffect(() => {
    // Make sure numpad is initially hidden
    setNumpadVisible(false);
    setShowLoginPrompt(false);
  }, []);

  // Handle marker click
  const handleMarkerClick = () => {
    if (!isLoggedIn) {
      // Show login prompt if not logged in
      setShowLoginPrompt(true);
    } else {
      // Show numpad if logged in
      setNumpadVisible(true);
      
      // Reset code and message when opening
      setCode('');
      setMessage('');
      setIsSuccess(false);
      setShowSuccessMessage(false);
    }
  };

  // Handle login success
  const handleLogin = (loggedInUsername: string, token?: string) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername);
    setShowLoginPrompt(false);
    
    // Show numpad after successful login
    setNumpadVisible(true);
  };

  // Handle login error
  const handleLoginError = (errorMessage: string) => {
    console.error(errorMessage);
    setMessage(errorMessage);
    
    // Clear error message after a delay
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  // Handle clicking a digit
  const handleDigitClick = (digit: string) => {
    // Add digit if we have space
    if (code.length < 4) {
      setCode(prevCode => prevCode + digit);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setCode('');
    setMessage('');
    setShowSuccessMessage(false);
  };

  // Handle submit button
  const handleSubmit = async () => {
    if (code === CORRECT_CODE) {
      setIsSuccess(true);
      setIsSubmitting(true);
      
      try {
        // Send data to server
        const result = await sendRowToServer(username);
        
        // Update message based on server response
        if (result.success) {
          if (result.alreadyExists) {
            console.log(`${username} is already on leaderboard with rank ${result.rank}`);
            setShowSuccessMessage(true);
            
            // Set a flag to indicate the user already exists
            setAlreadyOnLeaderboard(true);
            // Store the user's rank for display
            setUserRank(result.rank);
          } else {
            console.log(`Successfully recorded ${username}'s achievement`);
            setShowSuccessMessage(true);
            setAlreadyOnLeaderboard(false);
            setUserRank(result.rank);
          }
        } else {
          console.warn(`Failed to record ${username}'s achievement, but continuing`);
          setShowSuccessMessage(true);
          setAlreadyOnLeaderboard(false);
        }
      } catch (error) {
        console.error("Error in submission process:", error);
      } finally {
        setIsSubmitting(false);
        
        // Keep the success message displayed for a bit before closing
        setTimeout(() => {
          setNumpadVisible(false);
          onClose();
        }, 6000);
      }
    } else {
      setMessage('Incorrect code. Please try again.');
      setTimeout(() => {
        setCode('');
        setMessage('');
      }, 3000);
    }
  };

  // Close numpad button
  const handleCloseNumpad = () => {
    setNumpadVisible(false);
  };
  
  // Close login prompt
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Setup click outside detection to close numpad
  useEffect(() => {
    if (!numpadVisible && !showLoginPrompt) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (isProcessingClick.current) return;
      
      // Skip if refs aren't set or marker isn't set
      if (!marker) return;
      
      const target = e.target as Node;
      
      // Check if click is outside marker
      const isOutsideMarker = !marker.element.contains(target);
      
      // Check if click is outside numpad (if numpad is visible)
      const isOutsideNumpad = numpadVisible && numpadRef.current ? !numpadRef.current.contains(target) : true;
      
      // Check if click is outside login prompt (if login prompt is visible)
      const isOutsideLogin = showLoginPrompt && loginRef.current ? !loginRef.current.contains(target) : true;
      
      // If click is outside everything visible, close appropriate dialogs
      if (isOutsideMarker) {
        if (numpadVisible && isOutsideNumpad) {
          setNumpadVisible(false);
        }
        
        if (showLoginPrompt && isOutsideLogin) {
          setShowLoginPrompt(false);
        }
      }
    };

    // Add listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [numpadVisible, showLoginPrompt, marker]);

  // Create the numpad buttons
  const renderButton = (label: string, onClick: () => void, className: string = '') => {
    return (
      <a 
        className={`numpad-button ${className}`}
        onClick={onClick}
        type="button"
      >
        {label}
      </a>
    );
  };

  return (
    <div className="graz-easter-egg-container">
      {/* Marker */}
      <AdvancedMarker
        ref={markerRef}
        position={GRAZ_COORDINATES}
        onClick={handleMarkerClick}
      >
        <div 
          className={`graz-marker ${isHovered ? 'hovered' : ''}`}
          onClick={handleMarkerClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="marker-icon">🗺️</div>
        </div>
      </AdvancedMarker>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="numpad-overlay">
          <div 
            className="login-container"
            ref={loginRef}
          >
            <div className="numpad-header">
              <h3>Login Required</h3>
              <a 
                className="close-button" 
                onClick={handleCloseLoginPrompt}
                href="#"
              >
                ×
              </a>
            </div>
            
            <p>Please sign in with your Hive account to unlock the secret code:</p>
            
            <HiveAuth 
              onLogin={handleLogin}
              onError={handleLoginError}
            />
          </div>
        </div>
      )}

      {/* Numpad */}
      {numpadVisible && (
        <div className="numpad-overlay">
          <div 
            className="numpad-container"
            ref={numpadRef}
          >
            <div className="numpad-header">
              <h3>Enter Secret Code</h3>
              <a 
                className="close-button" 
                onClick={handleCloseNumpad}
                href="#"
              >
                ×
              </a>
            </div>
            
            <div className="code-display">
              <div className="code-digits">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="code-digit">
                    {code[i] || '•'}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Success/Error Message */}
            {(message || showSuccessMessage) && (
              <div className={`message ${isSuccess ? 'success' : 'error'}`}>
                {isSuccess ? (
                  isSubmitting ? (
                    <>
                      <div className="loading-spinner"></div>
                      <div className="submitting-text">Recording your achievement...</div>
                    </>
                  ) : (
                    <>
                      <div className="success-text">
                        <div className="success-emoji">🎉🎉🎉</div>
                        <div className="success-title">Congratulations {username}!</div>
                        {alreadyOnLeaderboard ? (
                          <>
                            <div className="success-subtitle">You're already on the leaderboard!</div>
                            <div className="success-subtitle">Your rank: #{userRank}</div>
                            <div className="success-subtitle">
                              <a href="/GrazAndSeek-Leaderboard" className="leaderboard-link">View Leaderboard</a>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="success-subtitle">You've solved the code!</div>
                            <div className="success-subtitle">You've been added to the leaderboard!</div>
                            {userRank !== null && (
                              <div className="success-subtitle">Your rank: #{userRank}</div>
                            )}
                            <div className="success-subtitle">
                              <a href="/GrazAndSeek-Leaderboard" className="leaderboard-link">View Leaderboard</a>
                            </div>
                          </>
                        )}
                        <div className="success-emoji">🎉🎉🎉</div>
                      </div>
                    </>
                  )
                ) : (
                  <div>
                    <span className="error-icon">❌</span>
                    <div className="error-text">{message}</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="numpad-grid">
              {/* First row */}
              {renderButton('1', () => handleDigitClick('1'))}
              {renderButton('2', () => handleDigitClick('2'))}
              {renderButton('3', () => handleDigitClick('3'))}
              
              {/* Second row */}
              {renderButton('4', () => handleDigitClick('4'))}
              {renderButton('5', () => handleDigitClick('5'))}
              {renderButton('6', () => handleDigitClick('6'))}
              
              {/* Third row */}
              {renderButton('7', () => handleDigitClick('7'))}
              {renderButton('8', () => handleDigitClick('8'))}
              {renderButton('9', () => handleDigitClick('9'))}
              
              {/* Fourth row */}
              {renderButton('C', handleClear, 'clear')}
              {renderButton('0', () => handleDigitClick('0'))}
              {renderButton('✓', handleSubmit, 'submit')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrazEasterEgg; 
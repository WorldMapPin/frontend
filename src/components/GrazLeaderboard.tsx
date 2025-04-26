import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './GrazLeaderboard.css';

// Use a fallback for the logo
const LogoComponent = () => {
  return (
    <h2 style={{ margin: '10px 0', color: '#4d7ea8', fontWeight: 'bold' }}>WorldMapPin</h2>
  );
};

interface LeaderboardEntry {
  rank: number;
  username: string;
  date: string;
  time: string;
}

const GrazLeaderboard: React.FC = () => {
  // State variables
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState<string>('');
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
  const [slice, setSlice] = useState(20);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const leaderboardContentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Function to create a single matrix digit
  const createMatrixDigit = (container: HTMLDivElement, width: number, height: number) => {
    const digit = document.createElement('div');
    digit.className = 'matrix-digit';
    
    // Randomly assign brightness variations
    const brightnessRoll = Math.random();
    if (brightnessRoll > 0.85) {
      digit.classList.add('bright'); // 15% chance of being bright
    } else if (brightnessRoll > 0.6) {
      digit.classList.add('medium'); // 25% chance of being medium
    }
    
    // Generate a character for the matrix
    const roll = Math.random();
    if (roll > 0.8) {
      // Binary (20% chance)
      digit.textContent = Math.random() > 0.5 ? '0' : '1';
    } else if (roll > 0.6) {
      // Numbers (20% chance)
      digit.textContent = Math.floor(Math.random() * 10).toString();
    } else if (roll > 0.3) {
      // Special characters (30% chance)
      const specialChars = '!@#$%^&*()[]{}|;:,.<>?/\\=+-_';
      digit.textContent = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    } else {
      // Letters (30% chance)
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      digit.textContent = letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Random positioning
    const left = Math.random() * width;
    const top = Math.random() * height;
    digit.style.left = `${left}px`;
    digit.style.top = `${top}px`;
    
    // Random speed
    const duration = 5 + Math.random() * 10;
    digit.style.animationDuration = `${duration}s, ${2 + Math.random() * 3}s`; // Fall and pulse durations
    
    // Add to container
    container.appendChild(digit);
    
    // Remove after animation completes
    setTimeout(() => {
      if (digit.parentNode === container) {
        container.removeChild(digit);
      }
    }, duration * 1000);
  };

  // Add matrix effect to container
  const applyMatrixEffect = (container: HTMLDivElement) => {
    if (!container) return;
    
    // Clear any existing digits
    const existingDigits = container.querySelectorAll('.matrix-digit');
    existingDigits.forEach(digit => digit.remove());
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || window.innerHeight;
    
    // Determine number of digits based on container size
    const density = 0.3; // Lower number means fewer digits
    const area = containerWidth * containerHeight;
    const digitCount = Math.max(30, Math.floor(area * density / 10000));
    
    // Create initial digits
    for (let i = 0; i < digitCount; i++) {
      createMatrixDigit(container, containerWidth, containerHeight);
    }
    
    // Create new digits periodically
    const interval = setInterval(() => {
      if (container && document.body.contains(container)) {
        createMatrixDigit(container, containerWidth, containerHeight);
      } else {
        clearInterval(interval);
      }
    }, 200);
    
    return interval;
  };

  // Apply matrix effect to title
  useEffect(() => {
    const titleContainer = titleContainerRef.current;
    if (!titleContainer) return;
    
    const interval = applyMatrixEffect(titleContainer);
    return () => clearInterval(interval);
  }, []);

  // Apply matrix effect to the entire leaderboard content
  useEffect(() => {
    const leaderboardContent = leaderboardContentRef.current;
    if (!leaderboardContent) return;
    
    const interval = applyMatrixEffect(leaderboardContent);
    
    // Refresh the effect when new data is loaded
    return () => clearInterval(interval);
  }, [leaderboardData, slice]);

  // Fetch leaderboard data on component mount
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Function to fetch leaderboard data
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("https://graz-leaderboard-b38087ab62cf.herokuapp.com/read", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard data: ${response.status}`);
      }

      // Parse the leaderboard data
      let rawData;
      try {
        const responseText = await response.text();
        
        // Check if the response is empty or whitespace
        if (!responseText || !responseText.trim()) {
          console.log("Server returned empty response, assuming empty leaderboard");
          rawData = [];
        } else {
          // Try to parse the JSON
          rawData = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error("Error parsing leaderboard JSON:", parseError);
        throw new Error('Failed to parse leaderboard data');
      }

      if (!Array.isArray(rawData)) {
        throw new Error('Leaderboard data is not in the expected format');
      }

      // Process the raw data into a more usable format
      // Create a map to track unique usernames and their earliest entry
      const userMap = new Map<string, LeaderboardEntry>();
      
      rawData.forEach(entry => {
        if (Array.isArray(entry) && entry.length >= 4) {
          const rank = Number(entry[0]);
          const username = String(entry[1]);
          const date = String(entry[2]);
          const time = String(entry[3]);
          
          const lowercaseUsername = username.toLowerCase();
          
          // Only keep the earliest entry for each user (first one we encounter)
          if (!userMap.has(lowercaseUsername)) {
            userMap.set(lowercaseUsername, {
              rank,
              username,
              date,
              time
            });
          }
        }
      });
      
      // Convert the map to an array and sort by rank
      const processedData = Array.from(userMap.values())
        .sort((a, b) => a.rank - b.rank);
      
      setLeaderboardData(processedData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    try {
      // Handle date in format MM/DD/YYYY
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const month = parts[0];
        const day = parts[1];
        const year = parts[2];
        return `${month}/${day}/${year}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchUsername.trim()) {
      const normalizedSearch = searchUsername.toLowerCase();
      const foundUser = leaderboardData.find(
        entry => entry.username.toLowerCase() === normalizedSearch
      );
      
      if (foundUser) {
        // Highlight the user and scroll to them
        setHighlightedUser(foundUser.username.toLowerCase());
        
        // Ensure we show enough entries to include the user
        const userIndex = leaderboardData.findIndex(
          entry => entry.username.toLowerCase() === normalizedSearch
        );
        if (userIndex >= slice) {
          setSlice(userIndex + 5); // Show a few more entries after the user
        }
        
        // Scroll to the user entry after the component updates
        setTimeout(() => {
          const userElement = document.getElementById(`user-${normalizedSearch}`);
          if (userElement) {
            userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        alert("User not found on the leaderboard");
      }
    }
  };

  // Handle loading more entries
  const handleLoadMore = () => {
    setSlice(prevSlice => prevSlice + 20);
  };

  // Handle closing the leaderboard
  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="leaderboard-side-tab open">
      <div className="content">
        <div className="leaderboard-title-container" ref={titleContainerRef}>
          <div className="close-leaderboard-btn" onClick={handleClose}>×</div>
          <h1 className="graz-title">GrazAndSeek <span>Leaderboard</span></h1>
          <p className="graz-subtitle">Secret Code Solvers Hall of Fame</p>
        </div>

        {/* Search form */}
        <div className="leaderboard-input-div">
          <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', height: '100%' }}>
            <input
              type="text"
              className="leaderboard-input"
              placeholder="Search by username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
            <a 
              type="submit" 
              className="leaderboard-input-btn"
              onClick={(e) => {
                e.preventDefault();
                handleSearch(e);
              }}
            >
              Search
            </a>
          </form>
        </div>

        {/* Leaderboard headers */}
        <div className="leaderboard-header-2">
          <div className="placement-header">Rank</div>
          <div className="username-header-2">Username</div>
          <div className="date-solved-header">Date Solved</div>
          <div className="time-solved-header">Time</div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="loading-spinner"></div>
            <p>Loading leaderboard data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>Error: {error}</p>
            <button onClick={fetchLeaderboardData}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && leaderboardData.length === 0 && (
          <div className="empty-leaderboard">
            <p>No entries found on the leaderboard yet. Be the first one to solve the puzzle!</p>
          </div>
        )}

        {!isLoading && !error && leaderboardData.length > 0 && (
          <div className="leaderboard-entries-container" ref={leaderboardContentRef}>
            {leaderboardData.slice(0, slice).map((entry, index) => {
              const isHighlighted = highlightedUser === entry.username.toLowerCase();
              return (
                <div
                  id={`user-${entry.username.toLowerCase()}`}
                  key={index}
                  className={`leaderboard-summary ${isHighlighted ? 'highlight-border' : ''}`}
                >
                  <li>
                    <div className="leaderboard-profile-content">
                      <small>                 
                        #{entry.rank}
                      </small>
                      <div className="leaderboard-user-info">
                        <div className="user-avatar">
                          <img 
                            src={`https://images.hive.blog/u/${entry.username}/avatar/small`} 
                            alt={`${entry.username}'s avatar`}
                            onError={(e) => {
                              // Fallback image if avatar fails to load
                              e.currentTarget.src = 'https://images.hive.blog/u/default/avatar/small';
                            }}
                          />
                        </div>
                        <Link
                          to={`/@${entry.username}`}
                          className="leaderboard-username-link"
                        >
                          {entry.username}
                        </Link>
                      </div>
                      <div className="date-time-container">
                        <span className="date-solved">{formatDate(entry.date)}</span>
                        <span className="time-solved">{entry.time}</span>
                      </div>
                    </div>
                  </li>
                </div>
              );
            })}

            {leaderboardData.length > slice && (
              <div className="next-users">
                <p onClick={handleLoadMore}>Load More Users →</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrazLeaderboard; 
import React, { useEffect, useState } from 'react';
import './SlidingTab.css';
import { InfoWindowContent } from './info-window-content';

function SlidingTab({ infowindowData, username, pinCount }) {
  const [isOpen, setIsOpen] = useState(false);

  // Open the tab whenever infowindowData is updated
  useEffect(() => {
    if (infowindowData) {
      setIsOpen(true); // Open the tab when infowindowData is provided
    }
  }, [infowindowData]);

  const closeTab = () => {
    setIsOpen(false);
  };

  return (
    <div>
      {/* Sliding tab */}
      <div className={`side-tab ${isOpen ? 'open' : ''}`}>
        {/* Close button inside the tab */}
        <a href="javascript:void(0);" className="close-btn" onClick={closeTab}>×</a>

        {/* Content inside the sliding tab */}
        <div className="content">
          {isOpen ? (
            <div>
              <InfoWindowContent features={infowindowData} />
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlidingTab;
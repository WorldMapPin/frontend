import * as React from 'react';
import { useEffect, useState } from 'react';
import type {MapConfig} from '../app';
import './mapStyles.css'

type ControlPanelProps = {
  mapConfigs: MapConfig[];
  mapConfigId: string;
  onMapConfigIdChange: (id: string) => void;
  showAllPosts?: boolean;
  onToggleAllPosts?: () => void;
  isLowPerformanceDevice?: boolean;
};

function ControlPanel({
  mapConfigs,
  mapConfigId,
  onMapConfigIdChange,
  showAllPosts = false,
  onToggleAllPosts = () => {},
  isLowPerformanceDevice = false
}: ControlPanelProps) {
  // State to track processing state for visual feedback
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create a function to handle toggle click with better logging
  const handleToggleClick = () => {
    console.log("Toggle clicked - current state:", showAllPosts, "low performance:", isLowPerformanceDevice);
    
    // Only show processing state for low-performance devices
    if (isLowPerformanceDevice) {
      // Set processing state for visual feedback
      setIsProcessing(true);
      
      // Clear processing state after a delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 800);
    }
    
    onToggleAllPosts();
  };

  // Determine tooltip text based on performance and toggle state
  const getTooltipText = () => {
    if (!isLowPerformanceDevice) {
      return "Your device automatically uses full data mode";
    } else if (isLowPerformanceDevice && showAllPosts) {
      return "Full data mode enabled - may be slower on your device";
    } else {
      return "Toggle to load all posts (may be slower)";
    }
  };

  return (
     
    <div className="control-panel2">
      <div className="map-config">
          <label htmlFor="map-config-select" className="map-config-label">Map Configuration</label>
          <select
              id="map-config-select"
              className="map-config-select"
              value={mapConfigId}
              onChange={ev => onMapConfigIdChange(ev.target.value)}>
              {mapConfigs.map(({ id, label }) => (
                  <option key={id} value={id}>
                      {label}
                  </option>
              ))}
          </select>
      </div>
      
      <div className="map-config toggle-container">
        <div className="toggle-switch-container control-panel-toggle">
          <span className="toggle-label">Load All Posts</span>
          <label 
            className={`toggle-switch ${!isLowPerformanceDevice ? 'disabled high-performance' : ''} ${isProcessing ? 'processing' : ''}`}
            title={getTooltipText()}
          >
            <input 
              type="checkbox"
              checked={showAllPosts}
              onChange={handleToggleClick}
              disabled={!isLowPerformanceDevice || isProcessing}
            />
            <span className="slider round"></span>
            {!isLowPerformanceDevice && <span className="green-tick">✓</span>}
            {isProcessing && <span className="processing-indicator"></span>}
          </label>
        </div>
      </div>
    </div>
    
  );
}
// <div className="search-bar-wrapper2">
export default React.memo(ControlPanel);
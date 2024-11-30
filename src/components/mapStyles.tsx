import * as React from 'react';
import type {MapConfig} from '../app';
import './mapStyles.css'

type ControlPanelProps = {
  mapConfigs: MapConfig[];
  mapConfigId: string;
  onMapConfigIdChange: (id: string) => void;
};

function ControlPanel({
  mapConfigs,
  mapConfigId,
  onMapConfigIdChange
}: ControlPanelProps) {
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
    </div>
    
  );
}
// <div className="search-bar-wrapper2">
export default React.memo(ControlPanel);
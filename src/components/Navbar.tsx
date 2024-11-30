import React, { useEffect, useRef, useState } from 'react';
import FilterComponent from './FilterComponent';
import { PlacePicker } from '@googlemaps/extended-component-library/react';
import { PlacePicker as TPlacePicker } from '@googlemaps/extended-component-library/place_picker.js';
import LogoPng from '../assets/worldmappin_claim_logo.png';
import ControlPanel from './mapStyles';
import './navbar.css';

import { isMenuOpen } from '../app'

function calculateZoomLevel(bounds, types) {
  const GLOBE_WIDTH = 256;
  let angle = bounds.ne.lng - bounds.sw.lng;

  if(types.includes("establishment")){
    const zoomMax = 20;
    return zoomMax;
  }

  if (angle < 0) {
      angle += 360;
  }
  const zoomMax = Math.round(Math.log(960 * 360 / angle / GLOBE_WIDTH) / Math.LN2);
  return zoomMax;
}

const Navbar = ({
    codeMode,
    onToggleCodeMode,
    onGetLocation,
    showFilterSettings,
    handleFilter,
    searchParams,
    setShowfiltersettings,
    setLocation,
    setMyLocationZoom,
    numOfPins,
    toggleMenuApp,
    isMobile,
    mapConfigs,
    mapConfigId,
    onMapConfigIdChange,
    toggleLeaderboard,
    handleCloseButtonLeaderboard,
}) => {
  // Declare pickerRef using useRef
  const pickerRef = useRef<TPlacePicker | null>(null);

  const [isMenuOpen2, setMenuOpen] = useState(false);
  const [showMapControls, setShowMapControls] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen2);
    toggleMenuApp();
    setShowMapControls(false);
  };

  const toggleShowfiltersettings = () => {
    setShowfiltersettings(current => !current)
  };

  const toggleShowMapControls = () => {
    setShowMapControls(!showMapControls);
    // const content = document.getElementById('settings-content');
    // content.classList.toggle('show');
  };

  const toggleShowMapControlsOnMobile = () => {
    setShowMapControls(!showMapControls);
    const content = document.getElementById('mobile-settings-content');
    content.classList.toggle('show');
  };

  if(!isMenuOpen && isMenuOpen2) {
    toggleMenu();
    toggleMenuApp();
  }
  
  const PlacePicker1 = ({ inputStyle, ...props }) => {
    return (
        <div>
            <input style={inputStyle} {...props} />            
        </div>
    );
};

  return (
    
    <div className="CS-container">
      {!isMobile && (
        <div>
        <div className="navbar-container">
          
        <ul className="navbar-ul">
          <li className='top-logo'><a href="/"><img src={LogoPng} alt="" width={175} style={{ height: 'auto' }} /></a></li>
          <li className="placePicker">
            <PlacePicker
                    className="LocationPicker"
                    ref={pickerRef}
                    forMap="gmap"
                    placeholder={`Search for a place | You are looking at ${numOfPins} Pins`}
                    onPlaceChange={() => {
                    if (!pickerRef.current?.value) {
                        setLocation(undefined);
                    } else {
                        setLocation(pickerRef.current?.value);                        
                        console.log(pickerRef.current?.value.viewport); // Here we get the bounds
                        let types = pickerRef.current?.value.types;

                        let viewport = pickerRef.current?.value.viewport;

                        let bounds = {
                          ne: { lat: Object.values(viewport)[0].hi, lng: Object.values(viewport)[1].hi },
                          sw: { lat: Object.values(viewport)[0].lo, lng: Object.values(viewport)[1].lo }
                        };    

                        const zoomLevel = calculateZoomLevel(bounds, types);        
                        setMyLocationZoom(zoomLevel);
                    }
                  }}
                  //onKeyDown={handleKeyPress}
                />
          </li>
          
          <div id="settingsbutton" className="button-container">
            {!codeMode && 
              <li><a><p className="settingsbutton" tabIndex={0} onClick={() => { toggleShowMapControls()}}>Settings</p></a>
                  <div className={`nav-settings-container ${showMapControls ? 'active' : ''}`}>
                  {showMapControls && <ControlPanel
                    mapConfigs={mapConfigs}
                    mapConfigId={mapConfigId}
                    onMapConfigIdChange={onMapConfigIdChange}
                  />}
                  </div>
              </li>
            }
          </div>
          <div className="button-container">
            <li><a><p id="open-leaderboard-button" onClick={toggleLeaderboard}>Leaderboard</p></a></li>            
            {(!codeMode) && <li><a><p onClick={() => { toggleShowfiltersettings()}}>Filter Map</p></a></li>}
            <li><a><p id="get-location-button" onClick={onGetLocation}>My Location</p></a></li>
            <li><a><p onClick={onToggleCodeMode} style={{ cursor: "pointer" }}>{codeMode ? "Browse Map" : "Get Code"}</p></a></li>            
          </div>
        </ul>

        {/* <div className="button-container">          
          <div className="settings-content" id="settings-content">                        
            {showMapControls && <ControlPanel
              mapConfigs={mapConfigs}
              mapConfigId={mapConfigId}
              onMapConfigIdChange={onMapConfigIdChange}
            />}
          </div>          
        </div> */}

        {/* Filter Container */}
        <div className="filter-container">
            {showFilterSettings && <FilterComponent onFilter={handleFilter} searchParams={searchParams} />}

            {showFilterSettings && 
                <div className='filter-close'>
                    <div className="close-btn"><p onClick={() => setShowfiltersettings(false)}>X</p></div>
                </div>
            }
        </div>

        </div>
        </div>
      )}

      {/*Mobile Menu*/}
      <div className={`burger-menu ${isMenuOpen2 ? 'open' : ''}`}
        onClick={() => {  toggleMenu(); }}
      >
        <div>
          <span></span>
          <span></span>
          <span></span>
        </div>
        </div> 
      <div className="circle-container-2">
      <div className="circle-2">
      <div className="circle4">   
        </div>
        </div>
      </div>

      {(isMenuOpen2 && isMenuOpen) && (
        <div className="navbar-container2">
        <div className="mobile-menu">

          <div className="LocationPickerContainer2">
              <PlacePicker
                className="LocationPicker2"
                ref={pickerRef}
                forMap="gmap"
                placeholder={`Search place | Viewing: ${numOfPins} Pins`}
                onPlaceChange={() => {
                if (!pickerRef.current?.value) {
                    setLocation(undefined);
                } else {
                    setLocation(pickerRef.current?.value);                        
                    console.log(pickerRef.current?.value.viewport); // Here we get the bounds
                    let types = pickerRef.current?.value.types;

                    let viewport = pickerRef.current?.value.viewport;
                    
                    let bounds = {
                      ne: { lat: Object.values(viewport)[0].hi, lng: Object.values(viewport)[1].hi },
                      sw: { lat: Object.values(viewport)[0].lo, lng: Object.values(viewport)[1].lo }
                    };

                    const zoomLevel = calculateZoomLevel(bounds, types);
                    setMyLocationZoom(zoomLevel);
                }
              }}
            />
          

            <div className="button-container2">
              <p onClick={() => {  onToggleCodeMode();}} style={{ cursor: "pointer" }}>
                {codeMode ? "Browse Map" : "Get Code"}
              </p>
              <p id="get-location-button" onClick={onGetLocation}>
                My Location
              </p>
              {!codeMode && <p onClick={() => { toggleShowfiltersettings(); handleCloseButtonLeaderboard();}}>filter the map</p>}
            </div>

            <div className="leaderboard-mobile-settings">
              <div className="mobile-leaderboard-container">
                {!codeMode && 
                  <p className="mobile-leaderboard-button" tabIndex={0} onClick={toggleLeaderboard}>
                    <span className="icon">🏆</span>
                  </p>
                }                
              </div>
            </div>

            <div className="mobile-settings">
              <div className="mobile-settings-container">
                        {!codeMode && <p className="mobile-settingsbutton" tabIndex={0} onClick={() => { toggleShowMapControlsOnMobile()}}>
                          <svg
                            width="32.000000pt" height="32.000000pt" viewBox="0 0 64.000000 64.000000"
                            preserveAspectRatio="xMidYMid meet">

                            <g transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)"
                            fill="#000000" stroke="none">
                            <path d="M276 526 c-8 -43 -35 -54 -71 -30 -26 17 -27 16 -52 -9 -25 -25 -26
                            -26 -9 -52 24 -36 13 -63 -30 -71 -32 -6 -34 -9 -34 -45 0 -36 2 -39 34 -45
                            41 -7 49 -27 28 -68 -13 -27 -12 -30 12 -55 25 -24 27 -25 53 -10 40 22 60 14
                            68 -27 6 -34 7 -35 48 -32 36 3 42 6 45 28 6 42 30 53 64 28 l30 -21 30 31 31
                            30 -21 30 c-25 34 -14 58 28 64 22 3 25 8 25 48 0 40 -3 45 -25 48 -41 5 -53
                            30 -30 62 l19 27 -30 29 c-29 28 -31 28 -59 12 -34 -19 -57 -8 -62 32 -3 22
                            -9 25 -44 28 -40 3 -42 2 -48 -32z m70 -116 c30 0 64 -47 64 -87 0 -50 -22
                            -80 -66 -92 -65 -18 -119 23 -119 89 0 54 53 108 93 94 8 -2 20 -4 28 -4z"/>
                            </g>
                          </svg>
                        </p>}                   
              </div>
            </div>

              <div className="mobile-settings-content" id="mobile-settings-content">                        
              {showMapControls && <ControlPanel
                mapConfigs={mapConfigs}
                mapConfigId={mapConfigId}
                onMapConfigIdChange={onMapConfigIdChange}
              />}
            </div>
          </div>

          {/* Filter container UI logic */}


          <div className="filter-container">

            {showFilterSettings && <FilterComponent onFilter={handleFilter} searchParams={searchParams} />}

            {showFilterSettings && <div className='filter-close'>
              <div className="close-btn"><p onClick={() => setShowfiltersettings(false)}>X</p>
              </div>
            </div>}

          </div>


        </div></div>
      )}
    </div>
  );
};

export default Navbar;

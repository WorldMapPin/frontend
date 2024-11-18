import React, { Ref, useCallback, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';

import { APIProvider, InfoWindow, Map, useMap, AdvancedMarker, ControlPosition, MapControl } from '@vis.gl/react-google-maps';

import { ClusteredMarkers } from './components/clustered-markers';

import logo from './assets/worldmappin-logo.png';
import logoWithText from './assets/worldmappin-logo-text.png';
import locationpng from './assets/location.png';

import {convertDatafromApitoGeojson} from './components/convertDataFromApi'

import './style.css';
import { Feature, Point } from 'geojson';

import SlidingTab from './components/slidingtab';
import FilterComponent from './components/FilterComponent';
import SlidingUserTab from './components/userSlidingTab';
import { InfoWindowContent } from './components/info-window-content';
import './components/SlidingTab.css';
import BottomLogoClick from './components/BottomLogoClick';

import { PlacePicker} from '@googlemaps/extended-component-library/react';

import { PlacePicker as TPlacePicker } from '@googlemaps/extended-component-library/place_picker.js';

import './components/SlidingUserTab.css';

//Navbar
import Navbar from './components/Navbar';

//Map Styles Controls
import ControlPanel from './components/mapStyles';

//Leaderboard
import Leaderboards from './components/Leaderboards'

export let setGlobalLocation: (location: google.maps.places.Place | undefined) => void;
export let setGlobalZoom: (zoom: number | undefined) => void;
export let mapZoom = 3;
export let isMenuOpen = false;

const API_KEY = (process.env.GOOGLE_MAPS_API_KEY as string) ?? globalThis.GOOGLE_MAPS_API_KEY;

const MapTypeId = {
  HYBRID: 'hybrid',
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  TERRAIN: 'terrain'
};

// Map styles
export type MapConfig = {
id: string;
label: string;
mapId?: string;
mapTypeId?: string;
styles?: google.maps.MapTypeStyle[];
};

const MAP_CONFIGS: MapConfig[] = [
  {
    id: 'light',
    label: 'Light',
    mapId: 'edce5dcfb5575af1',
    mapTypeId: MapTypeId.ROADMAP
  },
  {
    id: 'dark',
    label: 'Dark',
    mapId: '43f81235d4f33346',
    mapTypeId: MapTypeId.ROADMAP
  },
  {
    id: 'blackandwhite',
    label: 'Black / White',
    mapId: '739af084373f96fe',
    mapTypeId: MapTypeId.ROADMAP
  },
  {
    id: 'satellite',
    label: 'Satellite',
    mapId: 'edce5dcfb5575af1',
    mapTypeId: MapTypeId.SATELLITE
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    mapId: 'edce5dcfb5575af1',
    mapTypeId: MapTypeId.HYBRID
  },
  {
    id: 'terrain',
    label: 'Terrain',
    mapId: 'edce5dcfb5575af1',
    mapTypeId: MapTypeId.TERRAIN
  }
];

const App = () => {
  const [geojson, setGeojson] = useState(null);
  const [numClusters, setNumClusters] = useState(0);

  type MarkerPosition = {
    lat: number;
    lng: number;
  };

  // Define the state with the correct type
  const [codeModeMarker, setCodeModeMarker] = useState<MarkerPosition | null>(null);
  const [codeMode, setCodeMode] = useState(false);

  // Toggle code mode
  const toggleCodeMode = () => {
    setCodeMode(prevMode => !prevMode);
  };
  
  const [codeModeDescription, setCodeModeDescription] = useState("");
  const [copiedToClipBoard, setCopiedToClipboard] = useState(false);

  const pickerRef = useRef<TPlacePicker>(null);
  const [location, setLocation] = useState<google.maps.places.Place | undefined>(
    undefined
  );

  setGlobalLocation = setLocation;

  //Loading State
  const [loading, setLoading] = useState(true);

  const [fetchingMarkers, setFetchingMarkers] = useState(true);
  const [fetchingStats, setFetchingStats] = useState(false);

  const [performanceTest , setPerformanceTest] = useState(false);
  const [lowEndDevice , setLowEndDevice] = useState(false);

  const [showUsernameProfile, setShowUsernameProfile] = useState(false);

  let usernameProvided = false;
  var usernamep = '';

  let permlinkProvided = false;
  var permlinkP = '';

  const [showUsername, setShowUsername] = useState('');
  const [showUsersNumberOfPins, setShowUsersNumberOfPins] = useState(0);

  const [isbottomLogoClick, setIsbottomLogoClick] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  //Map Styles
  const [mapConfig, setMapConfig] = useState<MapConfig>(MAP_CONFIGS[0]);

  useEffect(() => {
    if (window.innerWidth < 1100) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }  
  })

  
  var loadedonce = false;
  const [firstLoad , setFirstLoad] = useState(false);
  
  const params = useParams();

  function YourComponent() {
    const { username } = useParams();       
    
    if (username.startsWith('@') && fetchingMarkers) {
      usernameProvided = true;
      usernamep = username.substring(1);
      useEffect(() => { 
        setShowUsername(usernamep);
        setShowUsernameProfile(true)
      });
    } else {
      usernameProvided = false;
    }
    return null
  }

  const [searchParams, setSearchParams] = useState(
    params?.username ? { author: params.username } : (params?.permlink ? { permlink: params.permlink } : (params?.tag ? { tags: [params?.tag] } : { curated_only: false }))
  );

  function PermLink() {
    const { permlink } = useParams();    
    
    if (permlink && fetchingMarkers) {
      permlinkProvided = true;
      permlinkP = permlink;      
    } else {
      permlinkProvided = false;
    }
    return null


  }

  const [showfiltersettings, setShowfiltersettings] = useState(false);
  const [youAreCurrenlyDisplayingNumPins, setYouAreCurrenlyDisplayingNumPins] = useState(0);

  function getOneMonthAgo() {
    const today = new Date();
    today.setMonth(today.getMonth() - 1);
    return today.toISOString().split('T')[0]; // Returns the date in 'YYYY-MM-DD' format
  }

  const handleFilter = filterData => {
    setFetchingMarkers(true)
    const oneMonthAgo = getOneMonthAgo();

    // console.log(usernameProvided)

    newSearchParams({
      tags: filterData && filterData.tags && filterData.tags.length && filterData.tags[0] ? filterData.tags : [],
      author: usernameProvided ? usernamep : filterData ? filterData.username : '',
      post_title: filterData ? filterData.postTitle : '',
      start_date: lowEndDevice ? oneMonthAgo : filterData ? filterData.startDate : '',
      end_date: filterData ? filterData.endDate : '',
      permlink: permlinkProvided ? permlinkP : '',
      curated_only: filterData ? filterData.isCurated : false
    });
    setLowEndDevice(false); // This is to make the filter work for the user (even though they probably won't be able to fetch 100k pins)
    setShowfiltersettings(false);
  };
  
  //Setting the loading state to false when map tiles loaded
  const handleTilesLoaded = () => {
    // setFetchingMarkers(false); // Set loading to false when tiles are loaded
  };
  
  //Handelsclick on Get Code Browser mode
  const handleClick = () => {
    setInfowindowData(undefined)
    setShowfiltersettings(false)
    toggleCodeMode();
    // if(codeMode)
    //   setFetchingMarkers(true);
  }


  // On reload the all markers with default search search params are loaded here
  useEffect(() => {
    // void loadCastlesGeojson().then(data => setGeojson(data));
    if(!loadedonce){
      if(!firstLoad){loadmarkersonfirstLoad();}
      setFetchingMarkers(true)
      loadedonce = true;      
    }
  }, [loadedonce, firstLoad, setLocation]);

  async function loadmarkersonfirstLoad() {

    try {
      // const response = await axios.post('https://worldmappin.com/api/marker/0/150000/', searchParams);
      // void convertDatafromApitoGeojson(response.data).then(data => setGeojson(data));   
      handleFilter(searchParams) 
    } catch (err) {
        console.error('Error fetching feature data:', err);
    } finally {
      setFirstLoad(true)      
    }
  }

  const [infowindowData, setInfowindowData] = useState<{
    anchor: google.maps.marker.AdvancedMarkerElement;
    features: Feature<Point>[];
  } | null>(null);

  // const hamdleInfoWindowClose = useCallback(
  //   () => setInfowindowData(null),
  //    [setInfowindowData]
  //  );


  const bounds = {
    north: 85,  // Upper bound (near the North Pole)
    south: -85, // Lower bound (near the South Pole)
    west: -180, // Left bound (Western Hemisphere)
    east: 180,  // Right bound (Eastern Hemisphere)
  };

  async function newSearchParams(s) {
    const updatedParams = { ...searchParams, ...s };

    setSearchParams(updatedParams); // This takes a little longer so it's better to pass the updatedParams directly to the api    
    setFetchingMarkers(true)
    try {
      const response = await axios.post('https://worldmappin.com/api/marker/0/150000/', updatedParams);
      // console.log(updatedParams)
      // console.log(response.data)
      void convertDatafromApitoGeojson(response.data).then(data => setGeojson(data));
      setYouAreCurrenlyDisplayingNumPins(response.data.length);
      if(updatedParams.author) {
        ifusername( response.data.length, updatedParams.author);         
      } else{
        setShowUsernameProfile(false)
      }

      if(updatedParams.permlink){
        const pos = {
          lat: response.data[0].lattitude,
          lng: response.data[0].longitude,
        };
        
        handlePosition(pos)

        // Update the user location in state
        setLocation({ location: pos });
        setMyLocationZoom(12);
      }

    } catch (err) {
        console.error('Error fetching feature data:', err);
    } finally {
      setTimeout(() => setFetchingMarkers(false), 100);
    }
  }

  function ifusername( length, username) {
    setShowUsernameProfile(true)
    setShowUsername(username)
    setShowUsersNumberOfPins(length)
  };

  //const map = useMap();
  const mapRef = useRef(null);
  const [mylocationzoom, setMyLocationZoom] = useState<number | undefined>(undefined);
  setGlobalZoom = setMyLocationZoom;
  const [displaymylocation, setDisplaymylocation] = useState(false);

  const [poss, setPoss] = useState({ lat: null, lng: null });

  function handlePosition(pos) {
    // Update the state with the new position
    setPoss({
      lat: pos.lat,
      lng: pos.lng,
    });
    
    // console.log("Position set to:", poss);
  }

  const handleClickBottomLogo = () => {
    setIsbottomLogoClick(true)
  }  

  function triggerWiggle() {
    const contentElement = document.querySelector('.logo-with-text img');
    
    // Check if the element exists
    if (!contentElement) return;
    
    // Remove the class if it exists, forcing a reflow
    contentElement.classList.remove('wiggle');
    
    // Add the class to start the animation
    contentElement.classList.add('wiggle');

    // Remove the class after the animation duration
    setTimeout(() => {
        contentElement.classList.remove('wiggle');
    }, 500); // Match the duration of the wiggle animation (0.5s)
  }

  useEffect(() => {
      const interval = setInterval(() => {
          triggerWiggle();

      }, 10000);

      // Cleanup the interval on component unmount
      return () => clearInterval(interval);
  }, []);

  //console.log(window.innerWidth)
  const handleCloseBottomLogoClick = () => {
    setIsbottomLogoClick(false);
  };

  function handleteaminfofetch() {
    // setFetchingMarkers(true)
    setFetchingStats(true)
  };

  function handleteaminfofetchdone() {
    // setFetchingMarkers(false)
    setFetchingStats(false)
  }

  useEffect(() => {
    if (showUsernameProfile) { // Assuming this is a prop or state indicating when to open the tab
      setShowUsernameProfile(true);
    }
  }, [showUsernameProfile]); // Re-run this effect if showUsernameProfile changes

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
  
          //poss = {lat: pos.lat, lng: pos.lng};
          handlePosition(pos)
  
          // Update the user location in state
          setLocation({ location: pos }); 
          setDisplaymylocation(true)
          setMyLocationZoom(16)
        },
        () => {
          console.log("Couldn't access your location");
        }
      );
    } else {
      // Browser doesn't support Geolocation
      console.log("Browser doesn't support Geolocation");
    }
  }

  // Sad times braught me here I used to live in a seperate file ;(
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


  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;

    // Toggle class name based on the state of isMenuOpen
    const container = document.querySelector('.circle-container, .circle-container-hide');
    if (container) {
        if (isMenuOpen) {
            container.classList.replace('circle-container', 'circle-container-hide');
        } else {
            container.classList.replace('circle-container-hide', 'circle-container');
        }
    }
  };

  const toggleMenu_close = () => {
    isMenuOpen = false;
    // Toggle class name based on the state of isMenuOpen
    const container = document.querySelector('.circle-container, .circle-container-hide');
    if (container) {
      container.classList.replace('circle-container-hide', 'circle-container');
    }
  };

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const handleCloseButtonLeaderboard = () => {
    setLeaderboardOpen(false);
  };

  const toggleLeaderboard = () => {
    setLeaderboardOpen(!leaderboardOpen);
  };

  return (
    <APIProvider apiKey={API_KEY} version={'beta'}>
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={null} /> */}
          <Route path="t/:tag" element={null} />                  
          <Route path="/:username" element={<YourComponent />} />
          <Route path="p/:permlink" element={<PermLink />} />
          <Route path="*" element={null} /> {/*TODO Add PAGE NOT FOUND*/}
        </Routes>
      </BrowserRouter>

      {/* <div className="LocationPickerContainer">
        <PlacePicker
          className="LocationPicker"
          ref={pickerRef}
          forMap="gmap"
          // ${'           '.repeat(15)}
          placeholder={`Search for a place | You are looking at ${youAreCurrenlyDisplayingNumPins} Pins`}
          onPlaceChange={() => {
            if (!pickerRef.current?.value) {
              setLocation(undefined);
            } else {
              setLocation(pickerRef.current?.value);
              setMyLocationZoom(9);
            }
          }}
        />
      </div> */}
      
      {(!isOpen || !isMobile ) && (
        <Navbar
          codeMode={codeMode}
          onToggleCodeMode={handleClick}
          onGetLocation={handleGetLocation}
          showFilterSettings={showfiltersettings}  // Pass the filter visibility state
          handleFilter={handleFilter}  // Pass the filter function
          searchParams={searchParams}  // Pass search params if needed
          setShowfiltersettings={setShowfiltersettings}
          setLocation={setLocation} 
          setMyLocationZoom={setMyLocationZoom}
          numOfPins={youAreCurrenlyDisplayingNumPins}
          toggleMenuApp={toggleMenu}
          isMobile={isMobile}
          mapConfigs={MAP_CONFIGS}
          mapConfigId={mapConfig.id}
          onMapConfigIdChange={id =>
            setMapConfig(MAP_CONFIGS.find(s => s.id === id)!)
          }
          toggleLeaderboard={toggleLeaderboard}
          handleCloseButtonLeaderboard={handleCloseButtonLeaderboard}
        />
      )}

      <div className="logo-with-text">
        <img onClick={handleClickBottomLogo} src={logoWithText} alt="" />
      </div>  
      
      {fetchingMarkers && <div className="loader-container">
          <div className="loader">
          <img src={logo} alt="" />
          </div>
          <p>Getting pins...</p>
        </div>}

      {fetchingStats && <div className="loader-container">
        <div className="loader">
        <img src={logo} alt="" />
        </div>
        <p>Loading stats...</p>
      </div>}

           
        <Map
          onTilesLoaded={handleTilesLoaded}          
          // mapId={'edce5dcfb5575af1'}
          mapId={mapConfig.mapId || null}
          mapTypeId={mapConfig.mapTypeId}
          styles={mapConfig.styles}
          defaultCenter={{ lat: 50, lng: 20 }}
          defaultZoom={1}
          minZoom={1}
          maxZoom={20}
          zoomControl={true}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          isFractionalZoomEnabled={false} // Todo check if this fixed zoom lvl 2
        
          // mapTypeControl={true}
          // mapTypeControlOptions={{
          //   position: window.google?.maps.ControlPosition.RIGHT_TOP,
          //   style: window.google?.maps.MapTypeControlStyle.DROPDOWN_MENU
          // }}

          fullscreenControl={false}

          streetViewControl={true}
          className={'custom-marker-clustering-map'}
          restriction={{
            latLngBounds: bounds,
            strictBounds: true,  // Enforces the restriction strictly
          }}

          center={location?.location}
          zoom={
            location?.location ? mylocationzoom : undefined //: undefined
          }          
          onIdle={(e) => {setLocation(undefined); setMyLocationZoom(undefined); mapZoom = e.map.getZoom();}}
          
          onClick={(e) => {
            // mapZoom = e.map.getZoom();

            if(codeMode){
              const latLng = e.detail?.latLng;

              const { lat, lng } = latLng;//Deconstruct latLng

              // Set the marker and reset clipboard state
              setCodeModeMarker({ lat, lng });
              setCopiedToClipboard(false);
            }            
          }}
        >          

          {!codeMode && geojson && (
            <ClusteredMarkers
              geojson={geojson}
              setNumClusters={setNumClusters}
              setInfowindowData={setInfowindowData}
            />
          )}          

          {codeMode &&
              <div className="code-mode-div">
              <input
                type="text"
                placeholder="Short description here"
                maxLength={250}
                onChange={(t) => {
                  setCodeModeDescription(t.target.value);
                }}
              />
              <p className="info-text">
                {codeModeMarker
                  ? copiedToClipBoard
                    ? "Copied successfully!"
                    : "Click the code to copy, then add it to your post on Hive."
                  : "Click on the map on the location of your post for the code to be generated."}
              </p>
              {codeModeMarker ? (
                <p
                  className="code-to-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "[//]:# (!worldmappin " +
                      codeModeMarker.lat.toFixed(5) +
                      " lat " +
                      codeModeMarker.lng.toFixed(5) +
                      " long " +
                      codeModeDescription +
                      " d3scr)"
                    );
                    setCopiedToClipboard(true);
                  }}
                >
                  {"[//]:# (!worldmappin " +
                    codeModeMarker.lat.toFixed(5) +
                    " lat " +
                    codeModeMarker.lng.toFixed(5) +
                    " long " +
                    codeModeDescription +
                    " d3scr)"}
                </p>
              ) : (
                <></>
              )}

            </div>           
          }

          {displaymylocation &&
            <AdvancedMarker 
            position={{ lat: poss.lat, lng: poss.lng }}            
            options = {{ scale: 0.3 }}
          ><img src={locationpng} width={32} height={32} /></AdvancedMarker>
          }          

          {codeMode && codeModeMarker && (
            <AdvancedMarker position={{ lat: codeModeMarker.lat, lng: codeModeMarker.lng }} />
          )}
      
          {infowindowData && (
            // <SlidingTab infowindowData={infowindowData.features} />
            <div>
              {/* Sliding tab */}
              <div className={`side-tab ${isOpen ? 'open' : ''}`}>
                {/* Close button inside the tab */}
                <a href="javascript:void(0);" className="close-btn" onClick={closeTab}>×</a>

                {/* Content inside the sliding tab */}
                <div className="content">
                  {isOpen ? (
                    <div>
                      <InfoWindowContent features={infowindowData.features} />
                    </div>
                  ) : (
                    <p>No data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isbottomLogoClick && (
            <BottomLogoClick onClose={handleCloseBottomLogoClick} onfetch={handleteaminfofetch} fetchdone={handleteaminfofetchdone}/>
          )}

          {/* Display the user slidingbar */}

          {/* {showUsernameProfile && (
            <SlidingUserTab userInfowindowData={geojson} username={showUsername} pinCount={showUsersNumberOfPins}/>
          )} */}

          {(showUsernameProfile) && (
              <SlidingUserTab userInfowindowData={geojson} username={showUsername.toLowerCase()} pinCount={showUsersNumberOfPins} toggleMenuApp={toggleMenu_close} isMobile={isMobile} handleCloseButtonLeaderboard={handleCloseButtonLeaderboard}/>
          )}

        </Map>        
        

        {leaderboardOpen && (
          <Leaderboards
            handleCloseButtonLeaderboard={handleCloseButtonLeaderboard}
            setGeojson={setGeojson}
            newSearchParams={newSearchParams}
            setLocation={setLocation}
            setMyLocationZoom={setMyLocationZoom}
          />
        )}
        
        
    </APIProvider>
  );
};


export default App;

export function renderToDom(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>      
      <App />
    </React.StrictMode>
  );
}
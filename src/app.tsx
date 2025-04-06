// Node process environment type
declare const process: {
  env: {
    GOOGLE_MAPS_API_KEY?: string;
    [key: string]: string | undefined;
  }
};

import React, { Ref, useCallback, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';

import { APIProvider, InfoWindow, Map, useMap, AdvancedMarker, ControlPosition, MapControl } from '@vis.gl/react-google-maps';

// Import performance utilities from the new module
import { initPerformanceCheck, NavigatorWithMemory, isExtremelySlowConnection, isSlowConnection, getNetworkSpeed } from './utils/performanceCheck';

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

// Add this type definition near the other type definitions
type SearchParams = {
  tags?: string[];
  author?: string;
  post_title?: string;
  start_date?: string;
  end_date?: string;
  permlink?: string;
  curated_only?: boolean;
};

const App = () => {
  const [geojson, setGeojson] = useState(null);
  const [numClusters, setNumClusters] = useState(0);
  const [performanceCheckComplete, setPerformanceCheckComplete] = useState(false);

  // Initialize lowEndDevice based on the performance check
  const [lowEndDevice, setLowEndDevice] = useState(false);
  // Track the actual device performance detection result separately
  const [detectedLowEndDevice, setDetectedLowEndDevice] = useState(false);
  // Add state for showing all posts regardless of performance
  const [showAllPosts, setShowAllPosts] = useState(false);

  // Make sure performance check is complete before loading data
  useEffect(() => {
    // This ensures we complete the performance check before starting
    let isMounted = true;
    
    async function waitForPerformanceCheck() {
      try {
        const result = await initPerformanceCheck();
        if (isMounted) {
          // console.log("Performance detection result:", result);
          setDetectedLowEndDevice(result); // Store the detection result
          setLowEndDevice(result);         // Initially set lowEndDevice based on detection
          
          // If performance is good (not low-end), automatically set showAllPosts to true
          if (!result) {
            setShowAllPosts(true);
          }
          
          setPerformanceCheckComplete(true);
        }
      } catch (error) {
        console.error("Error waiting for performance check:", error);
        if (isMounted) {
          setPerformanceCheckComplete(true);
        }
      }
    }
    
    waitForPerformanceCheck();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Add a reference to track pending data loading operations
  const pendingDataLoadRef = useRef<number | null>(null);

  // Effect to update lowEndDevice when showAllPosts changes
  useEffect(() => {
    if (performanceCheckComplete) {
      if (showAllPosts) {
        // Override lowEndDevice to false when showing all posts
        setLowEndDevice(false);
        // console.log("Overriding to high-performance mode for full data load");
      } else {
        // Restore the actual detection result when not showing all posts
        setLowEndDevice(detectedLowEndDevice);
        // console.log("Restoring detected performance mode:", detectedLowEndDevice);
      }
    }
  }, [showAllPosts, performanceCheckComplete, detectedLowEndDevice]);

  // Add effect to reload data when showAllPosts changes - with cancellation support
  useEffect(() => {
    if (performanceCheckComplete && loadedonce) {
      try {
        // Cancel any pending operation
        if (pendingDataLoadRef.current) {
          clearTimeout(pendingDataLoadRef.current);
          pendingDataLoadRef.current = null;
          // console.log("Cancelled pending data load operation");
        }

        // Start new operation with a small delay to allow cancellation
        setFetchingMarkers(true);
        
        // Add a short delay to allow for quick toggling back
        pendingDataLoadRef.current = setTimeout(() => {
          // Check if the state is still the same after the delay
          // This prevents unnecessary data loads if the user toggled back quickly
          if (showAllPosts) {
            // console.log("Proceeding with full data mode load");
            loadmarkersonfirstLoad();
          } else if (detectedLowEndDevice) {
            // console.log("Proceeding with optimized mode for low-end device");
            loadmarkersonfirstLoad();
          }
          pendingDataLoadRef.current = null;
        }, 700); // Short delay to allow cancellation
        
        // Add a safety timeout to ensure loading state is reset after a delay
        const safetyTimer = setTimeout(() => {
          if (fetchingMarkers) {
            // console.log("Safety timeout: forcing loading state to false after showAllPosts change");
            setFetchingMarkers(false);
          }
        }, 30000); // 30 second safety timeout
        
        return () => {
          // Clean up timers when component unmounts or effect re-runs
          if (pendingDataLoadRef.current) {
            clearTimeout(pendingDataLoadRef.current);
            pendingDataLoadRef.current = null;
          }
          clearTimeout(safetyTimer);
        };
      } catch (error) {
        console.error("Error when toggling data mode:", error);
        setFetchingMarkers(false);
      }
    }
  }, [showAllPosts, performanceCheckComplete]);

  useEffect(() => {
    console.log("App state: lowEndDevice =", lowEndDevice, 
                "detected =", detectedLowEndDevice, 
                "showAllPosts =", showAllPosts);
  }, [lowEndDevice, detectedLowEndDevice, showAllPosts]);

  // Fix the MarkerPosition type declaration to use google.maps.LatLng
  type MarkerPosition = google.maps.LatLngLiteral;

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

  const [performanceTest, setPerformanceTest] = useState(false);

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

  // Add null check for username in the YourComponent function
  function YourComponent() {
    const { username } = useParams();       
    
    if (username && username.startsWith('@') && fetchingMarkers) {
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

  const [searchParams, setSearchParams] = useState<SearchParams>(
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

  const [openWinterChallengeOnceperLink, SetOpenWinterChallengeOnceperLink] = useState(true);
  const [showWinterchallangeTab, setShowWinterchallangeTab] = useState(false);

  function OpenWinterChallenge() {

    if(openWinterChallengeOnceperLink){
      setLeaderboardOpen(true);
      setShowWinterchallangeTab(true);

      SetOpenWinterChallengeOnceperLink(false);
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

  function getOneYearAgo() {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 1);
    return today.toISOString().split('T')[0]; // Returns the date in 'YYYY-MM-DD' format
  }

  const handleFilter = filterData => {
    setFetchingMarkers(true)
    const oneMonthAgo = getOneMonthAgo();
    const oneYearAgo = getOneYearAgo();

    // console.log(usernameProvided)

    newSearchParams({
      tags: filterData && filterData.tags && filterData.tags.length && filterData.tags[0] ? filterData.tags : [],
      author: usernameProvided ? usernamep : filterData ? filterData.username : '',
      post_title: filterData ? filterData.postTitle : '',
      start_date: (isExtremelySlowConnection() && !showAllPosts) ? oneMonthAgo : 
                 (lowEndDevice && !showAllPosts) ? oneYearAgo : 
                 filterData ? filterData.startDate : '',
      end_date: filterData ? filterData.endDate : '',
      permlink: permlinkProvided ? permlinkP : '',
      curated_only: filterData ? filterData.isCurated : false
    });
    setShowfiltersettings(false);
  };
  
  //Setting the loading state to false when map tiles loaded
  const handleTilesLoaded = () => {
    // setFetchingMarkers(false); // Set loading to false when tiles are loaded
  };
  
  //Handelsclick on Get Code Browser mode
  const handleClick = () => {
    setInfowindowData(null); // Using null instead of undefined
    setShowfiltersettings(false)
    toggleCodeMode();
    // if(codeMode)
    //   setFetchingMarkers(true);
  }


  // On reload the all markers with default search search params are loaded here
  useEffect(() => {
    // void loadCastlesGeojson().then(data => setGeojson(data));
    if(!loadedonce && performanceCheckComplete){
      if(!firstLoad){
        // console.log("Loading markers with lowEndDevice =", lowEndDevice);
        loadmarkersonfirstLoad();
      }
      setFetchingMarkers(true)
      loadedonce = true;      
    }
  }, [loadedonce, firstLoad, setLocation, lowEndDevice, performanceCheckComplete]);

  async function loadmarkersonfirstLoad() {
    try {
      // Apply filter with lowEndDevice taken into account, but respect showAllPosts
      const initialFilterParams: SearchParams = { ...searchParams };
      // console.log("Current state - lowEndDevice:", lowEndDevice, "showAllPosts:", showAllPosts);
      
      // Apply date filter based on device, network speed and mode
      if (isExtremelySlowConnection() && !showAllPosts) {
        // For extremely slow connections (<2 Kbps), apply strict limit with date filter
        initialFilterParams.start_date = getOneMonthAgo();
        // console.log(`Extremely slow connection detected (${getNetworkSpeed().toFixed(2)} Kbps). Loading last month's data only.`);
      } else if (lowEndDevice && !showAllPosts) {
        // For slow connections (<6 Kbps), load posts from last year
        initialFilterParams.start_date = getOneYearAgo();
        // console.log(`Slow connection detected (${getNetworkSpeed().toFixed(2)} Kbps). Loading last year's data.`);
      } else {
        // For normal connections or Full Data mode - load all posts without date filter
        initialFilterParams.start_date = '';
        // console.log("Loading ALL posts in full data mode");
      }
      
      handleFilter(initialFilterParams);
    } catch (err) {
        console.error('Error fetching feature data:', err);
    } finally {
      setFirstLoad(true);
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
    
    setSearchParams(updatedParams); 
    setFetchingMarkers(true);
    
    try {
      // Adjust data limit based on network speed and device performance
      let dataLimit = 150000; // Default high limit
      
      if (isExtremelySlowConnection() && !showAllPosts) {
        // For extremely slow connections (<2 Kbps), use strict limit of 5000
        dataLimit = 5000;
        // console.log(`Extremely slow connection detected (${getNetworkSpeed().toFixed(2)} Kbps). Limiting to ${dataLimit} markers.`);
      } else if (lowEndDevice && !showAllPosts) {
        // For slow connections (<6 Kbps), use medium limit fetching 1 year of data
        // console.log(`Slow connection detected (${getNetworkSpeed().toFixed(2)} Kbps). Setting higher limit with date filter.`);
      } else {
        // console.log("Using maximum data limit for full data mode");
      }
      
      // console.log(`Fetching up to ${dataLimit} markers based on device performance and settings`);
      
      const response = await axios.post(`https://worldmappin.com/api/marker/0/${dataLimit}/`, updatedParams);
      void convertDatafromApitoGeojson(response.data).then(data => setGeojson(data));
      setYouAreCurrenlyDisplayingNumPins(response.data.length);
      
      // if (lowEndDevice && !showAllPosts) {
      //   console.log(`Low-performance mode: Loaded ${response.data.length} markers (limited)`);
      // } else if (showAllPosts) {
      //   console.log(`Show All Posts mode: Loaded ${response.data.length} markers (full dataset)`);
      // }
      
      if(updatedParams.author) {
        ifusername(response.data.length, updatedParams.author);
      } else {
        setShowUsernameProfile(false);
      }

      if(updatedParams.permlink && response.data.length > 0){
        const pos = {
          lat: response.data[0].lattitude,
          lng: response.data[0].longitude,
        };
        
        handlePosition(pos)

        // Update the user location in state
        setLocation({ location: pos } as google.maps.places.Place);
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

  const [poss, setPoss] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

  // Fix the handlePosition function to use LatLngLiteral
  function handlePosition(pos: google.maps.LatLngLiteral) {
    // Update the state with the new position
    setPoss({
      lat: pos.lat || 0,
      lng: pos.lng || 0,
    });
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

  // Add state for toggle transition 
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  // Add state for performance indicator visibility
  const [showPerformanceIndicator, setShowPerformanceIndicator] = useState(true);

  // Effect to hide performance indicators after a delay
  useEffect(() => {
    if (performanceCheckComplete) {
      // Show indicator when performance check is complete
      setShowPerformanceIndicator(true);
      
      // Hide indicator after 10 seconds with animation
      const timer = setTimeout(() => {
        // Add fade-out class to indicators
        const indicators = document.querySelectorAll('.performance-indicator');
        indicators.forEach(indicator => {
          indicator.classList.add('fade-out');
        });
        
        // Set state after animation completes
        const hideTimer = setTimeout(() => {
          setShowPerformanceIndicator(false);
        }, 2000); // Match the animation duration
        
        return () => clearTimeout(hideTimer);
      }, 5000);
      
      // Clear timeout on unmount or when performance check changes
      return () => clearTimeout(timer);
    }
  }, [performanceCheckComplete, showAllPosts]);

  // Effect to re-show indicators briefly when toggling modes
  useEffect(() => {
    if (isTogglingMode) {
      // Remove fade-out class and show indicators
      setShowPerformanceIndicator(true);
      setTimeout(() => {
        const indicators = document.querySelectorAll('.performance-indicator');
        indicators.forEach(indicator => {
          indicator.classList.remove('fade-out');
        });
      }, 0);
      
      // Hide again after the toggling animation finishes with smooth fade
      const timer = setTimeout(() => {
        // Add fade-out class
        const indicators = document.querySelectorAll('.performance-indicator');
        indicators.forEach(indicator => {
          indicator.classList.add('fade-out');
        });
        
        // Set state after animation completes
        const hideTimer = setTimeout(() => {
          setShowPerformanceIndicator(false);
        }, 2000); // Match the animation duration
        
        return () => clearTimeout(hideTimer);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isTogglingMode]);

  // Add function to handle toggle of "Show All Posts"
  const handleToggleAllPosts = () => {
    // If device is high-performance (not low-end), don't allow toggling off
    if (!detectedLowEndDevice) {
      // console.log("High-performance device - toggle disabled");
      return; // No change for high-performance devices
    }
    
    // For low-end devices, allow toggling with immediate UI feedback
    const newValue = !showAllPosts;
    
    // Set visual feedback states
    setIsTogglingMode(true);
    setTimeout(() => setIsTogglingMode(false), 800);
    
    // Cancel any pending fetch operation
    if (pendingDataLoadRef.current) {
      clearTimeout(pendingDataLoadRef.current);
      pendingDataLoadRef.current = null;
      // console.log("Canceled pending operation");
    }
    
    // Set loading state
    setFetchingMarkers(true);
    
    // Set a short delay to allow cancellation
    pendingDataLoadRef.current = window.setTimeout(async () => {
      try {
        // Update the state
        setShowAllPosts(newValue);
        // console.log(`${newValue ? "Enabling" : "Disabling"} Full Data Mode on low-end device`);
        
        // Prepare parameters
        const params = { ...searchParams };
        
        // Apply date filter based on new showAllPosts value
        if (isExtremelySlowConnection() && !newValue) {
          // For extremely slow connections (<2 Kbps), apply strict limit with date filter
          params.start_date = getOneMonthAgo();
          // console.log(`Extremely slow connection detected (${getNetworkSpeed().toFixed(2)} Kbps). Loading last month's data only.`);
        } else if (detectedLowEndDevice && !newValue) {
          // For slow connections (<6 Kbps), load posts from last year
          params.start_date = getOneYearAgo();
          // console.log(`Slow connection detected (${getNetworkSpeed().toFixed(2)} Kbps). Loading last year's data.`);
        } else {
          // For normal connections or Full Data mode - load all posts without date filter
          params.start_date = '';
          // console.log("Loading ALL posts in full data mode");
        }
        
        // Using a high data limit since we're filtering by date instead
        const dataLimit = 150000;
        // console.log(`Fetching up to ${dataLimit} pins from ${params.start_date}`);
        
        // Make the API call directly
        const response = await axios.post(`https://worldmappin.com/api/marker/0/${dataLimit}/`, params);
        // console.log(`Fetched ${response.data.length} pins`);
        
        // Process the data
        const geoJsonData = await convertDatafromApitoGeojson(response.data);
        setGeojson(geoJsonData);
        setYouAreCurrenlyDisplayingNumPins(response.data.length);
        
        // Handle author information if needed
        if(params.author) {
          ifusername(response.data.length, params.author);
        }
        
        // Clear loading state
        setFetchingMarkers(false);
        pendingDataLoadRef.current = null;
      } catch (error) {
        console.error("Error loading pins:", error);
        setFetchingMarkers(false);
        pendingDataLoadRef.current = null;
      }
    }, 300);
  };

  return (
    <APIProvider apiKey={API_KEY} version={'beta'}>
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={null} /> */}
          <Route path="t/:tag" element={null} />                  
          <Route path="/:username" element={<YourComponent />} />
          <Route path="p/:permlink" element={<PermLink />} />
          <Route path="/winter-challenge" element={<OpenWinterChallenge />} />
          <Route path="*" element={null} /> {/*TODO Add PAGE NOT FOUND*/}
        </Routes>
      </BrowserRouter>

      {/* 
        Performance indicators:
        1. Slow Connection Mode - when device is detected as low-end and not showing all posts
        2. Very Slow Connection Mode - when connection is extremely slow (<2 Kbps) and not showing all posts
        3. Good Connection - when device is high-end
        4. Slow Connection With Full Data - when a slow connection user toggles to full data
      */}
      {performanceCheckComplete && showPerformanceIndicator && isExtremelySlowConnection() && !showAllPosts && (
        <div className={`performance-indicator very-slow ${isTogglingMode ? 'toggling' : ''}`}>
          <p>Very Slow Connection Mode</p>
        </div>
      )}

      {performanceCheckComplete && showPerformanceIndicator && !isExtremelySlowConnection() && detectedLowEndDevice && !showAllPosts && (
        <div className={`performance-indicator ${isTogglingMode ? 'toggling' : ''}`}>
          <p>Slow Connection Mode</p>
        </div>
      )}

      {performanceCheckComplete && showPerformanceIndicator && showAllPosts && detectedLowEndDevice && (
        <div className={`performance-indicator slow-with-full-data ${isTogglingMode ? 'toggling' : ''}`}>
          <p>Slow Connection - May Take Longer</p>
        </div>
      )}

      {performanceCheckComplete && showPerformanceIndicator && !detectedLowEndDevice && (
        <div className={`performance-indicator full-data recommended ${isTogglingMode ? 'toggling' : ''}`}>
          <p>Good Connection</p>
        </div>
      )}

      {/* <div className="LocationPickerContainer">
        <PlacePicker
          className="LocationPicker"
          ref={pickerRef}
          forMap="gmap"
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
          showFilterSettings={showfiltersettings}
          handleFilter={handleFilter}
          searchParams={searchParams}
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
          showAllPosts={showAllPosts}
          onToggleAllPosts={handleToggleAllPosts}
          isLowPerformanceDevice={detectedLowEndDevice}
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

              if (latLng) {
                // Set the marker and reset clipboard state
                setCodeModeMarker({ 
                  lat: latLng.lat, 
                  lng: latLng.lng 
                });
                setCopiedToClipboard(false);
              }
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
            showWinterchallangeTab={showWinterchallangeTab}
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

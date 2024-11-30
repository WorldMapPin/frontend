import React, { useEffect, useState, useRef, useCallback } from 'react';
import './SlidingUserTab.css';
import { InfoWindowContent } from './info-window-content';
import initializeClient from './initializeClient';
import { Client } from "@hiveio/dhive";
import axios from 'axios';

import mappinLogo from '../assets/noProfilefound.png';

import { isMenuOpen } from '../app'

let node;
let client;

if (node !== undefined) { client = new Client(node);}

const max = 1; // Maximum number of accounts to return

var onlyCallApiTwice = 2;
var usernamedifferent = "";

var sortedTDsAndHonerable_afterFirstLoad = [];

function SlidingUserTab({ userInfowindowData, username, pinCount, toggleMenuApp, isMobile, handleCloseButtonLeaderboard }) {

  async function initializeNode(){
    node = await initializeClient();  // Assume this function correctly initializes the client
    if (node !== undefined) {
      client = new Client(node);  // Initialize client after node is ready
      handleUsernameSubmit(username);
    }
  }

  const [isOpen, setIsOpen] = useState(false);
  const [profilePic, setProfilePic] = useState('path/to/default-profile-picture.png');
  const [profileDetails, setProfileDetails] = useState({
    name: '',
    about: '',
    location: '',
    website: '',
  });
  const [isMinimized, setIsMinimized] = useState(false); // State to toggle minimized view
  const userSideTabRef = useRef(null); // Reference to the sliding tab  
  const [sortedTDsAndHonerable, setSortedTDsAndHonerable] = useState<[number , string, number ][]>([]);
  const [rank, setRank] = useState(0);

  // Function to handle the username input and query the blockchain
  const handleUsernameSubmit = async (username) => {
    try {     
      const _accounts = await client.database.call('lookup_accounts', [username, max]);             
      if (_accounts.length > 0) {   
        setIsMinimized(true);
        setIsOpen(false);  
        const accountDetails = await client.database.call('get_accounts', [_accounts]);
        // console.log(accountDetails)
        if (accountDetails.length > 0) {
          const metadata = accountDetails[0].posting_json_metadata;          
          const parsedMetadata = JSON.parse(metadata);
          const userProfile = parsedMetadata.profile;
          const profileImage = userProfile?.profile_image;

          const unsername_alternative = accountDetails[0];          
          if (profileImage) setProfilePic(profileImage);
          setProfileDetails({
            name: userProfile?.name || unsername_alternative?.name,
            about: userProfile?.about || 'No description available',
            location: userProfile?.location || 'Location not specified',
            website: userProfile?.website || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      userNotFound();      
    }
  };

  async function loadRankingData() {
    if(sortedTDsAndHonerable_afterFirstLoad.length === 0){
        try {
            const response = await axios.get('https://worldmappin.com/api/ranking');
            console.log(response.data)
            const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
            setSortedTDsAndHonerable(formattedData);
            sortedTDsAndHonerable_afterFirstLoad = formattedData;
        } catch (err) {
            console.error('Error fetching ranking data:', err);
        }
    } else {
        setSortedTDsAndHonerable(sortedTDsAndHonerable_afterFirstLoad);
    }
    
    const index = sortedTDsAndHonerable.findIndex(entry => entry[1].toLowerCase() === username);
    if(index === -1){
      setRank(0);
    } else {
      setRank(sortedTDsAndHonerable[index][0]);
    }
    
  }

  useEffect(() => {
    if(usernamedifferent !== username) {
      if(isMobile){toggleMenuApp();}
      onlyCallApiTwice = 2;
    }

    if (onlyCallApiTwice) {
      initializeNode();
      onlyCallApiTwice = onlyCallApiTwice-1;
      usernamedifferent = username;
      setIsMinimized(true); 
    }

    loadRankingData();
  })

  const userNotFound = () => {

    setProfilePic(mappinLogo);
    setProfileDetails({
      name: 'Username not found',
      about: '',
      location: '',
      website: '',
    });

    // Redirect to the homepage - this is an upleasant re-route
    window.location.href = "/username-not-found";
  }

  // Open the tab whenever infowindowData is updated
  // useEffect(() => {
  //   initializeNode();
  //   if (userInfowindowData && node) {
  //     handleUsernameSubmit(username);
  //     setIsMinimized(true); // Open the tab when infowindowData is provided
  //   }
  // }, [userInfowindowData]);

  const openTab = () => {
    setIsOpen(true);
    setIsMinimized(false);
    handleCloseButtonLeaderboard();
  };

  const closeTab = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  return (
    <div>
      {/* Sliding tab */}
      <div ref={userSideTabRef} className={`user-side-tab ${isOpen ? 'open' : ''}`}>
        {/* Close button inside the tab */}
        <a href="javascript:void(0);" className="close-btn" onClick={closeTab}>
          ×
        </a>
        <div className="content">
          {/* User information */}
          <div className="profile-content">
          <div className="user-info">
            <div className='profile-column'>
              <img src={profilePic} alt={`${username}'s profile`} className="profile-picture" />
              <a href={`https://peakd.com/@${username}`} target="_blank" rel="noopener noreferrer" className="username-link">@{username}</a>
              {rank !== 0 && (<p className="rank">Curation Rank: {rank || 0}</p>)}
            </div>
          </div>
            {!isMinimized && (
              <div className="user-info">
                <div className="details-column">
                  <p className="username">{profileDetails.name}</p>
                  <p className="about">{profileDetails.about}</p>
                  <p className="location">{profileDetails.location}</p>
                  {profileDetails.website && (
                    <p className="user-website"><a href={profileDetails.website} target="_blank" rel="noopener noreferrer" className="website">
                      {profileDetails.website}
                    </a></p>
                  )}
                  <p className="pin-count">{pinCount || 0} Pins</p>                  
                </div>
              </div>
            )}
          </div>

          

          {/* Content inside the sliding tab */}
          {isOpen ? (
            <div>
              <InfoWindowContent features={userInfowindowData.features} showRank={false}/>
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>

      {/* Minimized profile picture */}
      {(isMinimized && !isOpen) && (
        <div className="circle-container"><div className="circle"><div className="circle2">    
            <div className="minimized-profile">
            <img
                src={profilePic}
                alt={`${username}'s profile`}
                className="minimized-profile-picture"
                onClick={openTab}
            />
            <div className="column-link-n-pin">
                <a href={`https://peakd.com/@${username}`} target="_blank" rel="noopener noreferrer" className="username-link">
                @{username}
                </a>
                <p className="pin-count-Minimized">{pinCount || 0} Pins</p>
            </div>
            </div>
        </div></div></div>
      )}
    </div>
  );
}

export default SlidingUserTab;
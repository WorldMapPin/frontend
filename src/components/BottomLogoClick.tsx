import React, { useEffect, useState } from 'react';
import './BottomLogoClick.css';
import { Client } from "@hiveio/dhive";
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import axios from 'axios'
import LineGraph from './LineGraph'
import initializeClient from './initializeClient'

let node;
let client;

const max = 1;

const usernameArray = [
  { username: 'detlev', description: 'Management' },
  { username: 'arcange', description: 'DevOps' },
  { username: 'lizanomadsoul', description: 'Management, Curation & Communication' },
  { username: 'ninaeatshere', description: 'Communication & Curation' },
  { username: 'louis88', description: 'Graphic Design, Testing & Communication' },
  { username: 'rivalzzz', description: 'Communication' },
  { username: 'godfish', description: 'Community' },
  { username: 'masterswatch', description: 'Frontend' },
  { username: 'uniforced', description: 'Frontend' },
  { username: 'sunsea', description: 'Enduser Testing' },
  { username: 'ybanezkim26', description: 'Curation' },
  { username: 'lauramica', description: 'Curation' },
  { username: 'glecerioberto', description: 'Curation' }
];

var onlyLoadonce = true;


var userProfiles_afterfirstload = []; 
var userProfiles = []; 
var results = [];

// Define a type for the continent count entries
var continentCounts = [];
var totalNumberOfPins = 0;

// Function to determine continent based on latitude and longitude
function getContinent(longitude, latitude) {
  if (latitude >= -60 && latitude <= 90) {
    if (longitude >= -170 && longitude <= -30 && latitude > 0) return 'North America';
    if (longitude >= -105 && longitude <= -35 && latitude <= 0) return 'South America';
    if (longitude >= -25 && longitude <= 50 && latitude >= 35) return 'Europe';
    if (longitude >= -20 && longitude <= 50 && latitude < 35 && latitude >= 0) return 'Africa';
    if (longitude >= 40 && longitude <= 180 && latitude >= 0) return 'Asia';
    if (longitude >= 110 && longitude <= 180 && latitude < 0) return 'Oceania';
  }
  if (latitude <= -60) {
    return 'Antarctica'
  };

  return 'Unknown';
}

// Function to sort pins by continent
function sortPinsByContinent(data) {
    const continents = {
        'North America': [],
        'South America': [],
        'Europe': [],
        'Africa': [],
        'Asia': [],
        'Oceania': [],
        'Antarctica': [],
        'Unknown': []
    };

    data.forEach(pin => {
        const continent = getContinent(pin.longitude, pin.lattitude);
        continents[continent].push(pin);
    });

    const counts = Object.keys(continents).map(key => ({
      continent: key,
      count: continents[key].length
    })).filter(entry => entry.continent !== 'Unknown');  // Filter out 'Unknown'

    // Sort continents by pin count in descending order
    counts.sort((a, b) => b.count - a.count);

    return counts;
}

const BottomLogoClick = ({ onClose, onfetch, fetchdone}) => {
  
  async function initializeNode(){
    node = await initializeClient();  // Assume this function correctly initializes the client
    if (node !== undefined) {
      client = new Client(node);  // Initialize client after node is ready
      fetchProfiles();
    }
  }

  const [onlyLoadDataOnce, setOnlyLoadDataOnce] = useState(true);
  
  // Fetch all pins
  const params = useParams();
  const [searchParams, setSearchParams] = useState(
    params?.username ? { author: params.username } : (params?.permlink ? { permlink: params.permlink } : (params?.tag ? { tags: [params?.tag] } : { curated_only: false }))
  );  

  const [userProfiles, setUserProfiles] = useState([]);

  async function loadpinsdata() {
    try {
      onfetch();
      const response = await axios.post('https://worldmappin.com/api/marker/0/150000/', searchParams);
      console.log(response.data)

      const sortedPins = sortPinsByContinent(response.data);
      totalNumberOfPins = response.data.length;
      if(sortedPins) {
        continentCounts = sortedPins;
      }      
    } catch (err) {
        console.error('Error fetching feature data:', err);
    } finally {
      fetchdone(); 
    }
  }  

  // Fetch profile details for each username
  const fetchProfiles = async () => {    
      const profiles = await Promise.all(
        usernameArray.map(async (user) => {
          let username = user.username
          let description = user.description
          try {
            const _accounts = await client.database.call('lookup_accounts', [username, max]);
            if (_accounts.length > 0) {
              const accountDetails = await client.database.call('get_accounts', [_accounts]);
              if (accountDetails.length > 0) {
                const metadata = accountDetails[0].posting_json_metadata;
                const parsedMetadata = JSON.parse(metadata);
                const userProfile = parsedMetadata.profile;
                const profileImage = userProfile?.profile_image || '../assets/noProfilefound.png';
                return { username, description, profileImage};
              }
            }
          } catch (error) {
            console.error('Error fetching accounts:', error);
          }
          return { username, description, profileImage: 'path/to/default-profile-picture.png' }; // Default profile image on error
        })
      );
      setUserProfiles(profiles);
      userProfiles_afterfirstload = profiles;    
  };

  const fetchData = async (filterParams) => {
    try {
      const response = await axios.post('https://worldmappin.com/api/marker/0/150000/', filterParams);
      // console.log(filterParams)
      // console.log(response.data)
      return response.data.length;  // Return data received from the API
    } catch (err) {
      console.error('Error fetching data:', err);
      return null;  // Return null in case of an error
    }
  };  

  useEffect(() => {    
    if(onlyLoadDataOnce){      
      if(onlyLoadonce){      
        initializeNode();     
        loadpinsdata();
        fetchthelast7days();
        setOnlyLoadDataOnce(false);
        onlyLoadonce = false;    
      }     
    }

    if(userProfiles_afterfirstload.length !== 0){
      setUserProfiles(userProfiles_afterfirstload);
    }
    
  }, []);

  function fetchthelast7days() {  
    const formattedResults = [];

    for (let i = 0; i < 7; i++) {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const endDate = new Date(startDate.getTime());
      endDate.setDate(startDate.getDate() + 1);

      const filterParams = {
        curated_only: searchParams.curated_only,
        tags: searchParams.tags,
        author: searchParams.author,
        post_title: searchParams.post_title,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        permlink: searchParams.permlink
      };
      
      fetchData(filterParams)
      .then(result => {
        const formattedDate = startDate.toISOString().split('T')[0];
        const dayLabel = `${formattedDate}: ${result}`;
        formattedResults.push(dayLabel);
        if (formattedResults.length === 7) {
          // Sort results by date
          formattedResults.sort((a, b) => new Date(a.split(': ')[0]) - new Date(b.split(': ')[0]));
          results = formattedResults
        }
      })
      .catch(error => {
        console.error(`Error fetching data for ${startDate.toDateString()}: `, error);
      });
    }

    //const formattedResults = counts.map((count, index) => `${7 - index} Days Ago: ${count}`);
    //console.log(formattedresults);  // This will log each day's result in the desired format
  };

  // console.log(continentCounts)
  // console.log(results);

  if(continentCounts.length !== 0 && node && userProfiles.length !== 0){
    return (
      <div className="overlay">
        <div className="modal" style={{ position: 'relative' }}>
          <p className="close-button-stats" onClick={onClose}>X</p>
          <div className="team-stats-container">
            <div className="left-section-team">            
                <h2>WorldMapPin Stats</h2>
                  <div className='overflowleft'>
                    <div className="total-pins-display">
                      <span>Total Pin Num.: </span>
                      <span> {totalNumberOfPins}</span>
                    </div>
                  <div className='stats-list'>
                    <div style={{  display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'normal', color: '#666' }}>Continent</span>
                      <span style={{ fontWeight: 'normal', color: '#666' }}>Pins</span>
                    </div>
                    {/* Divider */}
                    <hr style={{ borderTop: '1px solid #ccc' }} />
                    <ul>            
                      {continentCounts.map(({ continent, count }) => (
                        <li key={continent} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ marginRight: '10px' }}>{continent}</span>
                          <span>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: '30px', marginRight: '20px', marginBottom: '20px'}} >
                    <LineGraph results={results} />
                  </div>  
                </div>
            </div>
            <div className="middle"></div>
            <div className="right-section">
              <h2>Team</h2>
              <div className="team-members">
                {userProfiles.map((profile, index) => (
                  <a
                    key={index}
                    href={`https://peakd.com/@${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="username-link"
                  >
                    <div className="team-member">
                      <img
                        src={`https://images.hive.blog/u/${profile.username}/avatar`}
                        alt={`${profile.username}'s profile`}
                        className="profile-pic"
                      />
                      <span>{profile.username}</span>
                      <div className="profile_description">{profile.description}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
};

export default BottomLogoClick;

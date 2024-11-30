import React, { useEffect, useRef, useState } from 'react';
import './Leaderboards.css';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { Client } from "@hiveio/dhive";
import axios from 'axios';
import initializeClient from './initializeClient';
import worldmappinlogo from '../assets/worldmappin-logo.png';

import FilterComponent from './FilterComponent';



var onlyLoadonce = true;
var onlyLoad10UsersOnce = true;

var onlyLoad100UsersOnce = true;

let node;
let client;

const max = 1;

var sortedTDsAndHonerable_afterFirstLoad = [];

var sortedWinterChallenge_afterFirstLoad = [];

var userProfiles_afterfirstload = [];

const Leaderboards = ({
    handleCloseButtonLeaderboard,
    setGeojson,
    newSearchParams,
    setLocation,
    setMyLocationZoom

}) => {
    const [onlyLoadDataOnce, setOnlyLoadDataOnce] = useState(true);
    const [sortedTDsAndHonerable, setSortedTDsAndHonerable] = useState<[number , string, number, number ][]>([]);
    const [sortedWinterChallenge, setSortedWinterChallenge] = useState<[number , string, number ][]>([]);

    const [slice, setSlice] = useState(20);

    const [isOpen, setIsOpen] = useState(true);
    const [winterChallenge, setWinterChallenge] = useState(false);

    const [userProfiles, setUserProfiles] = useState([]);

    const [loading, setloading] = useState(false);
    const [loader, setLoader] = useState(0);

    const params = useParams();

    const [searchParams, setSearchParams] = useState(
        params?.username ? { author: params.username } : (params?.permlink ? { permlink: params.permlink } : (params?.tag ? { tags: [params?.tag] } : { curated_only: false }))
    );

    function chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // New function to get the number of posts by a user
    async function getUserPostCount(username) {
        // Update searchParams to include the username
        const newParams = { ...searchParams, author: username };

        // Set the new search parameters
        // setSearchParams(newParams);

        try {
            // Making an API call with the updated parameters
            const response = await axios.post('https://worldmappin.com/api/marker/0/150000/', newParams);
            
            // Return the number of posts
            return response.data.length;
        } catch (error) {
            console.error('Error fetching posts:', error);
            return 0; // Return 0 in case of an error
        }
    }

    const fetchUsername = async (usernameArray) => {
        setloading(true)
        const chunkSize = 1; // Define the chunk size
        const usernameChunks = chunkArray(usernameArray, chunkSize); // Split the array into chunks
        let allProfiles = [];
        let i = 0;

        for (const chunk of usernameChunks) {          
            if(allProfiles.length === i){
                // const profiles = await Promise.all(
                //     chunk.map(async ([rank, username, tds]) => {
                //         try {
                //             const _accounts = await client.database.call('lookup_accounts', [username, max]);
                //             if (_accounts.length > 0) {
                //                 const accountDetails = await client.database.call('get_accounts', [_accounts]);
                //                 if (accountDetails.length > 0) {
                //                     const metadata = accountDetails[0].posting_json_metadata;
                //                     const parsedMetadata = JSON.parse(metadata);
                //                     const userProfile = parsedMetadata.profile;
                //                     const profileImage = userProfile?.profile_image || '../assets/noProfilefound.png';
        
                //                     return { rank, username, profileImage, tds };
                //                 }
                //             }
                //         } catch (error) {
                //             console.error('Error fetching accounts:', error);
                //             return { rank, username, profileImage: '../assets/noProfilefound.png', tds };
                //         }
                //     })
                // );

                // Adding a search to add an activity graph can be done here

                i = i + chunkSize;
                if(usernameArray.length === 10){
                    setLoader(i*10);
                } else {
                    setLoader(i);
                }
                const profiles = await Promise.all(
                    chunk.map(async ([rank, username, tds]) => {
                    return { rank, username, tds };
                    })
                );
                allProfiles = allProfiles.concat(profiles); // Collect all profiles from each chunk                
            }
        }
    
        setUserProfiles(allProfiles);
        userProfiles_afterfirstload = allProfiles;
        setloading(false);
    };

    // Function to load ranking data from the API // Okay THIS IS WAY TOO SLOW !!!!!
    // async function loadRankingData() {
    //     if(sortedTDsAndHonerable_afterFirstLoad.length === 0){
    //         try {
    //             const response = await axios.get('https://worldmappin.com/api/ranking');
    //             console.log(response.data);
    
    //             // Batch processing function
    //             async function processBatch(data, batchSize) {
    //                 const batchResults = [];
    //                 for (let i = 0; i < data.length; i += batchSize) {
    //                     const batch = data.slice(i, i + batchSize);
    //                     const results = await Promise.all(batch.map(async item => {
    //                         const postCount = await getUserPostCount(item.author);
    //                         return [item.rank, item.author, item.tds, postCount];
    //                     }));
    //                     batchResults.push(...results);
    //                     console.log(results);
    //                     break;
    //                 }
    //                 return batchResults;
    //             }
    
    //             // Process data in batches
    //             const formattedData = await processBatch(response.data, 100); // Adjust batch size as needed
    
    //             setSortedTDsAndHonerable(formattedData);
    //             sortedTDsAndHonerable_afterFirstLoad = formattedData;
    //         } catch (err) {
    //             console.error('Error fetching ranking data:', err);
    //         }
    //     } else {
    //         setSortedTDsAndHonerable(sortedTDsAndHonerable_afterFirstLoad);
    //     }            
    // }

    async function loadRankingData() {
        if(sortedTDsAndHonerable_afterFirstLoad.length === 0){
            try {
                const response = await axios.get('https://worldmappin.com/api/ranking');
                // console.log(response.data)
                const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
                setSortedTDsAndHonerable(formattedData);
                sortedTDsAndHonerable_afterFirstLoad = formattedData;
            } catch (err) {
                console.error('Error fetching ranking data:', err);
            }
        } else {
            setSortedTDsAndHonerable(sortedTDsAndHonerable_afterFirstLoad);
        }            
    }

    const handleSlice = () => {
        setSlice(100);    
        if(onlyLoad100UsersOnce){
            fetchUsername(sortedTDsAndHonerable_afterFirstLoad.slice(0, 100));
            onlyLoad100UsersOnce = false;
        }
    }
    
    async function initializeNode(){
        node = await initializeClient();  // Assume this function correctly initializes the client        

        if(node && onlyLoad10UsersOnce){
            client = new Client(node);
            fetchUsername(sortedTDsAndHonerable_afterFirstLoad.slice(0, 20));
            onlyLoad10UsersOnce = false;
        }
    }    

    const handleFilter = ( username, filterData) => {
        const pos = {
            lat: 50,
            lng: 20,
        };

        setMyLocationZoom(1);
        setLocation({ location: pos })
        // setFetchingMarkers(true)
        // const oneMonthAgo = getOneMonthAgo();

        // console.log(usernameProvided)
        var permlinkProvided = false;
        var usernameProvided = true;
        var lowEndDevice = false;
        var permlinkProvided = false;

        var usernamep = username;

        newSearchParams({
        tags: filterData && filterData.tags && filterData.tags.length && filterData.tags[0] ? filterData.tags : [],
        author: usernameProvided ? usernamep : filterData ? filterData.username : '',
        post_title: filterData ? filterData.postTitle : '',
        start_date: lowEndDevice ? false : filterData ? filterData.startDate : '',
        end_date: filterData ? filterData.endDate : '',
        permlink: permlinkProvided ? false : '',
        curated_only: filterData ? filterData.isCurated : false
        });
        // setLowEndDevice(false);
        // setShowfiltersettings(false);
    };    

    async function loadWinterChallengeData() {
        if (sortedWinterChallenge_afterFirstLoad.length === 0) {
            try {
                const response = await axios.get('https://worldmappin.com/api/rankingWinter');
                // console.log(response.data);
                
                const formattedData = response.data.map((item, index) => {
                    return {
                        rank: index + 1,
                        username: item.author,
                        tickets: item.tickets
                    };
                });   

                // Here the usernames need to sorted
                setSortedWinterChallenge(formattedData);
                sortedWinterChallenge_afterFirstLoad = formattedData;
            } catch (err) {
                console.error('Error fetching ranking data:', err);
            }
        } else {
            setSortedWinterChallenge(sortedWinterChallenge_afterFirstLoad);
        }
    }

    // Leaderboard for all pins on the map
    // const [allData, setAllData] = useState(null);
    // const [sortedUsernames, setSortedUsernames] = useState<[string, number][]>([]);
        
    // const params = useParams();
    // const [searchParams, setSearchParams] = useState(
    //     params?.username ? { author: params.username } : (params?.permlink ? { permlink: params.permlink } : (params?.tag ? { tags: [params?.tag] } : { curated_only: false }))
    // );    

    // async function loadpinsdata() {
    //     try {
    //     const response = await axios.post('https://worldmappin.com/api/marker/0/150000/', searchParams);
    //     console.log(response.data)
    //     setAllData(response.data)
    //     fetchFeatures(response.data)
    //     } catch (err) {
    //         console.error('Error fetching feature data:', err);
    //     } finally {
    //         // Done
    //     }
    // }

    // async function fetchAllUsernamesAndCount(data) {
    //     const usernameCounts: { [key: string]: number } = {}; // Object to hold username counts
    
    //     data.forEach(post => {
    //         const { username } = post; // Destructure username from each post object
    //         if (usernameCounts[username]) {
    //             usernameCounts[username] += 1; // Increment count if username already exists
    //         } else {
    //             usernameCounts[username] = 1; // Initialize count if username is new
    //         }
    //     });

    //     const sortedUsernames = Object.entries(usernameCounts).sort((a, b) => b[1] - a[1]);
        
    //     console.log("Unique Users: " ,Object.keys(usernameCounts).length);
    //     console.log(sortedUsernames); // Log the username counts
    //     setSortedUsernames(sortedUsernames); // Optionally return the count map
    // }
    
    
    // // Continue from here
    // // Fetching posts by feature ids
    // const fetchFeatures = async (allData) => {
    //     const featureIds = allData.map(feature => feature.id);
    //     if (featureIds.length > 0) {
    //         try {
    //             // setLoading(true);
    //             const response = await axios.post("https://worldmappin.com/api/marker/ids", {
    //             marker_ids: featureIds,
    //             });
    //             // setSelectedFeatures(response.data);
    //             console.log(response.data)
    //             fetchAllUsernamesAndCount(response.data)
    //         } catch (err) {
    //             console.error('Error fetching feature data:', err);
    //         } finally {
    //             // Done
    //         }
    //     }
    // };

    // useEffect(() => {    
    //     if(onlyLoadDataOnce){      
    //       if(onlyLoadonce){      
    //         // initializeNode();
    //         loadpinsdata();
    //         setOnlyLoadDataOnce(false);
    //         onlyLoadonce = false;    
    //       }     
    //     }
    //   }, []);

    useEffect(() => {   
        loadRankingData();
        if(onlyLoadDataOnce){
            if(onlyLoadonce){
                initializeNode();
                loadWinterChallengeData();                     
                //loadRankingData();
                //setOnlyLoadDataOnce(false);
                onlyLoadonce = false;
          }
        }

        

    }, []);

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));

            // Add active class to the clicked tab
            this.classList.add('active');
        });
    });
    
    const activbuttonClick = () => {
        setWinterChallenge(false);
        setUserProfiles(userProfiles_afterfirstload);
    };

    const winterbuttonClick = () => {
        setWinterChallenge(true);
        setSortedWinterChallenge(sortedWinterChallenge_afterFirstLoad);
    };

    useEffect(() => {   
        if(!winterChallenge){
            setUserProfiles(userProfiles_afterfirstload);
        }
    }, []);

    function logInput() {
        var input = document.getElementById('inputField').value.toLowerCase() // Convert input to lowercase

        // Check if input is empty
        if (!input) {
            console.log('Please enter a username to search.');
            return;
        }

        if (winterChallenge) {
            // Find the index of the username in the sortedWinterChallenge array
            const index2 = sortedWinterChallenge.findIndex(entry => { return entry.username === input; });

            if (index2 === -1) {
                console.log('Username not found.');
                return; // If username is not found, exit the function
            }

            if (index2 > 0) {
                const usernameAbove = sortedWinterChallenge[index2-1].username;
                scrollToUser(usernameAbove, input)
            } else {
                scrollToUser(input, input)
            }
        }
        else {
            // Find the index of the username in the sortedTDsAndHonerable array
            console.log(input)
            const index = sortedTDsAndHonerable.findIndex(entry => entry[1].toLowerCase() === input);

            if (index === -1) {
                console.log('Username not found.');
                return; // If username is not found, exit the function
            }        

            var startIndex;
            var endIndex;

            // if index is above 500 then only fetch 100 usernames so 50 above and 50 below the username
            if (index > 500) {
                const numEntriesToShow = 50; // Adjust this value as needed
                startIndex = Math.max(index - numEntriesToShow, 0);
                endIndex = Math.min(index + numEntriesToShow, sortedTDsAndHonerable.length - 1);
            } else {
                const numEntriesToShow = 50; // Adjust this value as needed
                startIndex = 0; // Math.max(index - numEntriesToShow, 0);
                endIndex = Math.min(index + numEntriesToShow, sortedTDsAndHonerable.length - 1);
            }

            // Slice the array to get the relevant entries
            const relevantEntries = sortedTDsAndHonerable.slice(startIndex, endIndex + 1);
            
            fetchUsername(relevantEntries);
            setSlice(100);
            
            if (index > 0) {
                const usernameAbove = sortedTDsAndHonerable[index-1][1];
                scrollToUser(usernameAbove, input)
            } else {
                scrollToUser(input, input)
            }
        }
    }

    function scrollToUser(usernameAbove, username) {
        const interval = setInterval(() => {
            const userElement = document.getElementById(`user-${username}`);
            const userAboveElement = document.getElementById(`user-${usernameAbove}`);
            if (userElement && userAboveElement) {
                userAboveElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                clearInterval(interval); // Clear the interval once the element is found and scrolled to
    
                // Apply the animation class
                userElement.classList.add('highlight-border');
    
                // Remove the class after 3 seconds
                setTimeout(() => {
                    userElement.classList.remove('highlight-border');
                }, 3000); // 3000 milliseconds = 3 seconds
            } else {
                console.log('User element not found, retrying...');
            }
        }, 1000); // Retry every 1000 milliseconds (1 second)
    
        return () => clearInterval(interval); // Clean up the interval when the component unmounts or the username changes
    }

    function handleCloseButton_reset_Leaderboard() {
        setSlice(20);
        onlyLoad100UsersOnce = true;
        fetchUsername(sortedTDsAndHonerable_afterFirstLoad.slice(0, 20));
    }

    function showMessage() {
        var messageDiv = document.getElementById('message');
        messageDiv.innerText = 'Coming Soon';
        setTimeout(() => {
            messageDiv.innerText = ''; // Clear the message after 2 seconds
        }, 2000);
    }


    return (
        <div className={`leaderboard-side-tab ${isOpen ? 'open' : ''}`}>
            <div className='filter-close'>
                <div className="leaderboard-close-btn"><p onClick={() => {handleCloseButtonLeaderboard(), handleCloseButton_reset_Leaderboard()}}>X</p></div>
            </div>

            <div className='tabs'>
                <p className="tab active" id="most-active-users" onClick={activbuttonClick}><span className="icon" onClick={activbuttonClick}>🏆</span>Most Curated Users</p> {/* On click setwinter to false and most active to true */}
                <p className="tab" id="winter-challenge" onClick={winterbuttonClick}><span className="icon">❄️</span>Winter Challenge
                <div className="initial-snow">
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                    <div className="snow">&#10052;</div>
                </div>

                </p>
            </div>

            <div className="message" id="message"></div>
            {!winterChallenge && (    
                <div className="leaderboard-input-div">
                    <a className="time-button" onClick={showMessage}>Weekly</a>
                    <a className="time-button" onClick={showMessage}>Monthly</a>
                    <a className="time-button" onClick={showMessage}>Yearly</a>
                    <a className="time-button">All Time</a>
                    <input type="text" id="inputField" placeholder="Enter username" className="leaderboard-input"></input>
                    <a className="leaderboard-input-btn" onClick={logInput}>Search</a> 
                </div>
            )}
            {winterChallenge && (    
                <div className="leaderboard-input-div">
                    <input type="text" id="inputField" placeholder="Enter username" className="leaderboard-input"></input>
                    <a className="leaderboard-input-btn" onClick={logInput}>Search</a> 
                </div>
            )}
            
            {!winterChallenge && (  
                <div className="leaderboard-header">
                    <div className="placement-header">Placement</div>
                    <div className="username-header">Username</div>
                    <div className="Number-of-Curated-Posts-header">Number of Curated Posts</div>
                </div>
            )}

            {winterChallenge && (  
                <div className="leaderboard-header" style={{backgroundColor: 'rgba(165, 203, 225, 0.8)'}}>
                    <div className="placement-header">Placement</div>
                    <div className="username-header">Username</div>
                    <div className="Number-of-Curated-Posts-header">Number of Curated Posts</div>
                </div>
            )}

            {loading && ( 
                <div className='loadingbar'>
                    <div className='progressbar' style={{width: `${loader}%`}}></div>
                    <p>Loading...</p>
                </div>
            )}

            {/* Most Active Users from TDs */}
            {!winterChallenge && (                
                <div className='content' id="userList">
                    {userProfiles.map((profile, index) => (
                        <div key={profile.rank} id={`user-${profile.username}`} className={"leaderboard-summary"} onClick={() => handleFilter(profile.username, searchParams)}>
                            <li key={profile.rank}>
                                <small>{profile.rank}</small>
                                <div className="leaderboard-profile-content">
                                    <div className="leaderboard-user-info">
                                        <div className='leaderboard-profile-column'>
                                            <img src={`https://images.hive.blog/u/${profile.username}/avatar`} alt={`${profile.username}'s profile`} className="leaderboard-profile-picture" />
                                            {/* <a href={`https://peakd.com/@${profile.username}`} target="_blank" rel="noopener noreferrer" className="leaderboard-username-link">@{profile.username}</a> */}
                                        </div>
                                    </div>
                                    <a href={`https://peakd.com/@${profile.username}`} target="_blank" rel="noopener noreferrer" className="leaderboard-username-link">@{profile.username}</a>
                                </div>
                                
                                <h4>{profile.tds}</h4>
                            </li>                    
                        </div>
                    ))}

                    {(slice === 20 && !loading) && 
                        <div className="next-users">
                            <p onClick={handleSlice}>Top 100 Users →</p>
                        </div>
                    }

                </div>
            )}

            {/* Winterchallange */}
            {winterChallenge && (
                <div className='winter-content'>
                    <div className='initial-snow-temp'>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                        <div className="snow">&#10052;</div>
                    </div>


                    
                    {/* Winter Challenge Users */}
                    <div className='content' id="userList">
                        {sortedWinterChallenge.map((profile, index) => (
                            <div key={profile.rank} id={`user-${profile.username}`} className={"leaderboard-summary"} onClick={() => handleFilter(profile.username, searchParams)}>
                                <li key={profile.rank}>
                                    <small>{profile.rank}</small>
                                    <div className="leaderboard-profile-content">
                                        <div className="leaderboard-user-info">
                                            <div className='leaderboard-profile-column'>
                                                <img src={`https://images.hive.blog/u/${profile.username}/avatar`} alt={`${profile.username}'s profile`} className="leaderboard-profile-picture" />
                                                {/* <a href={`https://peakd.com/@${profile.username}`} target="_blank" rel="noopener noreferrer" className="leaderboard-username-link">@{profile.username}</a> */}
                                            </div>
                                        </div>
                                        <a href={`https://peakd.com/@${profile.username}`} target="_blank" rel="noopener noreferrer" className="leaderboard-username-link">@{profile.username}</a>
                                    </div>
                                    
                                    <h4>{profile.tickets}</h4>
                                </li>                    
                            </div>
                        ))}

                        {/* {(slice === 20 && !loading) && 
                            <div className="next-users">
                                <p onClick={handleSlice}>Top 100 Users →</p>
                            </div>
                        } */}

                    </div>

                </div>
            )}
            
        </div>
    );
};

export default Leaderboards;


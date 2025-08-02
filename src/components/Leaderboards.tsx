import React, { useEffect, useRef, useState } from 'react';
import './Leaderboards.css';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { Client } from "@hiveio/dhive";
import axios from 'axios';
import initializeClient from './initializeClient';
import worldmappinlogo from '../assets/worldmappin-logo.png';
import './GrazLeaderboard.css';
import FilterComponent from './FilterComponent';



var onlyLoadonce = true;
var onlyLoad10UsersOnce = true;

var onlyLoad100UsersOnce = true;

let node;
let client;

const max = 1;

var sortedTDsAndHonerable_afterFirstLoad = [];
var sortedTDsAndHonerable_weekly_afterFirstLoad = [];
var sortedTDsAndHonerable_monthly_afterFirstLoad = [];
var sortedTDsAndHonerable_yearly_afterFirstLoad = [];

var sortedWinterChallenge_afterFirstLoad = [];
var sortedUltimateAdventure_afterFirstLoad: {rank: number, username: string, score: number}[] = [];

var userProfiles_afterfirstload = [];

const Leaderboards = ({
    handleCloseButtonLeaderboard,
    setGeojson,
    newSearchParams,
    setLocation,
    setMyLocationZoom,
    showWinterchallangeTab,
    showGrazAndSeekTab,
    showUltimateAdventureTab
}) => {
    const [onlyLoadDataOnce, setOnlyLoadDataOnce] = useState(true);
    const [timeframe, setTimeframe] = useState('alltime');
    const [sortedTDsAndHonerable, setSortedTDsAndHonerable] = useState<[number , string, number, number ][]>([]);
        
    const [sortedWinterChallenge, setSortedWinterChallenge] = useState<[number , string, number ][]>([]);
    const [sortedUltimateAdventure, setSortedUltimateAdventure] = useState<{rank: number, username: string, score: number}[]>([]);

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

    // Add ref for GrazAndSeek matrix effect
    const grazLeaderboardContentRef = useRef<HTMLDivElement>(null);

    // Matrix effect functions for GrazAndSeek
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

    function chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    const grazAndSeekData = [
        { rank: 1, username: 'livinguktaiwan', date: '05/02/2025', time: '16:10:11' },
        { rank: 2, username: 'ph1102', date: '05/02/2025', time: '16:13:14' },
        { rank: 3, username: 'duskobgd', date: '05/06/2025', time: '22:50:50' },
        { rank: 4, username: 'sanjeevm', date: '05/07/2025', time: '11:29:36' },
        { rank: 5, username: 'ninaeatshere', date: '05/08/2025', time: '14:27:45' },
      ];
      const [showGrazAndSeek, setShowGrazAndSeek] = useState(false);
    const [showUltimateAdventure, setShowUltimateAdventure] = useState(false);

    // New CODE ------------------------------------------------------
    const [activeTab, setActiveTab] = useState('most-active-users');
    const [showPastChallenges, setShowPastChallenges] = useState(false);

    const pastChallenges = [
        { id: "winter", name: "Winter Challenge 2023", icon: "❄️" },
        { id: "spring", name: "Spring Challenge 2023", icon: "🌸" },
        { id: "summer", name: "Summer Challenge 2023", icon: "☀️" },
        { id: "fall", name: "Fall Challenge 2023", icon: "🍂" },
        { id: "winter2022", name: "Winter Challenge 2022", icon: "❄️" },
        { id: "spring2022", name: "Spring Challenge 2022", icon: "🌸" },
        { id: "summer2022", name: "Summer Challenge 2022", icon: "☀️" },
        { id: "fall2022", name: "Fall Challenge 2022", icon: "🍂" },
    ];

    const pastChallengesClick = () => {
        setShowPastChallenges(true);
    };
    
    const handleBackClick = () => {
        setShowPastChallenges(false);
        setShowGrazAndSeek(false);
        setShowUltimateAdventure(false);
        setActiveTab('most-active-users');
    };
    
    // const selectChallenge = (challengeId: string) => {
    //     setActiveTab(challengeId);
    //     setShowPastChallenges(false);
    // };
    //------------------------------------------------------

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
                if(usernameArray.length !== 0){
                    var x = (i/usernameArray.length)*100
                    setLoader(x);
                    // console.log(x);
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
        // setLoader(0);
    };

    useEffect(() => { 
        if(loading){
            setloading(true)
        } else {
            
        }
        setloading(false)
    }, []);

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

    // All time
    // async function loadRankingData() {
    //     if(sortedTDsAndHonerable_afterFirstLoad.length === 0){
    //         try {
    //             const response = await axios.get('https://worldmappin.com/api/ranking');
    //             // console.log(response.data)
    //             const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
    //             setSortedTDsAndHonerable(formattedData);
    //             sortedTDsAndHonerable_afterFirstLoad = formattedData;
    //         } catch (err) {
    //             console.error('Error fetching ranking data:', err);
    //         }
    //     } else {
    //         setSortedTDsAndHonerable(sortedTDsAndHonerable_afterFirstLoad);
    //     }            
    // }

    // // Weekly
    // async function loadRankingData_weekly() {
    //     console.log("Weekly was called!")
    //     setSlice(20);
    //     if(sortedTDsAndHonerable_afterFirstLoad.length === 0){
    //         try {
    //             const response = await axios.get('https://worldmappin.com/api/ranking');
    //             // console.log(response.data)
    //             const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
    //             setSortedTDsAndHonerable(formattedData);
    //             sortedTDsAndHonerable_afterFirstLoad = formattedData;
    //         } catch (err) {
    //             console.error('Error fetching ranking data:', err);
    //         }
    //     } else {
    //         setSortedTDsAndHonerable(sortedTDsAndHonerable_afterFirstLoad);
    //     }      
    // }

    // // Monthly
    // async function loadRankingData_monthly() {
    //     if(sortedTDsAndHonerable_monthly_afterFirstLoad.length === 0){
    //         try {
    //             const response = await axios.get('https://worldmappin.com/api/ranking');
    //             // console.log(response.data)
    //             const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
    //             setSortedTDsAndHonerable_monthly(formattedData);
    //             sortedTDsAndHonerable_monthly_afterFirstLoad = formattedData;
    //         } catch (err) {
    //             console.error('Error fetching ranking data:', err);
    //         }
    //     } else {
    //         setSortedTDsAndHonerable_monthly(sortedTDsAndHonerable_monthly_afterFirstLoad);
    //     }            
    // }

    // // Yearly
    // async function loadRankingData_yearly() {
    //     if(sortedTDsAndHonerable_yearly_afterFirstLoad.length === 0){
    //         try {
    //             const response = await axios.get('https://worldmappin.com/api/ranking');
    //             // console.log(response.data)
    //             const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
    //             setSortedTDsAndHonerable_yearly(formattedData);
    //             sortedTDsAndHonerable_yearly_afterFirstLoad = formattedData;
    //         } catch (err) {
    //             console.error('Error fetching ranking data:', err);
    //         }
    //     } else {
    //         setSortedTDsAndHonerable_yearly(sortedTDsAndHonerable_yearly_afterFirstLoad);
    //     }            
    // }

    useEffect(() => {    
        setSlice(20);
        setSortedTDsAndHonerable([]);

        onlyLoad100UsersOnce = true;
        async function loadRankingData() {
            
            if(timeframe === 'alltime'){ 
                // Check if we already have cached data for alltime
                if(sortedTDsAndHonerable_afterFirstLoad.length === 0) {
                    try {
                        const response = await axios.get('https://worldmappin.com/api/ranking');
                        // console.log(response.data)
                        const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
                        setSortedTDsAndHonerable(formattedData);
                        sortedTDsAndHonerable_afterFirstLoad = formattedData;
                        fetchUsername(sortedTDsAndHonerable_afterFirstLoad.slice(0, 17));
                    } catch (err) {
                        console.error('Error fetching ranking data:', err);
                    }
                } else {
                    // Use cached data
                    setSortedTDsAndHonerable(sortedTDsAndHonerable_afterFirstLoad);
                    fetchUsername(sortedTDsAndHonerable_afterFirstLoad.slice(0, 17));
                }
            }

            if(timeframe === 'weekly'){ 
                // Check if we already have cached data for weekly
                if(sortedTDsAndHonerable_weekly_afterFirstLoad.length === 0) {
                    try {
                        const response = await axios.get('https://worldmappin.com/api/ranking');
                        // console.log(response.data)
                        const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
                        setSortedTDsAndHonerable(formattedData);
                        sortedTDsAndHonerable_weekly_afterFirstLoad = formattedData;
                        fetchUsername(sortedTDsAndHonerable_weekly_afterFirstLoad.slice(20, 200));
                    } catch (err) {
                        console.error('Error fetching ranking data:', err);
                    }
                } else {
                    // Use cached data
                    setSortedTDsAndHonerable(sortedTDsAndHonerable_weekly_afterFirstLoad);
                    fetchUsername(sortedTDsAndHonerable_weekly_afterFirstLoad.slice(20, 200));
                }
            }

            if(timeframe === 'monthly'){ 
                // Check if we already have cached data for monthly
                if(sortedTDsAndHonerable_monthly_afterFirstLoad.length === 0) {
                    try {
                        const response = await axios.get('https://worldmappin.com/api/ranking');
                        // console.log(response.data)
                        const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
                        setSortedTDsAndHonerable(formattedData);
                        sortedTDsAndHonerable_monthly_afterFirstLoad = formattedData;
                        fetchUsername(sortedTDsAndHonerable_monthly_afterFirstLoad.slice(50, 200));
                    } catch (err) {
                        console.error('Error fetching ranking data:', err);
                    }
                } else {
                    // Use cached data
                    setSortedTDsAndHonerable(sortedTDsAndHonerable_monthly_afterFirstLoad);
                    fetchUsername(sortedTDsAndHonerable_monthly_afterFirstLoad.slice(50, 200));
                }
            }

            if(timeframe === 'yearly'){ 
                // Check if we already have cached data for yearly
                if(sortedTDsAndHonerable_yearly_afterFirstLoad.length === 0) {
                    try {
                        const response = await axios.get('https://worldmappin.com/api/ranking');
                        // console.log(response.data)
                        const formattedData = response.data.map(item => [item.rank, item.author, item.tds]);
                        setSortedTDsAndHonerable(formattedData);
                        sortedTDsAndHonerable_yearly_afterFirstLoad = formattedData;
                        fetchUsername(sortedTDsAndHonerable_yearly_afterFirstLoad.slice(100, 200));
                    } catch (err) {
                        console.error('Error fetching ranking data:', err);
                    }
                } else {
                    // Use cached data
                    setSortedTDsAndHonerable(sortedTDsAndHonerable_yearly_afterFirstLoad);
                    fetchUsername(sortedTDsAndHonerable_yearly_afterFirstLoad.slice(100, 200));
                }
            }
        }

        loadRankingData();

    }, [timeframe]);

    const handleSlice = () => {
        setSlice(100);    
        if(onlyLoad100UsersOnce){
            // Use the appropriate cached data based on current timeframe
            let currentData = [];
            if (timeframe === 'alltime') {
                currentData = sortedTDsAndHonerable_afterFirstLoad;
            } else if (timeframe === 'weekly') {
                currentData = sortedTDsAndHonerable_weekly_afterFirstLoad;
            } else if (timeframe === 'monthly') {
                currentData = sortedTDsAndHonerable_monthly_afterFirstLoad;
            } else if (timeframe === 'yearly') {
                currentData = sortedTDsAndHonerable_yearly_afterFirstLoad;
            }
            
            fetchUsername(currentData.slice(0, 100));
            onlyLoad100UsersOnce = false;
        }
    }
    
    // async function initializeNode(){  NOT NEEDED ATM
    //     // node = await initializeClient(); // Assume this function correctly initializes the client        

    //     if(node && onlyLoad10UsersOnce){
    //         // client = new Client(node);
    //         fetchUsername(sortedTDsAndHonerable_afterFirstLoad.slice(0, 20));
    //         onlyLoad10UsersOnce = false;
    //     }
    // }    

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
                console.log(response.data);
                
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

    async function loadUltimateAdventureData() {
        if (sortedUltimateAdventure_afterFirstLoad.length === 0) {
            try {
                const response = await axios.get('https://worldmappin.com/api/ranking202508');
                console.log(response.data);
                
                const formattedData = response.data.map((item, index) => {
                    return {
                        rank: index + 1,
                        username: item.author,
                        tickets: item.tickets || item.Points
                    };
                });   

                setSortedUltimateAdventure(formattedData);
                sortedUltimateAdventure_afterFirstLoad = formattedData;
            } catch (err) {
                console.error('Error fetching ultimate adventure ranking data:', err);
            }
        } else {
            setSortedUltimateAdventure(sortedUltimateAdventure_afterFirstLoad);
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

    // Effect to restore cached data when leaderboard reopens
    useEffect(() => {
        // Always restore cached data if it exists
        if (sortedWinterChallenge_afterFirstLoad.length > 0) {
            setSortedWinterChallenge(sortedWinterChallenge_afterFirstLoad);
        }
        
        if (sortedUltimateAdventure_afterFirstLoad.length > 0) {
            setSortedUltimateAdventure(sortedUltimateAdventure_afterFirstLoad);
        }
        
        // Restore data based on current timeframe
        if (timeframe === 'alltime' && sortedTDsAndHonerable_afterFirstLoad.length > 0) {
            setSortedTDsAndHonerable(sortedTDsAndHonerable_afterFirstLoad);
        } else if (timeframe === 'weekly' && sortedTDsAndHonerable_weekly_afterFirstLoad.length > 0) {
            setSortedTDsAndHonerable(sortedTDsAndHonerable_weekly_afterFirstLoad);
        } else if (timeframe === 'monthly' && sortedTDsAndHonerable_monthly_afterFirstLoad.length > 0) {
            setSortedTDsAndHonerable(sortedTDsAndHonerable_monthly_afterFirstLoad);
        } else if (timeframe === 'yearly' && sortedTDsAndHonerable_yearly_afterFirstLoad.length > 0) {
            setSortedTDsAndHonerable(sortedTDsAndHonerable_yearly_afterFirstLoad);
        }
        
        if (userProfiles_afterfirstload.length > 0) {
            setUserProfiles(userProfiles_afterfirstload);
        }
    }, []); // Run once when component mounts
    
    useEffect(() => {   
        // loadRankingData();
        if(onlyLoadDataOnce){
            if(onlyLoadonce){
                // initializeNode();
                loadWinterChallengeData();
                loadUltimateAdventureData();                     
                //loadRankingData();
                //setOnlyLoadDataOnce(false);
                onlyLoadonce = false;

                if(showWinterchallangeTab){
                    setWinterChallenge(true);
                }

                if(showGrazAndSeekTab){
                    setShowGrazAndSeek(true);
                    setActiveTab('grazandseek');
                    setShowPastChallenges(true);
                }

                if(showUltimateAdventureTab){
                    setShowUltimateAdventure(true);
                    setActiveTab('ultimate-challenge');
                    setShowPastChallenges(true);
                }
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

    // Function to handle tab click
    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
    };
    
    const activbuttonClick = () => {
        setWinterChallenge(false);
        setUserProfiles(userProfiles_afterfirstload);
        setActiveTab("most-active-users");        
    };

    const winterbuttonClick = () => {
        setWinterChallenge(true);
        // setShowPastChallenges(false);
        setSortedWinterChallenge(sortedWinterChallenge_afterFirstLoad);
        setActiveTab("past-challenges");
    };

    useEffect(() => {   
        if(!winterChallenge){
            setUserProfiles(userProfiles_afterfirstload);
        }
    }, []);

    // Apply matrix effect to GrazAndSeek leaderboard
    useEffect(() => {
        const grazLeaderboardContent = grazLeaderboardContentRef.current;
        if (!grazLeaderboardContent || !showGrazAndSeek) return;
        
        const interval = applyMatrixEffect(grazLeaderboardContent);
        
        return () => clearInterval(interval);
    }, [showGrazAndSeek, grazAndSeekData]);

    // Prevent body scrolling when leaderboard is open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('leaderboard-open');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.classList.remove('leaderboard-open');
            document.body.style.overflow = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('leaderboard-open');
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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

            // Scroll to the found user
            scrollToUser('', input)
        }
        else if (showUltimateAdventure) {
            // Find the index of the username in the sortedUltimateAdventure array
            const index3 = sortedUltimateAdventure.findIndex(entry => { return entry.username === input; });

            if (index3 === -1) {
                console.log('Username not found.');
                return; // If username is not found, exit the function
            }

            // Scroll to the found user
            scrollToUser('', input)
        }
        else {
            // Find the index of the username in the sortedTDsAndHonerable array
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
            
            // Scroll to the found user
            scrollToUser('', input)
        }
    }

    function scrollToUser(usernameAbove, username) {
        const interval = setInterval(() => {
            const userElement = document.getElementById(`user-${username}`);
            if (userElement) {
                // Account for fixed elements at top and center the user in the viewport
                const isMobile = window.innerWidth <= 1100;
                const elementPosition = userElement.offsetTop;
                // Find the scrollable container
                const container = userElement.closest('.content, .ultimate-content, .winter-content') || 
                                 userElement.closest('.leaderboard-side-tab');
                
                if (container) {
                    // Calculate offset to center the user in the visible area
                    const containerHeight = container.clientHeight;
                    const centerOffset = containerHeight / 2;
                    const fixedElementsOffset = isMobile ? 120 : 150; // Account for headers/fixed elements
                    const totalOffset = centerOffset + fixedElementsOffset;
                    
                    // Scroll to position centering the user in the visible area
                    container.scrollTo({
                        top: Math.max(0, elementPosition - totalOffset), // Ensure we don't scroll negative
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback to regular scrollIntoView centered
                    userElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }
                
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
        
        // Use the appropriate cached data based on current timeframe (before resetting to alltime)
        let currentData = [];
        if (timeframe === 'alltime') {
            currentData = sortedTDsAndHonerable_afterFirstLoad;
        } else if (timeframe === 'weekly') {
            currentData = sortedTDsAndHonerable_weekly_afterFirstLoad;
        } else if (timeframe === 'monthly') {
            currentData = sortedTDsAndHonerable_monthly_afterFirstLoad;
        } else if (timeframe === 'yearly') {
            currentData = sortedTDsAndHonerable_yearly_afterFirstLoad;
        }
        
        if (currentData.length > 0) {
            fetchUsername(currentData.slice(0, 20));
        }
        
        // Reset all challenge-related states
        setShowPastChallenges(false);
        setShowGrazAndSeek(false);
        setShowUltimateAdventure(false);
        setWinterChallenge(false);
        setActiveTab('most-active-users');
        
        // Reset to default timeframe
        setTimeframe('alltime');
    }

    function showMessage() {
        var messageDiv = document.getElementById('message');
        messageDiv.innerText = 'Coming Soon';
        setTimeout(() => {
            messageDiv.innerText = ''; // Clear the message after 2 seconds
        }, 2000);
    }    


    return (
        <div className={`leaderboard-side-tab ${isOpen ? 'open' : ''} ${showGrazAndSeek ? 'graz-active' : ''} ${showUltimateAdventure ? 'ultimate-active' : ''} ${winterChallenge ? 'winter-active' : ''}`}>           

            <div className='filter-close'>
                <div className="leaderboard-close-btn"><p onClick={() => {handleCloseButtonLeaderboard(), handleCloseButton_reset_Leaderboard()}}>X</p></div>
            </div>

            {!showPastChallenges && (
                <div className='tabs'>
                    <p className={`tab ${activeTab === 'most-active-users' ? 'active' : ''}`} id="most-active-users" onClick={activbuttonClick} style={{ width: '41%' }}><span className="icon" onClick={activbuttonClick}>🏆</span>Most Curated Users</p>
                    <p className={`tab ${activeTab === 'past-challenges' ? 'active' : ''}`} id="past-challenges" onClick={pastChallengesClick} style={{ width: '41%' }}><span className="icon" >🎯</span>Challenges</p>
                </div>
            )}

            {showPastChallenges && (
                <div className='tabs'>
                <p className="tab active" id="back-tab" onClick={handleBackClick} style={{ width: '10%' }}><span className="icon" >⬅️</span>Back</p>
                    <div className="scrollable-tabs">
                        <p className={`tab ${activeTab === 'ultimate-challenge' ? 'active' : ''}`} id="ultimate-challenge" onClick={() => { setShowUltimateAdventure(true); setWinterChallenge(false); setShowGrazAndSeek(false); setActiveTab('ultimate-challenge'); }}>Ultimate Adventures Challenge</p>
                        <p className={`tab ${activeTab === 'grazandseek' ? 'active' : ''}`} id="graz-challenge" onClick={() => { setShowGrazAndSeek(true); setWinterChallenge(false); setShowUltimateAdventure(false); setActiveTab('grazandseek'); }}>
                          <span style={{opacity: 0.6, fontSize: '0.8em', marginRight: '5px'}}>{'{ }'}</span>
                          GrazAndSeek Challenge
                          <span style={{opacity: 0.6, fontSize: '0.8em', marginLeft: '5px'}}>{'< />'}</span>
                        </p>
                        <p className={`tab ${activeTab === 'winter-challenge' ? 'active' : ''}`} id="winter-challenge" onClick={() => { setWinterChallenge(true); setShowGrazAndSeek(false); setShowUltimateAdventure(false); setActiveTab('winter-challenge'); }}><span className="icon">❄️</span>Winter Challenge 2024
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
                            <div className="snow">&#10052;</div>
                            <div className="snow">&#10052;</div>
                        </div>
                        </p>
                        {/* <p className="tab active" id="future-challenge-1">Future Challenge</p>
                        <p className="tab active" id="future-challenge-2">Future Challenge</p> */}
    </div>
  </div>
)}


{showGrazAndSeek && (
  <div className="graz-leaderboard-content">
    <div className="leaderboard-title-container">
      <h1 className="graz-title">GrazAndSeek <span>Leaderboard</span></h1>
      <p className="graz-subtitle">Secret Code Solvers Hall of Fame</p>
    </div>

    <div className="leaderboard-input-div">
      <input type="text" id="inputField" placeholder="Enter username" className="leaderboard-input"></input>
      <a className="leaderboard-input-btn" onClick={logInput}>Search</a> 
    </div>
    
    <div className="leaderboard-header-3">
      <div className="placement-header">Rank</div>
      <div className="username-header-2">Username</div>
      <div className="date-solved-header">Date Solved</div>
      <div className="time-solved-header">Time</div>
    </div>
    
    <div className="leaderboard-entries-container" ref={grazLeaderboardContentRef}>
      {grazAndSeekData.map((entry) => (
        <div key={entry.rank} className="leaderboard-summary">
          <li>
            <div className="leaderboard-profile-content">
              <small>{entry.rank}</small>
              <div className="leaderboard-user-info">
                <div className="user-avatar">
                  <img src={`https://images.hive.blog/u/${entry.username}/avatar/small`} alt={`${entry.username}'s avatar`} onError={(e) => { e.currentTarget.src = 'https://images.hive.blog/u/default/avatar/small'; }} />
                </div>
                <a href={`https://peakd.com/@${entry.username}`} target="_blank" rel="noopener noreferrer" className="leaderboard-username-link">{entry.username}</a>
              </div>
              <div className="date-time-container">
                <span className="date-solved">{entry.date}</span>
                <span className="time-solved">{entry.time}</span>
              </div>
            </div>
          </li>
        </div>
      ))}
    </div>
  </div>
)}

{showUltimateAdventure && (
  <div className='ultimate-content'>
    <div className="ultimate-leaderboard-content">
      <div className="leaderboard-input-div">
        <input type="text" id="inputField" placeholder="Enter explorer name" className="leaderboard-input"></input>
        <a className="leaderboard-input-btn" onClick={logInput}>Search</a> 
      </div>
      
      <div className="leaderboard-header-2">
        <div className="placement-header">Rank</div>
        <div className="username-header-3">Explorer</div>
        <div className="time-solved-header">Number of Tickets</div>
      </div>
      
      <div className='content' id="userList">
        {sortedUltimateAdventure.map((profile, index) => (
          <div key={index} id={`user-${profile.username}`} className="leaderboard-summary" onClick={() => handleFilter(profile.username, searchParams)}>
            <li>
              <small>{profile.rank}</small>
              <div className="leaderboard-profile-content">
                <div className="leaderboard-user-info">
                  <div className='leaderboard-profile-column'>
                    <img src={`https://images.hive.blog/u/${profile.username}/avatar`} alt={`${profile.username}'s profile`} className="leaderboard-profile-picture" />
                  </div>
                </div>
                <a href={`https://peakd.com/@${profile.username}`} target="_blank" rel="noopener noreferrer" className="leaderboard-username-link">@{profile.username}</a>
              </div>
              
              <h4>{profile.tickets}</h4>
            </li>                    
          </div>
        ))}
      </div>
    </div>
  </div>
)}

            {/* <div className="message" id="message"></div> */}
            {!showGrazAndSeek && !winterChallenge && !showUltimateAdventure && (    
                <div className="curated-leaderboard-header">
                    <a className="curated-time-button-disabled" onClick={() => setTimeframe('weekly')}>Weekly</a>
                    <a className="curated-time-button-disabled" onClick={() => setTimeframe('monthly')}>Monthly</a>
                    <a className="curated-time-button-disabled" onClick={() => setTimeframe('yearly')}>Yearly</a>
                    <a className="curated-time-button-active" onClick={() => setTimeframe('alltime')}>All Time</a>
                    <input type="text" id="inputField" placeholder="Enter username" className="curated-leaderboard-input"></input>
                    <a className="curated-leaderboard-search-btn" onClick={logInput}>Search</a>                     
                </div>
            )}
            {!showGrazAndSeek && winterChallenge && (    
                <div className="leaderboard-input-div">
                    <input type="text" id="inputField" placeholder="Enter username" className="leaderboard-input"></input>
                    <a className="leaderboard-input-btn" onClick={logInput}>Search</a> 
                </div>
            )}
            
            {!showGrazAndSeek && !winterChallenge && !showUltimateAdventure && (  
                <div className="leaderboard-header">
                    <div className="curated-placement-header">Placement</div>
                    <div className="curated-username-header">Username</div>
                    <div className="curated-posts-header"><span className="desktop-text">Number of Curated Posts</span><span className="mobile-text">Number of Curated Posts</span></div>
                    {/* Doesn't work yet
                        {loading && ( 
                        <div className='loadingbar'>
                            <div className='progressbar' style={{width: `${loader}%`}}></div>
                            <p>Loading...</p>
                        </div>
                    )} */}
                </div>
            )}

            {!showGrazAndSeek && winterChallenge && (  
                <div className="leaderboard-header" style={{backgroundColor: 'rgba(165, 203, 225, 0.8)'}}>
                    <div className="placement-header">Placement</div>
                    <div className="username-header">Username</div>
                    <div className="Number-of-Curated-Posts-header">Number of Tickets</div>
                </div>
            )}            

            {/* Most Active Users from TDs */}
            {!showGrazAndSeek && (!winterChallenge) && (!showUltimateAdventure) && (                
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
            {!showGrazAndSeek && winterChallenge && (
                <div className='winter-content'>
                    <div className='initial-snow-temp'>
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


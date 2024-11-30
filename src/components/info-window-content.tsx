import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import img_logo from '../assets/no-image-found.png';
import {setGlobalLocation, setGlobalZoom} from '../app';

// export let setGlobalLocation: (location: google.maps.places.Place | undefined) => void;
// export let setGlobalZoom: (zoom: number | undefined) => void;

// PostSummary Component
const PostSummary = (props) => {
  const marker = props.marker;
  const [isImageError, setIsImageError] = useState(false);

  const handleImageError = () => {
    setIsImageError(true);
  };

  const handlePosition = () => {

    const pos = marker.position;

    // TODO: There is some issue with the position assigned to the feature id

    // console.log(pos);
    // setGlobalLocation({ location: pos });
    // setGlobalZoom(15);
  }

  return (
    <div className={"post-summary"}>
      <a href={marker.postLink} target="blank" className="image-link">
        {!isImageError && marker.postImageLink !== "No image" ? (
          <img
            src={"https://images.ecency.com/256x512/" + marker.postImageLink}
            alt=""
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <img
            src={img_logo}
            alt="Default Logo"
            loading="lazy"
          />
        )}
      </a>
      <div className="post-info">
        <h2 className="title">
          <a href={marker.postLink} target="blank">
            {marker.postTitle}
          </a>
        </h2>
        <div className="description">
          <p>{marker.postDescription}</p>
        </div>
        <div className="extra-info" onClick={() => handlePosition()}>
          <p>{"@" + marker.username}</p>
          <p>{(new Date(marker.postDate)).toDateString()}</p>
        </div>
      </div>
    </div>
  );
};

// Main InfoWindowContent Component
export const InfoWindowContent = memo(({ features, showRank = true }) => {
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetching posts by feature ids
  const fetchFeatures = async () => {
    const featureIds = features.map((feature) => feature.id);
    const positions = features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates; // Assuming coordinates are [longitude, latitude]
      return { lat, lng };
    });

    

    if (featureIds.length > 0) {
      try {
        setLoading(true);
        const response = await axios.post("https://worldmappin.com/api/marker/ids", {
          marker_ids: featureIds,
        });

        const enrichedFeatures = response.data.map((data, index) => ({
          ...data,
          position: positions[index] // Assuming the order of features in response matches the request
        }));
        setSelectedFeatures(enrichedFeatures);
        // console.log(response.data)
      } catch (err) {
        setError(err.message);
        console.error('Error fetching feature data:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [features]);  

  if (loading) {
    if(!features.length ) {
      setLoading(false);
      return
    }
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }  

  if (selectedFeatures.length > 0) {  
    // Sort selectedFeatures by postDate in descending order (latest date first)
    const sortedFeatures = selectedFeatures.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    return (
      <div>
        {showRank && ( <h4>Pins Loaded: {selectedFeatures.length}</h4> )}
        {sortedFeatures.map((marker) => (
          <PostSummary key={marker.postLink} marker={marker}/>
        ))}
      </div>
    );
  }
});

export default InfoWindowContent;
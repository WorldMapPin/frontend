import React, {useEffect, useCallback} from 'react';
import {AdvancedMarker, useAdvancedMarkerRef} from '@vis.gl/react-google-maps';

import { setGlobalLocation, setGlobalZoom, mapZoom } from '../app'

const maxClickableCluster = 50;

type TreeClusterMarkerProps = {
  clusterId: number;
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    clusterId: number
  ) => void;
  position: google.maps.LatLngLiteral;
  size: number;
  sizeAsText: string;  
};

export const FeaturesClusterMarker = ({
  position,
  size,
  sizeAsText,
  onMarkerClick,
  clusterId
}: TreeClusterMarkerProps) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const handleClick = useCallback(
    () => {
      if (size > maxClickableCluster && (mapZoom < 14 )) {        
        setGlobalLocation({ location: position });
        setGlobalZoom(mapZoom+3)
      } else {
        onMarkerClick && onMarkerClick(marker!, clusterId)
      }
    },
    [onMarkerClick, marker, clusterId]
  );
  const markerSize = Math.floor(40 + Math.sqrt(size) / 5);


  //Color for diffrent cluster size
  let backgroundColor: string;
  if (size < 10) {
    // Warm Green to a more yellowish-green
    backgroundColor = 'linear-gradient(135deg, #76c7c0, #4b9a77)'; // Warm Green to Darker Warm Green
  } else if (size < 500) {
    // Warm Yellow to a warmer yellow-orange
    backgroundColor = 'linear-gradient(135deg, #FFEB6D, #F5B041)'; // Warm Yellow to Warm Yellow-Orange
  } else if (size < 1000) {
    // Warmer Orange tones
    backgroundColor = 'linear-gradient(135deg, #FF8C42, #F57C00)'; // Warmer Lighter Orange to Warm Dark Orange
  } else if (size < 2000) {
    // Warmer Darker Orange tones
    backgroundColor = 'linear-gradient(135deg, #F57C00, #E64A19)'; // Warmer Muted Orange to Darker Warm Orange
  } else {
    // Intensified Red tones
    backgroundColor = 'linear-gradient(135deg, #FF3D00, #D32F2F)'; // Warm Bright Red to Strong Red
  }

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      zIndex={size}
      onClick={handleClick}
      
      className={'marker cluster'} 
      style={{width: markerSize, height: markerSize, background: backgroundColor}}>  
      <span>{sizeAsText}</span>
  
    </AdvancedMarker>
  );
};

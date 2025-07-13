import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Safety levels configuration
const SAFETY_LEVELS = {
  very_safe: { color: '#4CAF50', label: 'Very Safe', description: 'Low crime area, well-lit, populated' },
  safe: { color: '#8BC34A', label: 'Safe', description: 'Generally safe, normal precautions advised' },
  moderate: { color: '#FFC107', label: 'Moderate', description: 'Some crime reported, be cautious at night' },
  risky: { color: '#FF9800', label: 'Risky', description: 'Higher crime area, avoid at night' },
  dangerous: { color: '#F44336', label: 'Dangerous', description: 'High crime area, avoid if possible' },
  unknown: { color: '#9E9E9E', label: 'Unknown', description: 'Safety data not available' }
};

// Custom icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Calculate distance between coordinates (Haversine formula)
const calculateDistance = (coord1, coord2) => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Calculate total route distance
const calculateRouteDistance = (routeCoords) => {
  let totalDistance = 0;
  for (let i = 1; i < routeCoords.length; i++) {
    totalDistance += calculateDistance(routeCoords[i-1], routeCoords[i]);
  }
  return totalDistance;
};

// Calculate time for different transportation modes
const calculateTime = (distance) => {
  // Average speeds in m/s
  const speeds = {
    car: 13.8889,    // ~50 km/h
    bike: 5.5556,     // ~20 km/h
    walking: 1.3889,  // ~5 km/h
    transit: 8.3333   // ~30 km/h (public transport)
  };

  const seconds = {
    car: distance / speeds.car,
    bike: distance / speeds.bike,
    walking: distance / speeds.walking,
    transit: distance / speeds.transit
  };

  return {
    car: formatTime(seconds.car),
    bike: formatTime(seconds.bike),
    walking: formatTime(seconds.walking),
    transit: formatTime(seconds.transit)
  };
};

// Format time into readable string
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Mock safety data API call
const getSafetyData = async (coords) => {
  // In a real app, replace with actual API call
  return coords.map((coord, index) => {
    const randomFactor = Math.random();
    let safetyLevel;
    
    // Create some dangerous spots for demonstration
    if (index % 20 === 0) {
      safetyLevel = 'dangerous';
    } else if (index % 15 === 0) {
      safetyLevel = 'risky';
    } else if (index % 10 === 0) {
      safetyLevel = 'moderate';
    } else {
      safetyLevel = randomFactor > 0.7 ? 'safe' : 'very_safe';
    }
    
    return {
      coord,
      safety: safetyLevel,
      crimeRate: Math.floor(randomFactor * 100),
      lastUpdated: new Date().toISOString().split('T')[0],
      tips: getSafetyTips(safetyLevel)
    };
  });
};

// Generate safety tips based on safety level
const getSafetyTips = (safetyLevel) => {
  const tips = {
    very_safe: [
      "Normal precautions recommended",
      "Well-lit area",
      "Populated neighborhood"
    ],
    safe: [
      "Stay aware of your surroundings",
      "Keep valuables out of sight",
      "Avoid isolated areas at night"
    ],
    moderate: [
      "Be extra cautious at night",
      "Travel with someone if possible",
      "Avoid displaying expensive items"
    ],
    risky: [
      "Avoid walking alone at night",
      "Keep phone accessible",
      "Consider alternative routes"
    ],
    dangerous: [
      "Avoid this area if possible",
      "Do not travel alone",
      "Consider taking a taxi instead"
    ],
    unknown: [
      "Limited safety information available",
      "Exercise normal precautions",
      "Stay in well-lit areas"
    ]
  };
  
  return tips[safetyLevel] || tips.unknown;
};

// Calculate overall route safety
const calculateRouteSafety = (safetyData) => {
  if (!safetyData || safetyData.length === 0) return SAFETY_LEVELS.unknown;
  
  const safetyScores = {
    very_safe: 0,
    safe: 1,
    moderate: 2,
    risky: 3,
    dangerous: 4
  };
  
  let totalScore = 0;
  safetyData.forEach(item => {
    totalScore += safetyScores[item.safety] || 0;
  });
  
  const averageScore = totalScore / safetyData.length;
  
  if (averageScore < 0.5) return SAFETY_LEVELS.very_safe;
  if (averageScore < 1.5) return SAFETY_LEVELS.safe;
  if (averageScore < 2.5) return SAFETY_LEVELS.moderate;
  if (averageScore < 3.5) return SAFETY_LEVELS.risky;
  return SAFETY_LEVELS.dangerous;
};

const SafetyMarkers = ({ safetyData }) => {
  const markersRef = useRef([]);

  useEffect(() => {
    // Cleanup markers on unmount
    return () => {
      markersRef.current.forEach(marker => {
        if (marker && marker.closePopup) marker.closePopup();
      });
    };
  }, []);

  return (
    <>
      {safetyData.map((data, index) => {
        // Only show markers for less safe areas to avoid clutter
        if (data.safety === 'very_safe' || data.safety === 'safe') return null;
        
        const [lng, lat] = data.coord;
        const safetyInfo = SAFETY_LEVELS[data.safety];
        
        return (
          <CircleMarker
            key={`safety-${index}`}
            center={[lat, lng]}
            radius={6}
            fillColor={safetyInfo.color}
            color="#000"
            weight={1}
            opacity={0.8}
            fillOpacity={0.8}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
              mouseout: (e) => {
                e.target.closePopup();
              }
            }}
            ref={(ref) => {
              if (ref) markersRef.current[index] = ref;
            }}
          >
            <Popup>
              <div className="safety-popup">
                <h4>Safety Alert</h4>
                <div className="safety-level" style={{ backgroundColor: safetyInfo.color }}>
                  {safetyInfo.label}
                </div>
                <p>Crime rate: {data.crimeRate}/100</p>
                <p>Last updated: {data.lastUpdated}</p>
                <div className="safety-tips">
                  <h5>Safety Tips:</h5>
                  <ul>
                    {data.tips.map((tip, i) => (
                      <li key={`tip-${index}-${i}`}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

const SearchLocation = ({ mapRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);
    
    try {
      // Using Nominatim for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lon = parseFloat(firstResult.lon);
        
        mapRef.current.flyTo([lat, lon], 15, {
          duration: 1,
          easeLinearity: 0.25
        });
        
        // Add a marker for the searched location
        const marker = L.marker([lat, lon]).addTo(mapRef.current);
        marker.bindPopup(`<b>${firstResult.display_name}</b>`).openPopup();
        
        // Remove marker after 5 seconds
        setTimeout(() => {
          mapRef.current.removeLayer(marker);
        }, 5000);
      } else {
        alert('Location not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for location');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a location..."
          disabled={isSearching}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
};

const FitBoundsToRoute = ({ routeCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (routeCoords.length > 0) {
      const latLngs = routeCoords.map(([lng, lat]) => [lat, lng]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoords, map]);

  return null;
};

const MapView = ({ routeData }) => {
  const routeCoords = routeData?.features?.[0]?.geometry?.coordinates || [];
  const [safetyData, setSafetyData] = useState([]);
  const [isLoadingSafety, setIsLoadingSafety] = useState(false);
  const [showSafetyMarkers, setShowSafetyMarkers] = useState(true);
  const mapRef = useRef(null);
  
  // Get start and end points
  const startPoint = routeCoords.length > 0 ? routeCoords[0] : null;
  const endPoint = routeCoords.length > 0 ? routeCoords[routeCoords.length - 1] : null;
  
  // Calculate distances and times
  const totalDistance = calculateRouteDistance(routeCoords);
  const totalTimes = calculateTime(totalDistance);
  
  // Calculate safety information
  const routeSafety = calculateRouteSafety(safetyData);

  // Load safety data when route changes
  useEffect(() => {
    if (routeCoords.length > 0) {
      setIsLoadingSafety(true);
      getSafetyData(routeCoords).then(data => {
        setSafetyData(data);
        setIsLoadingSafety(false);
      });
    }
  }, [routeCoords]);

  return (
    <div className="map-view">
      <div className="route-info-panel">
        <h3>Route Information</h3>
        
        <div className="info-section">
          <h4>Distance</h4>
          <p>Total: {(totalDistance / 1000).toFixed(2)} km</p>
        </div>
        
        <div className="info-section">
          <h4>Safety Overview</h4>
          {isLoadingSafety ? (
            <p>Loading safety data...</p>
          ) : (
            <>
              <div className="safety-indicator">
                <div 
                  className="safety-color" 
                  style={{ backgroundColor: routeSafety.color }}
                ></div>
                <span>{routeSafety.label}</span>
              </div>
              <p>{routeSafety.description}</p>
              
              <div className="safety-toggle">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showSafetyMarkers}
                    onChange={() => setShowSafetyMarkers(!showSafetyMarkers)}
                  />
                  Show safety markers
                </label>
              </div>
            </>
          )}
        </div>
        
        <div className="info-section">
          <h4>Estimated Time</h4>
          <div className="transport-modes">
            <div className="transport-mode">
              <h5>Car</h5>
              <p>Total: {totalTimes.car}</p>
            </div>
            <div className="transport-mode">
              <h5>Bike</h5>
              <p>Total: {totalTimes.bike}</p>
            </div>
            <div className="transport-mode">
              <h5>Walking</h5>
              <p>Total: {totalTimes.walking}</p>
            </div>
            <div className="transport-mode">
              <h5>Transit</h5>
              <p>Total: {totalTimes.transit}</p>
            </div>
          </div>
        </div>
      </div>
      
      <MapContainer 
        center={routeCoords.length > 0 ? [routeCoords[0][1], routeCoords[0][0]] : [20.5937, 78.9629]} 
        zoom={routeCoords.length > 0 ? 13 : 5} 
        className="map-container"
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <FitBoundsToRoute routeCoords={routeCoords} />
        <SearchLocation mapRef={mapRef} />

        {routeCoords.length > 0 && (
          <>
            <Polyline
              positions={routeCoords.map(([lng, lat]) => [lat, lng])}
              color="#4285F4"
              weight={5}
              opacity={0.7}
            />
            
            {/* Safety markers */}
            {showSafetyMarkers && safetyData.length > 0 && (
              <SafetyMarkers safetyData={safetyData} />
            )}
            
            {/* Start Marker (Green) */}
            {startPoint && (
              <Marker position={[startPoint[1], startPoint[0]]} icon={startIcon}>
                <Popup>Start Point</Popup>
              </Marker>
            )}
            
            {/* End Marker (Red) */}
            {endPoint && (
              <Marker position={[endPoint[1], endPoint[0]]} icon={endIcon}>
                <Popup>Destination</Popup>
              </Marker>
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
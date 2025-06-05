import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import MapView from './components/MapView';
import 'leaflet/dist/leaflet.css';

const App = () => {
  const [fromPlace, setFromPlace] = useState('');
  const [toPlace, setToPlace] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ORS_API_KEY = '5b3ce3597851110001cf6248af750a4f73664122846f0ac20cd1a858'; 

  const geocode = async (place) => {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(place)}&size=1`;
    const response = await axios.get(url);
    if (response.data.features.length === 0) {
      throw new Error(`Could not geocode "${place}"`);
    }
    return response.data.features[0].geometry.coordinates;
  };

  const fetchRoute = async () => {
    if (!fromPlace || !toPlace) {
      alert('Please enter both locations');
      return;
    }

    setLoading(true);
    setError(null);
    setRouteData(null);

    try {
      const fromCoords = await geocode(fromPlace);
      const toCoords = await geocode(toPlace);

      const directionsRes = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: [fromCoords, toCoords],
        },
        {
          headers: {
            Authorization: ORS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      setRouteData(directionsRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch route');
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="App">
    {/* Offcanvas toggle */}
  <div className='title'>
    <img src="/location.svg" alt="logo" />
    <h1>Safe trip</h1>
  </div>
    {/* Search Panel */}
    <div className="search-panel">
      <input
        type="text"
        value={fromPlace}
        onChange={(e) => setFromPlace(e.target.value)}
        placeholder="From (e.g. Delhi)"
      />
      <input
        type="text"
        value={toPlace}
        onChange={(e) => setToPlace(e.target.value)}
        placeholder="To (e.g. Mumbai)"
      />
      <button  onClick={fetchRoute}>Search</button>
    </div>

    {/* Map Fullscreen */}
    <div className="map-container">
      <MapView routeData={routeData} />
    </div>

    {loading && <p style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000 }}>Loading route data...</p>}
    {error && <p style={{ position: 'absolute', bottom: 10, left: 10, color: 'red', zIndex: 1000 }}>{error}</p>}

    
  </div>
);

};

export default App;

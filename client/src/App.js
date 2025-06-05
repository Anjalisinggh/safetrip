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

  const ORS_API_KEY = 'your_actual_key_here'; // Replace this

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
      setError(err.message || 'Failed to fetch route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: '1rem' }}>
      <h2>TripSafe Route Finder</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={fromPlace}
          onChange={(e) => setFromPlace(e.target.value)}
          placeholder="From (e.g. Delhi)"
          style={{ marginRight: '0.5rem', padding: '0.5rem' }}
        />
        <input
          type="text"
          value={toPlace}
          onChange={(e) => setToPlace(e.target.value)}
          placeholder="To (e.g. Mumbai)"
          style={{ marginRight: '0.5rem', padding: '0.5rem' }}
        />
        <button onClick={fetchRoute} style={{ padding: '0.5rem 1rem' }}>
          Search
        </button>
      </div>

      {loading && <p>Loading route data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <MapView routeData={routeData} />

      {routeData && (
        <pre
          style={{
            textAlign: 'left',
            maxHeight: '400px',
            overflow: 'auto',
            background: '#f5f5f5',
            padding: '1rem',
            marginTop: '1rem',
          }}
        >
          {JSON.stringify(routeData, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default App;

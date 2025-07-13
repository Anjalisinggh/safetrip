import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import MapView from "./components/MapView";
import "leaflet/dist/leaflet.css";
import CrimeData from "./CrimeData";

const App = () => {
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  const ORS_API_KEY = "5b3ce3597851110001cf6248af750a4f73664122846f0ac20cd1a858";

  // Autocomplete search
  const fetchSuggestions = async (query, setter) => {
    if (!query) return setter([]);
    try {
      const res = await axios.get(
        `https://api.openrouteservice.org/geocode/autocomplete?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
          query
        )}`
      );
      setter(res.data.features.map((f) => f.properties.label));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // Geocode to get coordinates
  const geocode = async (place) => {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
      place
    )}&size=1`;
    const response = await axios.get(url);
    if (response.data.features.length === 0) {
      throw new Error(`Could not geocode "${place}"`);
    }
    return response.data.features[0].geometry.coordinates;
  };

  // Get current location and reverse geocode it
  const useCurrentLocation = async () => {
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lat=${latitude}&point.lon=${longitude}&size=1`;
        const response = await axios.get(url);
        const label = response.data.features[0].properties.label;
        setFromPlace(label);
      });
    } catch (err) {
      alert("Failed to get current location.");
    }
  };

  const fetchRoute = async () => {
    if (!fromPlace || !toPlace) {
      alert("Please enter both locations");
      return;
    }

    setLoading(true);
    setError(null);
    setRouteData(null);

    try {
      const fromCoords = await geocode(fromPlace);
      const toCoords = await geocode(toPlace);

      const directionsRes = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          coordinates: [fromCoords, toCoords],
        },
        {
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      setRouteData(directionsRes.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || err.message || "Failed to fetch route"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <div className="title">
        <img src="/location.svg" alt="logo" />
        <h1>Safe trip</h1>
      </div>

      {/* Search Panel */}
      <div className="search-panel">
        <div className="input-group">
          <img src="/start.svg" alt="Start" />
          <input
            type="text"
            value={fromPlace}
            onChange={(e) => {
              setFromPlace(e.target.value);
              fetchSuggestions(e.target.value, setFromSuggestions);
            }}
            placeholder="Starting point"
          />
          <img
            className="gps"
            src="/current.svg"
            alt="Use current location"
            title="Use your current location"
            onClick={useCurrentLocation}
            style={{ cursor: "pointer" }}
          />
          {fromSuggestions.length > 0 && (
            <ul className="suggestions">
              {fromSuggestions.map((suggestion, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setFromPlace(suggestion);
                    setFromSuggestions([]);
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="input-group">
          <img src="/end.svg" alt="End" />
          <input
            type="text"
            value={toPlace}
            onChange={(e) => {
              setToPlace(e.target.value);
              fetchSuggestions(e.target.value, setToSuggestions);
            }}
            placeholder="Destination"
          />
          {toSuggestions.length > 0 && (
            <ul className="suggestions">
              {toSuggestions.map((suggestion, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setToPlace(suggestion);
                    setToSuggestions([]);
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button onClick={fetchRoute}>
          <img src="/shield.svg" alt="Safe" />
          Find Safe Routes
        </button>
      </div>

      {/* Crime Data */}
      <div style={{ border: "1px solid gray", padding: "1rem" }}>
  <CrimeData />
</div>
      {/* Map Fullscreen */}
      <div className="map-container">
        <MapView routeData={routeData} />
      </div>

      {loading && (
        <p style={{ position: "absolute", bottom: 10, left: 10, zIndex: 1000 }}>
          Loading route data...
        </p>
      )}
      {error && (
        <p
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            color: "red",
            zIndex: 1000,
          }}
        >
          {error}
        </p>
      )}
     

    </div>
  );
};

export default App;

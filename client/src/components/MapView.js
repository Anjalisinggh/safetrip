import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Custom car icon (make sure this path is correct or use a URL)
const carIcon = new L.Icon({
  iconUrl: '/car.svg', // Replace with your own car image
  iconSize: [32, 32],
});

const AnimatedMarker = ({ routeCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || routeCoords.length === 0) return;

    const latlngs = routeCoords.map(([lng, lat]) => [lat, lng]);
    const marker = L.marker(latlngs[0], { icon: carIcon }).addTo(map);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= latlngs.length) {
        clearInterval(interval);
        return;
      }
      marker.setLatLng(latlngs[i]);
      i++;
    }, 100); // Change speed as needed

    return () => clearInterval(interval);
  }, [map, routeCoords]);

  return null; // This component only adds side effects
};

const MapView = ({ routeData }) => {
  const routeCoords = routeData?.features?.[0]?.geometry?.coordinates || [];

  return (
    <div className="map-view">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} className="full-map">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {routeCoords.length > 0 && (
          <>
            <Polyline
              positions={routeCoords.map(([lng, lat]) => [lat, lng])}
              color="blue"
              weight={5}
            />
            <AnimatedMarker routeCoords={routeCoords} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;

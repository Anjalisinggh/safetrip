import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css'; // ✅ create and import this CSS file

const MapView = ({ routeData }) => {
  const routeCoords = routeData?.features?.[0]?.geometry?.coordinates || [];

  return (
    <div className="map-view">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} className="full-map">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords.map(([lng, lat]) => [lat, lng])}
            color="blue"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;

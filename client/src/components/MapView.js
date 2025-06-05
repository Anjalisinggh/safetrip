import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = ({ routeData }) => {
  const routeCoords = routeData?.features?.[0]?.geometry?.coordinates || [];

  return (
    <div style={{ height: '500px', width: '100%', marginTop: '1rem' }}>
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
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

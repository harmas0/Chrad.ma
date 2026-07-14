import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom green marker for pickup
const pickupIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 36px; height: 36px;
    background: #00E676;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 3px 10px rgba(0,230,118,0.4);
    display: flex; align-items: center; justify-content: center;
  ">
    <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Custom red marker for destination
const destinationIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 36px; height: 36px;
    background: #EF4444;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 3px 10px rgba(239,68,68,0.4);
    display: flex; align-items: center; justify-content: center;
  ">
    <span style="transform: rotate(45deg); font-size: 14px;">🏁</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Custom blue marker for runner
const runnerIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 40px; height: 40px;
    background: #3B82F6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 3px 12px rgba(59,130,246,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  ">🏃</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Task marker for the explore map
const taskIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 32px; height: 32px;
    background: white;
    border: 2px solid #00E676;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
  ">💰</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Auto-fit bounds helper
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
}

export default function MapView({
  pickup,
  destination,
  runnerPosition,
  taskMarkers,
  center = [33.5731, -7.6322], // Casablanca center
  zoom = 13,
  height = '300px',
  className = '',
  interactive = true,
}) {
  const bounds = [];
  if (pickup) bounds.push([pickup.lat, pickup.lng]);
  if (destination) bounds.push([destination.lat, destination.lng]);
  if (runnerPosition) bounds.push([runnerPosition.lat, runnerPosition.lng]);

  // Route line (simplified straight line for MVP)
  const routePositions = [];
  if (pickup) routePositions.push([pickup.lat, pickup.lng]);
  if (runnerPosition) routePositions.push([runnerPosition.lat, runnerPosition.lng]);
  if (destination) routePositions.push([destination.lat, destination.lng]);

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border border-border ${className}`} style={{ height }} id="map-view">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {bounds.length >= 2 && <FitBounds bounds={bounds} />}

        {/* Route line */}
        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#00E676',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 6',
            }}
          />
        )}

        {/* Pickup marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm font-medium">📍 Pickup</div>
              <div className="text-xs text-gray-500">{pickup.address || pickup.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-sm font-medium">🏁 Destination</div>
              <div className="text-xs text-gray-500">{destination.address || destination.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Runner position */}
        {runnerPosition && (
          <Marker position={[runnerPosition.lat, runnerPosition.lng]} icon={runnerIcon}>
            <Popup>
              <div className="text-sm font-medium">🏃 Runner</div>
              <div className="text-xs text-gray-500">En route</div>
            </Popup>
          </Marker>
        )}

        {/* Task markers for explore map */}
        {taskMarkers?.map((task) => (
          <Marker
            key={task.id}
            position={[task.pickup.lat, task.pickup.lng]}
            icon={taskIcon}
          >
            <Popup>
              <div className="text-sm font-semibold">{task.title}</div>
              <div className="text-xs text-green-600 font-bold mt-1">{task.offeredPrice} MAD</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export { pickupIcon, destinationIcon, runnerIcon, taskIcon };

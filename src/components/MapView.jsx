import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
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
    box-shadow: 0 3px 12px rgba(59,130,246,0.4), 0 0 20px rgba(59,130,246,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    animation: pulse-runner 2s infinite;
  ">🏃</div>
  <style>
    @keyframes pulse-runner {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Task marker for the explore map
const taskIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 32px; height: 32px;
    background: #0D0D0D;
    border: 2px solid #00E676;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,230,118,0.3);
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

// Map Click Listener
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng);
    },
  });
  return null;
}

// Fetch real road route from OSRM
async function fetchRoute(points) {
  if (!points || points.length < 2) return null;
  const coords = points.map(p => `${p[1]},${p[0]}`).join(';');
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
        distance: route.distance, // meters
        duration: route.duration, // seconds
      };
    }
  } catch (err) {
    console.error('OSRM route error:', err);
  }
  return null;
}

// Format distance for display
function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Format duration for display
function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export default function MapView({
  pickup: propsPickup,
  pickupCoords,
  destination: propsDestination,
  destCoords,
  runnerPosition: propsRunnerPosition,
  runnerCoords,
  taskMarkers,
  center = [33.5731, -7.6322], // Casablanca center
  zoom = 13,
  height = '300px',
  className = '',
  interactive = true,
  onMapClick = null,
  showUserLocation = false,
  showRouteInfo = false,
  darkMode = true,
}) {
  const pickup = pickupCoords || propsPickup;
  const destination = destCoords || propsDestination;
  const runnerPosition = runnerCoords || propsRunnerPosition;

  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch real road route when pickup/destination/runner changes
  useEffect(() => {
    const points = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (runnerPosition) points.push([runnerPosition.lat, runnerPosition.lng]);
    if (destination) points.push([destination.lat, destination.lng]);

    if (points.length >= 2) {
      fetchRoute(points).then((result) => {
        if (result) {
          setRouteCoords(result.coordinates);
          setRouteInfo({ distance: result.distance, duration: result.duration });
        } else {
          // Fallback to straight line
          setRouteCoords(points);
          setRouteInfo(null);
        }
      });
    } else {
      setRouteCoords([]);
      setRouteInfo(null);
    }
  }, [
    pickup?.lat, pickup?.lng,
    destination?.lat, destination?.lng,
    runnerPosition?.lat, runnerPosition?.lng,
  ]);

  // Get user GPS location
  useEffect(() => {
    if (!showUserLocation) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => { /* silently fail */ },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [showUserLocation]);

  const bounds = [];
  if (pickup) bounds.push([pickup.lat, pickup.lng]);
  if (destination) bounds.push([destination.lat, destination.lng]);
  if (runnerPosition) bounds.push([runnerPosition.lat, runnerPosition.lng]);

  // Tile URLs
  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border border-border relative ${className}`} style={{ height }} id="map-view">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={interactive}
        scrollWheelZoom={interactive}
        touchZoom={interactive}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} />

        {onMapClick && <MapEvents onMapClick={onMapClick} />}

        {bounds.length >= 2 && <FitBounds bounds={bounds} />}

        {/* Real road route line */}
        {routeCoords.length >= 2 && (
          <>
            {/* Glow shadow behind route */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: '#00FF87',
                weight: 8,
                opacity: 0.15,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Main route line */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: '#00FF87',
                weight: 4,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {/* User GPS location */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={80}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              pathOptions={{
                color: 'white',
                fillColor: '#3B82F6',
                fillOpacity: 1,
                weight: 3,
              }}
            />
          </>
        )}

        {/* Pickup marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div style={{ fontWeight: 600, fontSize: 13 }}>📍 Pickup</div>
              <div style={{ fontSize: 11, color: '#888' }}>{pickup.address || pickup.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div style={{ fontWeight: 600, fontSize: 13 }}>🏁 Destination</div>
              <div style={{ fontSize: 11, color: '#888' }}>{destination.address || destination.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Runner position */}
        {runnerPosition && (
          <Marker position={[runnerPosition.lat, runnerPosition.lng]} icon={runnerIcon}>
            <Popup>
              <div style={{ fontWeight: 600, fontSize: 13 }}>🏃 Runner</div>
              <div style={{ fontSize: 11, color: '#888' }}>En route</div>
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
              <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
              <div style={{ fontSize: 12, color: '#00E676', fontWeight: 700, marginTop: 4 }}>{task.offeredPrice} MAD</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Route Info Overlay */}
      {showRouteInfo && routeInfo && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex gap-3 pointer-events-none">
          <div className="glass-panel border border-accent/30 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg pointer-events-auto">
            <span className="text-[18px]">📏</span>
            <div>
              <div className="text-[14px] font-black text-accent leading-none">{formatDistance(routeInfo.distance)}</div>
              <div className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider">Distance</div>
            </div>
          </div>
          <div className="glass-panel border border-border-light rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg pointer-events-auto">
            <span className="text-[18px]">⏱️</span>
            <div>
              <div className="text-[14px] font-black text-white leading-none">{formatDuration(routeInfo.duration)}</div>
              <div className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider">ETA</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { pickupIcon, destinationIcon, runnerIcon, taskIcon };

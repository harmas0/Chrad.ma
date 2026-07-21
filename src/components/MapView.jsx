import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Compass, Layers, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

// Fix default marker icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Tile Layer Styles
const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    name: 'Dark Mode',
    icon: '🌙',
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    name: 'Voyager',
    icon: '🗺️',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellite',
    icon: '🛰️',
  },
  cyberpunk: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    name: 'Cyber Neon',
    icon: '⚡',
  },
};

// Custom green marker for pickup
const pickupIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 42px; height: 42px;
    background: #00E676;
    border: 3.5px solid #FFFFFF;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 16px rgba(0,230,118,0.5), 0 0 25px rgba(0,230,118,0.3);
    display: flex; align-items: center; justify-content: center;
  ">
    <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

// Custom red marker for destination
const destinationIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 42px; height: 42px;
    background: #EF4444;
    border: 3.5px solid #FFFFFF;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 16px rgba(239,68,68,0.5), 0 0 25px rgba(239,68,68,0.3);
    display: flex; align-items: center; justify-content: center;
  ">
    <span style="transform: rotate(45deg); font-size: 16px;">🏁</span>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

// Custom blue marker for runner
const runnerIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="position: relative; width: 44px; height: 44px;">
    <div style="
      position: absolute; inset: -8px;
      border-radius: 50%;
      background: rgba(59,130,246,0.3);
      animation: sonar-pulse 1.8s infinite ease-out;
    "></div>
    <div style="
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 18px rgba(59,130,246,0.6), 0 0 30px rgba(59,130,246,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    ">🏃</div>
  </div>
  <style>
    @keyframes sonar-pulse {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  </style>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

// Task marker for the explore map
const taskIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 36px; height: 36px;
    background: #09090B;
    border: 2.5px solid #00E676;
    border-radius: 50%;
    box-shadow: 0 4px 14px rgba(0,230,118,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  ">💰</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Custom numbered yellow marker for waypoints (intermediate stops)
function getWaypointIcon(index) {
  return new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #FFD600 0%, #FFAB00 100%);
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(255,214,0,0.5);
      display: flex; align-items: center; justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-size: 13px; font-weight: 900; color: #000000;">${index + 1}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// Custom icon builder for task clusters
function getClusterIcon(count) {
  return new L.DivIcon({
    className: 'custom-cluster',
    html: `<div style="
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #00E676 0%, #00B0FF 100%);
      color: #0D0D0D;
      border: 3.5px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 20px rgba(0,255,135,0.6);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
      font-weight: 900;
      animation: pulse-cluster 2s infinite ease-in-out;
    ">${count}</div>
    <style>
      @keyframes pulse-cluster {
        0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(0,255,135,0.6); }
        50% { transform: scale(1.08); box-shadow: 0 4px 28px rgba(0,255,135,0.8); }
      }
    </style>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Map Controls Controller Component
function MapControls({ onZoomIn, onZoomOut, onRecenter, onToggleStyle, currentLayer }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
      {/* Tile Layer Selector */}
      <button
        onClick={onToggleStyle}
        title={`Current Map Style: ${TILE_LAYERS[currentLayer]?.name}`}
        className="glass-panel p-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all shadow-xl flex items-center justify-center bg-black/60 backdrop-blur-md active:scale-95"
      >
        <span className="text-base leading-none">{TILE_LAYERS[currentLayer]?.icon}</span>
      </button>

      {/* Recenter / Fit Bounds */}
      <button
        onClick={onRecenter}
        title="Reset View & Center"
        className="glass-panel p-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all shadow-xl flex items-center justify-center bg-black/60 backdrop-blur-md active:scale-95"
      >
        <Compass size={18} className="text-accent" />
      </button>

      {/* Zoom In & Out */}
      <div className="glass-panel rounded-xl border border-white/20 overflow-hidden flex flex-col bg-black/60 backdrop-blur-md shadow-xl">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2.5 text-white hover:bg-white/10 border-b border-white/10 transition-colors flex items-center justify-center"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2.5 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
        >
          <ZoomOut size={18} />
        </button>
      </div>
    </div>
  );
}

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

// Calculate bearing angle between two coords in degrees
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Dynamic rotated runner icon helper
function getRotatedRunnerIcon(bearing) {
  return new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 40px; height: 40px;
      background: #3B82F6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 3px 12px rgba(59,130,246,0.4), 0 0 20px rgba(59,130,246,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      transform: rotate(${bearing}deg);
      transition: transform 0.2s ease-out;
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
}

// Internal Map Controller for Programmatic Zoom/Pan
function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export default function MapView({
  pickup: propsPickup,
  pickupCoords,
  destination: propsDestination,
  destCoords,
  runnerPosition: propsRunnerPosition,
  runnerCoords,
  taskMarkers,
  runnerLocations = [],
  waypoints = [],
  showHeatmap = false,
  center = [33.5731, -7.6322], // Casablanca center
  zoom = 13,
  height = '300px',
  className = '',
  interactive = true,
  onMapClick = null,
  showUserLocation = false,
  showRouteInfo = false,
  darkMode = true,
  draggablePickup = false,
  draggableDestination = false,
  onMarkerDrag = null,
  onRouteCalculated = null,
  onTaskMarkerClick = null,
}) {
  const pickup = pickupCoords || propsPickup;
  const destination = destCoords || propsDestination;
  const runnerPosition = runnerCoords || propsRunnerPosition;

  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const [mapStyleKey, setMapStyleKey] = useState(darkMode ? 'dark' : 'voyager');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Runner smooth position interpolation state
  const [interpolatedRunnerPos, setInterpolatedRunnerPos] = useState(runnerPosition);
  const [runnerBearing, setRunnerBearing] = useState(0);

  const cycleMapStyle = () => {
    const keys = Object.keys(TILE_LAYERS);
    const currentIndex = keys.indexOf(mapStyleKey);
    const nextKey = keys[(currentIndex + 1) % keys.length];
    setMapStyleKey(nextKey);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Interpolate runner coordinates and calculate bearing when position changes
  useEffect(() => {
    if (!runnerPosition) {
      setInterpolatedRunnerPos(null);
      return;
    }

    if (!interpolatedRunnerPos) {
      setInterpolatedRunnerPos(runnerPosition);
      return;
    }

    const startLat = interpolatedRunnerPos.lat;
    const startLng = interpolatedRunnerPos.lng;
    const destLat = runnerPosition.lat;
    const destLng = runnerPosition.lng;

    // Calculate heading direction
    const bearing = calculateBearing(startLat, startLng, destLat, destLng);
    setRunnerBearing(bearing);

    // Smoothly step position over 1.5 seconds
    const duration = 1500;
    const intervalTime = 50;
    const totalSteps = duration / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      if (progress >= 1) {
        setInterpolatedRunnerPos(runnerPosition);
        clearInterval(timer);
      } else {
        const currentLat = startLat + (destLat - startLat) * progress;
        const currentLng = startLng + (destLng - startLng) * progress;
        setInterpolatedRunnerPos({ lat: currentLat, lng: currentLng });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [runnerPosition?.lat, runnerPosition?.lng]);

  // Fetch real road route when pickup/destination/runner/waypoints change
  useEffect(() => {
    const points = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach((wp) => {
        if (wp?.lat != null && wp?.lng != null) {
          points.push([wp.lat, wp.lng]);
        }
      });
    }
    if (runnerPosition) points.push([runnerPosition.lat, runnerPosition.lng]);
    if (destination) points.push([destination.lat, destination.lng]);

    if (points.length >= 2) {
      fetchRoute(points).then((result) => {
        if (result) {
          setRouteCoords(result.coordinates);
          const info = { distance: result.distance, duration: result.duration };
          setRouteInfo(info);
          onRouteCalculated?.({
            distanceKm: Number((result.distance / 1000).toFixed(2)),
            durationMin: Math.ceil(result.duration / 60),
            coordinates: result.coordinates,
          });
        } else {
          // Fallback to straight line
          setRouteCoords(points);
          setRouteInfo(null);
          onRouteCalculated?.(null);
        }
      });
    } else {
      setRouteCoords([]);
      setRouteInfo(null);
      onRouteCalculated?.(null);
    }
  }, [
    pickup?.lat, pickup?.lng,
    destination?.lat, destination?.lng,
    runnerPosition?.lat, runnerPosition?.lng,
    JSON.stringify(waypoints),
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
  if (waypoints && waypoints.length > 0) {
    waypoints.forEach(wp => {
      if (wp?.lat != null && wp?.lng != null) bounds.push([wp.lat, wp.lng]);
    });
  }
  if (destination) bounds.push([destination.lat, destination.lng]);
  if (interpolatedRunnerPos) bounds.push([interpolatedRunnerPos.lat, interpolatedRunnerPos.lng]);

  const selectedTileUrl = TILE_LAYERS[mapStyleKey]?.url || TILE_LAYERS.dark.url;

  // Math-based task marker clustering
  const clusteredTasks = [];
  if (taskMarkers && taskMarkers.length > 0) {
    const thresholdDegrees = 0.015; // roughly 1.5km
    taskMarkers.forEach((task) => {
      if (!task.pickup?.lat || !task.pickup?.lng) return;
      const lat = Number(task.pickup.lat);
      const lng = Number(task.pickup.lng);

      let found = false;
      for (const cluster of clusteredTasks) {
        const dx = Math.abs(cluster.lat - lat);
        const dy = Math.abs(cluster.lng - lng);
        if (dx < thresholdDegrees && dy < thresholdDegrees) {
          cluster.tasks.push(task);
          // average coordinates update
          cluster.lat = (cluster.lat * (cluster.tasks.length - 1) + lat) / cluster.tasks.length;
          cluster.lng = (cluster.lng * (cluster.tasks.length - 1) + lng) / cluster.tasks.length;
          found = true;
          break;
        }
      }
      if (!found) {
        clusteredTasks.push({
          id: `cluster-${task.id}`,
          lat,
          lng,
          tasks: [task],
        });
      }
    });
  }

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (bounds.length >= 2) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickup) {
      mapRef.current.setView([pickup.lat, pickup.lng], 14);
    } else {
      mapRef.current.setView(center, zoom);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl overflow-hidden shadow-2xl border border-border-light relative group transition-all duration-300 ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
      id="map-view"
    >
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
        <MapController mapRef={mapRef} />
        <TileLayer url={selectedTileUrl} />

        {onMapClick && <MapEvents onMapClick={onMapClick} />}

        {bounds.length >= 2 && <FitBounds bounds={bounds} />}

        {/* Real road route line */}
        {routeCoords.length >= 2 && (
          <>
            {/* Glow shadow behind route */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: mapStyleKey === 'cyberpunk' ? '#00E676' : '#00FF87',
                weight: 9,
                opacity: 0.25,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Main route line */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: mapStyleKey === 'cyberpunk' ? '#00E676' : '#00FF87',
                weight: 4.5,
                opacity: 0.95,
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
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={pickupIcon}
            draggable={draggablePickup}
            eventHandlers={draggablePickup ? {
              dragend: (e) => {
                const latlng = e.target.getLatLng();
                onMarkerDrag?.({ type: 'pickup', latlng: { lat: latlng.lat, lng: latlng.lng } });
              }
            } : undefined}
          >
            <Popup>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#00E676' }}>📍 Pickup Point</div>
              <div style={{ fontSize: 12, color: '#DDD', marginTop: 2 }}>{pickup.address || pickup.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Waypoint markers (Numbered) */}
        {waypoints?.map((wp, i) => (
          <Marker
            key={i}
            position={[wp.lat, wp.lng]}
            icon={getWaypointIcon(i)}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const latlng = e.target.getLatLng();
                onMarkerDrag?.({ type: `waypoint-${i}`, latlng: { lat: latlng.lat, lng: latlng.lng } });
              }
            }}
          >
            <Popup>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#FFD600' }}>📍 Waypoint #{i + 1}</div>
              <div style={{ fontSize: 12, color: '#DDD', marginTop: 2 }}>{wp.address || wp.name}</div>
            </Popup>
          </Marker>
        ))}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
            draggable={draggableDestination}
            eventHandlers={draggableDestination ? {
              dragend: (e) => {
                const latlng = e.target.getLatLng();
                onMarkerDrag?.({ type: 'destination', latlng: { lat: latlng.lat, lng: latlng.lng } });
              }
            } : undefined}
          >
            <Popup>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#EF4444' }}>🏁 Final Destination</div>
              <div style={{ fontSize: 12, color: '#DDD', marginTop: 2 }}>{destination.address || destination.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Runner position */}
        {interpolatedRunnerPos && (
          <Marker position={[interpolatedRunnerPos.lat, interpolatedRunnerPos.lng]} icon={getRotatedRunnerIcon(runnerBearing)}>
            <Popup>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#3B82F6' }}>🏃 Active Runner</div>
              <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>Live Telemetry Active</div>
            </Popup>
          </Marker>
        )}

        {/* Live Runner Locations (Multiple) */}
        {runnerLocations && runnerLocations.map((loc) => (
          <Marker 
            key={loc.runnerId || loc.id} 
            position={[loc.lat, loc.lng]} 
            icon={runnerIcon}
          >
            <Popup>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#3B82F6' }}>🏃 Runner ID: {loc.runnerId?.slice(0, 8)}</div>
              <div style={{ fontSize: 11, color: '#DDD', marginTop: 2 }}>
                {loc.taskId ? `Assigned Task: ${loc.taskId.slice(0, 8)}` : '🟢 Available for errands'}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Heatmap Layer if enabled */}
        {showHeatmap && taskMarkers?.map((task) => (
          <div key={`heat-${task.id}`}>
            <Circle
              center={[task.pickup.lat, task.pickup.lng]}
              radius={500}
              pathOptions={{
                color: '#FF3366',
                fillColor: '#FF3366',
                fillOpacity: 0.08,
                weight: 0,
              }}
            />
            <Circle
              center={[task.pickup.lat, task.pickup.lng]}
              radius={200}
              pathOptions={{
                color: '#FFCC00',
                fillColor: '#FFCC00',
                fillOpacity: 0.18,
                weight: 0,
              }}
            />
          </div>
        ))}

        {/* Task Markers (clustered if showHeatmap is false) */}
        {!showHeatmap && clusteredTasks.map((cluster) => {
          if (cluster.tasks.length === 1) {
            const task = cluster.tasks[0];
            return (
              <Marker
                key={task.id}
                position={[task.pickup.lat, task.pickup.lng]}
                icon={taskIcon}
                eventHandlers={{
                  click: () => onTaskMarkerClick?.(task),
                }}
              >
                <Popup>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: '#00E676', fontWeight: 800, marginTop: 4 }}>{task.offeredPrice} MAD</div>
                </Popup>
              </Marker>
            );
          } else {
            // Render cluster
            return (
              <Marker
                key={cluster.id}
                position={[cluster.lat, cluster.lng]}
                icon={getClusterIcon(cluster.tasks.length)}
                eventHandlers={{
                  click: (e) => {
                    const map = e.target._map;
                    map.setView([cluster.lat, cluster.lng], map.getZoom() + 2);
                  },
                }}
              >
                <Popup>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>📦 {cluster.tasks.length} Errands Nearby</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Click cluster to zoom into neighborhood</div>
                </Popup>
              </Marker>
            );
          }
        })}
      </MapContainer>

      {/* Floating Controls */}
      {interactive && (
        <MapControls
          currentLayer={mapStyleKey}
          onToggleStyle={cycleMapStyle}
          onRecenter={handleRecenter}
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
        />
      )}

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        title="Toggle Fullscreen Map"
        className="absolute top-4 left-4 z-[1000] glass-panel p-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all shadow-xl bg-black/60 backdrop-blur-md active:scale-95"
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      {/* Route Info Glass HUD */}
      {showRouteInfo && routeInfo && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex gap-3 pointer-events-none">
          <div className="glass-panel border border-accent/40 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl bg-black/75 backdrop-blur-md pointer-events-auto">
            <span className="text-[20px]">📏</span>
            <div>
              <div className="text-[15px] font-black text-accent leading-none">{formatDistance(routeInfo.distance)}</div>
              <div className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider mt-0.5">Route Distance</div>
            </div>
          </div>
          <div className="glass-panel border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl bg-black/75 backdrop-blur-md pointer-events-auto">
            <span className="text-[20px]">⏱️</span>
            <div>
              <div className="text-[15px] font-black text-white leading-none">{formatDuration(routeInfo.duration)}</div>
              <div className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider mt-0.5">Estimated Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { pickupIcon, destinationIcon, runnerIcon, taskIcon };

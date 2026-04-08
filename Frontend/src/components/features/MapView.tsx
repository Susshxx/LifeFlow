import React, { useState, useEffect, useRef } from 'react';
import { MapPinIcon, NavigationIcon, ZoomInIcon, ZoomOutIcon, LocateIcon, BuildingIcon, UserIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
interface MapPin {
  id: string;
  type: 'donor' | 'hospital';
  name: string;
  bloodGroup?: string;
  distance: string;
  lat: number;
  lng: number;
  available?: boolean;
}
interface MapViewProps {
  pins?: MapPin[];
  onPinClick?: (pin: MapPin) => void;
  className?: string;
  showControls?: boolean;
  showPins?: boolean;
}
const samplePins: MapPin[] = [{
  id: '1',
  type: 'donor',
  name: 'Ram Sharma',
  bloodGroup: 'A+',
  distance: '1.2 km',
  lat: 27.7172,
  lng: 85.324,
  available: true
}, {
  id: '2',
  type: 'donor',
  name: 'Sita Thapa',
  bloodGroup: 'O+',
  distance: '2.5 km',
  lat: 27.7072,
  lng: 85.314,
  available: true
}, {
  id: '3',
  type: 'hospital',
  name: 'Kathmandu Teaching Hospital',
  distance: '0.8 km',
  lat: 27.7272,
  lng: 85.334,
  available: true
}, {
  id: '4',
  type: 'donor',
  name: 'Hari Prasad',
  bloodGroup: 'B+',
  distance: '3.1 km',
  lat: 27.6972,
  lng: 85.344,
  available: false
}, {
  id: '5',
  type: 'hospital',
  name: 'Bir Hospital',
  distance: '1.5 km',
  lat: 27.7072,
  lng: 85.304,
  available: true
}, {
  id: '6',
  type: 'donor',
  name: 'Maya Gurung',
  bloodGroup: 'AB-',
  distance: '4.2 km',
  lat: 27.7372,
  lng: 85.294,
  available: true
}];
export function MapView({
  pins = [],
  onPinClick,
  className = '',
  showControls = true,
  showPins = true
}: MapViewProps) {
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pinMarkersRef = useRef<L.Marker[]>([]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map centered on Kathmandu
    const map = L.map(mapRef.current, {
      center: [27.7172, 85.324],
      zoom: 13,
      zoomControl: false, // We'll add custom controls
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Get user's real-time GPS location on mount - works for all users
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocating(false);

          // Center map on user location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([location.lat, location.lng], 13);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocating(false);
          // Fallback to Kathmandu center
          const fallback = { lat: 27.7172, lng: 85.324 };
          setUserLocation(fallback);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Fallback to Kathmandu center if geolocation not supported
      setUserLocation({ lat: 27.7172, lng: 85.324 });
    }
  }, []);

  // Add/update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Remove old marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Create custom blue pulsing icon for user location
    const userIcon = L.divIcon({
      className: '',
      html: `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.8; }
            }
          </style>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Add user marker
    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('<b>Your Location</b>');

    userMarkerRef.current = marker;
  }, [userLocation]);

  // Add/update pin markers
  useEffect(() => {
    if (!mapInstanceRef.current || !showPins) return;

    // Remove old markers
    pinMarkersRef.current.forEach(marker => marker.remove());
    pinMarkersRef.current = [];

    // Add new markers
    pins.forEach(pin => {
      if (!mapInstanceRef.current) return;

      const isDonor = pin.type === 'donor';
      const color = isDonor ? '#ef4444' : '#22c55e';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-size: 16px;
            color: white;
          ">
            ${isDonor ? '👤' : '🏥'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width: 150px;">
            <h4 style="margin: 0 0 8px; font-weight: bold;">${pin.name}</h4>
            ${pin.bloodGroup ? `<p style="margin: 4px 0;"><strong>Blood Group:</strong> ${pin.bloodGroup}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Distance:</strong> ${pin.distance}</p>
          </div>
        `);

      marker.on('click', () => {
        setSelectedPin(pin);
        onPinClick?.(pin);
      });

      pinMarkersRef.current.push(marker);
    });
  }, [pins, showPins, onPinClick]);

  const handlePinClick = (pin: MapPin) => {
    setSelectedPin(pin);
    onPinClick?.(pin);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  };

  return <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ minHeight: '400px' }}>
      {/* Leaflet Map Container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Map Controls */}
      {showControls && <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button onClick={handleZoomIn} className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors" aria-label="Zoom in">
            <ZoomInIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={handleZoomOut} className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors" aria-label="Zoom out">
            <ZoomOutIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={handleRecenter} className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors" aria-label="Re-center on your location">
            <LocateIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 z-10">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-gray-600">Your Location</span>
          </div>
          {showPins && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <span className="text-gray-600">Donors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-secondary" />
                <span className="text-gray-600">Hospitals</span>
              </div>
            </>
          )}
        </div>
        {locating && (
          <div className="mt-2 text-xs text-gray-500 animate-pulse">
            Getting your location...
          </div>
        )}
      </div>
    </div>;
}
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilterIcon, MapIcon, ListIcon, CalendarIcon, ClockIcon,
  LocateIcon, NavigationIcon, MapPinIcon, UsersIcon, CheckCircleIcon, MenuIcon,
  PlusIcon, XIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeDotIcon(color: string, size = 18, label = '') {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;color:#fff;">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

const ICONS = {
  you: () => makeDotIcon('#EAB308', 20),
  hospital: () => makeDotIcon('#22C55E', 20, 'H'),
  camp: () => makeDotIcon('#8B5CF6', 20, '⛺'),
  user: () => makeDotIcon('#3B82F6', 18, '👤'),
};

interface BloodCamp {
  _id?: string;
  id?: string;
  hospitalId?: any;
  title: string;
  description?: string;
  organizer?: string;
  expectedDonors?: number;
  date?: string;
  time?: string;
  startTime?: string | Date;
  duration?: number;
  location: {
    type?: string;
    lat: number;
    lng: number;
    label: string;
  } | string;
  address?: string;
  lat?: number;
  lng?: number;
  registeredCount?: number;
  registeredDonors?: any[];
  maxCapacity?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejectionReason?: string;
}

function buildCampPopupHTML(camp: BloodCamp) {
  const statusColor =
    camp.status === 'upcoming' || camp.status === 'approved' ? '#8B5CF6'
    : camp.status === 'ongoing' ? '#22C55E'
    : camp.status === 'pending' ? '#F59E0B'
    : '#6B7280';

  const statusLabel =
    camp.status === 'upcoming' || camp.status === 'approved' ? 'Upcoming'
    : camp.status === 'ongoing' ? 'Ongoing'
    : camp.status === 'pending' ? 'Pending Approval'
    : camp.status === 'completed' ? 'Completed'
    : 'Cancelled';

  const organizer = (camp as any).hospitalId?.hospitalName || (camp as any).hospitalId?.name || camp.organizer || 'Hospital';
  const locationObj = typeof camp.location === 'object' ? camp.location : null;
  const location = locationObj?.label || camp.location || camp.address || 'Location';
  const date = camp.date || (camp.startTime ? new Date(camp.startTime).toLocaleDateString() : 'TBD');
  const time = camp.time || (camp.startTime ? new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD');
  const registered = (camp as any).registeredDonors?.length || camp.registeredCount || 0;
  const capacity = (camp as any).expectedDonors || camp.maxCapacity || 0;

  return `<div style="min-width:240px;max-width:260px;font-family:sans-serif;">
    <div style="margin-bottom:10px;">
      <span style="background:${statusColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">${statusLabel}</span>
    </div>
    <h4 style="font-weight:700;font-size:14px;margin:0 0 8px;color:#1f2937;">${camp.title}</h4>
    <div style="font-size:11px;color:#4b5563;line-height:1.6;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span>🏢</span><span>${organizer}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span>📅</span><span>${date}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span>⏰</span><span>${time}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span>📍</span><span>${location}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span>👥</span><span>${registered}/${capacity} registered</span>
      </div>
    </div>
  </div>`;
}

function CampCard({ camp, onRegister, onDelete, onViewDetails, userRole }: {
  camp: BloodCamp;
  onRegister: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (camp: BloodCamp) => void;
  userRole?: string;
}) {
  const statusColor =
    camp.status === 'upcoming' || camp.status === 'approved' ? 'bg-purple-100 text-purple-700'
    : camp.status === 'ongoing' ? 'bg-green-100 text-green-700'
    : camp.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
    : camp.status === 'rejected' ? 'bg-red-100 text-red-700'
    : camp.status === 'cancelled' ? 'bg-gray-100 text-gray-500'
    : camp.status === 'completed' ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-700';

  const statusLabel =
    camp.status === 'upcoming' || camp.status === 'approved' ? 'Upcoming'
    : camp.status === 'ongoing' ? 'Ongoing'
    : camp.status === 'pending' ? 'Pending Approval'
    : camp.status === 'completed' ? 'Completed'
    : camp.status === 'rejected' ? 'Rejected'
    : camp.status === 'cancelled' ? 'Cancelled'
    : camp.status;

  const registered = (camp as any).registeredDonors?.length || camp.registeredCount || 0;
  const capacity = (camp as any).expectedDonors || camp.maxCapacity || 100;
  const progress = (registered / capacity) * 100;

  const locationObj = typeof camp.location === 'object' ? camp.location : null;
  const locationStr = locationObj?.label || (typeof camp.location === 'string' ? camp.location : camp.address || 'Location TBD');

  const organizer = (camp as any).hospitalId?.hospitalName || (camp as any).hospitalId?.name || camp.organizer || 'Hospital';
  const date = camp.date || (camp.startTime ? new Date(camp.startTime).toLocaleDateString() : 'TBD');
  const time = camp.time || (camp.startTime ? new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Badge className={statusColor}>{statusLabel}</Badge>
        <div className="text-right">
          <p className="text-xs text-gray-500">Capacity</p>
          <p className="text-sm font-semibold">{registered}/{capacity}</p>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{camp.title}</h3>
      <p className="text-sm text-gray-600 mb-4">{camp.description || 'Blood donation camp'}</p>
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 flex-shrink-0" />
          <span>{organizer}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 flex-shrink-0" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 flex-shrink-0" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span>{locationStr}</span>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Registration Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {onViewDetails && (
        <Button fullWidth variant="outline" onClick={() => onViewDetails(camp)} className="mb-2">
          View Details
        </Button>
      )}
      {userRole !== 'hospital' && (camp.status === 'upcoming' || camp.status === 'approved') && registered < capacity && (
        <Button fullWidth onClick={() => onRegister(camp._id || camp.id || '')}>
          Register Now
        </Button>
      )}
      {(camp.status === 'upcoming' || camp.status === 'approved') && registered >= capacity && (
        <Button fullWidth variant="outline" disabled>
          Fully Booked
        </Button>
      )}
      {camp.status === 'completed' && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <CheckCircleIcon className="w-4 h-4" />
          <span>Event Completed</span>
        </div>
      )}
      {camp.status === 'rejected' && (camp as any).rejectionReason && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <span className="font-semibold">Rejection reason: </span>
          {(camp as any).rejectionReason}
        </div>
      )}
      {camp.status === 'cancelled' && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-2">
          <span>Request Cancelled</span>
        </div>
      )}
      {userRole === 'hospital' && onDelete && camp.status !== 'cancelled' && camp.status !== 'completed' && (
        <Button
          fullWidth
          variant="outline"
          onClick={() => onDelete(camp._id || camp.id || '')}
          className="text-red-600 border-red-600 hover:bg-red-50 mt-2"
        >
          {camp.status === 'pending' ? 'Cancel Request' :
           camp.status === 'rejected' ? 'Remove Camp' :
           'Delete Camp'}
        </Button>
      )}
    </Card>
  );
}

export function BloodCampsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [camps, setCamps] = useState<BloodCamp[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [filters, setFilters] = useState({ status: '' });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expectedDonors: '',
    bloodGroups: ['All'] as string[],
    locationType: 'saved',
    customLat: '',
    customLng: '',
    customLabel: '',
    startDate: '',
    startTime: '',
    duration: '',
  });
  const [selectedCampForDetails, setSelectedCampForDetails] = useState<BloodCamp | null>(null);
  const [showCampDetailsModal, setShowCampDetailsModal] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selectedCampForRegistration, setSelectedCampForRegistration] = useState<BloodCamp | null>(null);
  const [registerFormData, setRegisterFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    weight: '',
    lastDonationMonth: '',
    lastDonationYear: '',
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const youMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const campMarkersRef = useRef<L.Marker[]>([]);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const customMapRef = useRef<HTMLDivElement>(null);
  const customMapInstanceRef = useRef<L.Map | null>(null);
  const customMarkerRef = useRef<L.Marker | null>(null);
  // Track whether map has been initialised so we don't double-init
  const mapInitialisedRef = useRef(false);

  const me = (() => { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } })();
  const userRole = me?.role || 'user';
  const savedLoc = me?.tempLocation as { lat: number; lng: number; label: string } | undefined;

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch camps and users from API
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const campsRes = await fetch(`${API}/api/blood-camps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (campsRes.ok) {
          const campsData = await campsRes.json();
          
          // Calculate dynamic status for each camp based on time
          const now = new Date();
          const campsWithStatus = campsData.map((camp: any) => {
            if (camp.status === 'approved') {
              const startTime = new Date(camp.startTime);
              const endTime = new Date(startTime);
              endTime.setHours(endTime.getHours() + (camp.duration || 0));
              
              // Update status based on time
              if (now > endTime) {
                return { ...camp, status: 'completed' };
              } else if (now >= startTime && now <= endTime) {
                return { ...camp, status: 'ongoing' };
              } else {
                return { ...camp, status: 'upcoming' };
              }
            }
            return camp;
          });
          
          setCamps(campsWithStatus);
        } else {
          const errorData = await campsRes.json().catch(() => ({ error: 'Unknown error' }));
          showToast(errorData.error || 'Failed to load blood camps', 'error');
        }

        try {
          const usersRes = await fetch(`${API}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData.filter((u: any) => u.tempLocation?.lat && u.tempLocation?.lng));
          }
        } catch (err) {
          console.error('Failed to fetch users:', err);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        showToast('Failed to load data. Please check your connection.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [showToast]);

  // Place "you" marker
  const placeYouMarker = useCallback((lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (youMarkerRef.current) {
      youMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const m = L.marker([lat, lng], { icon: ICONS.you(), zIndexOffset: 9999 }).addTo(map);
      m.bindPopup(`<div style="padding:6px 10px;font-weight:700;font-size:13px;color:#EAB308;">📍 You are here</div>`);
      youMarkerRef.current = m;
    }
  }, []);

  // Geolocation
  const requestLocation = useCallback((panMap = true) => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        setLocating(false);
        if (mapInstanceRef.current && panMap) {
          mapInstanceRef.current.setView([lat, lng], 14, { animate: true });
        }
        placeYouMarker(lat, lng);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) setLocError('Location permission denied.');
        else if (err.code === err.POSITION_UNAVAILABLE) setLocError('Location unavailable.');
        else if (err.code === err.TIMEOUT) setLocError('Location timed out.');
        else setLocError('Could not get location.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [placeYouMarker]);

  // Map initialization (depends on loading state to ensure container exists)
  useEffect(() => {
    if (loading) return;                    // wait until data is ready
    if (mapInitialisedRef.current) return;  // only init once
    if (!mapRef.current) return;

    const timer = setTimeout(() => {
      if (!mapRef.current || mapInitialisedRef.current) return;

      const startLat = me?.tempLocation?.lat ?? 27.7172;
      const startLng = me?.tempLocation?.lng ?? 85.3240;

      try {
        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true
        }).setView([startLat, startLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
        mapInitialisedRef.current = true;

        // Recalculate size after mount
        setTimeout(() => map.invalidateSize(), 150);

        // Hospital marker
        if (userRole === 'hospital' && savedLoc?.lat) {
          const hospitalMarker = L.marker([savedLoc.lat, savedLoc.lng], {
            icon: ICONS.hospital(),
            zIndexOffset: 9998,
          }).addTo(map);
          hospitalMarker.bindPopup(`<div style="padding:6px 10px;font-weight:700;font-size:13px;color:#22C55E;">🏥 ${savedLoc.label || 'Your Hospital'}</div>`);
          hospitalMarkerRef.current = hospitalMarker;
        }

        // "You" marker for saved location
        if (me?.tempLocation?.lat) {
          placeYouMarker(me.tempLocation.lat, me.tempLocation.lng);
        }
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [loading, placeYouMarker, userRole, savedLoc, me]);

  // Fix map size when switching back to map view
  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current) return;

    // Double invalidation for reliability when switching views
    mapInstanceRef.current.invalidateSize();
    
    // Second invalidation after browser paint
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  }, [viewMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }
      mapInitialisedRef.current = false;
      youMarkerRef.current = null;
      hospitalMarkerRef.current = null;
      campMarkersRef.current = [];
      userMarkersRef.current = [];
    };
  }, []);

  // Initialize custom location map picker
  useEffect(() => {
    if (formData.locationType !== 'custom' || !customMapRef.current) return;

    if (customMapInstanceRef.current) {
      try { customMapInstanceRef.current.remove(); } catch { /* ignore */ }
      customMapInstanceRef.current = null;
      customMarkerRef.current = null;
    }

    const timer = setTimeout(() => {
      if (!customMapRef.current) return;

      const startLat = savedLoc?.lat ?? 27.7172;
      const startLng = savedLoc?.lng ?? 85.3240;

      try {
        const map = L.map(customMapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true
        }).setView([startLat, startLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(map);

        customMapInstanceRef.current = map;
        setTimeout(() => { if (map && customMapRef.current) map.invalidateSize(); }, 150);

        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          handleFormChange('customLat', lat.toFixed(6));
          handleFormChange('customLng', lng.toFixed(6));

          if (customMarkerRef.current) map.removeLayer(customMarkerRef.current);

          const marker = L.marker([lat, lng], {
            icon: makeDotIcon('#8B5CF6', 24, '📍'),
            draggable: true,
          }).addTo(map);

          marker.on('dragend', (event: L.DragEndEvent) => {
            const position = event.target.getLatLng();
            handleFormChange('customLat', position.lat.toFixed(6));
            handleFormChange('customLng', position.lng.toFixed(6));
          });

          customMarkerRef.current = marker;
        });

        if (formData.customLat && formData.customLng) {
          const lat = parseFloat(formData.customLat);
          const lng = parseFloat(formData.customLng);
          if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.marker([lat, lng], {
              icon: makeDotIcon('#8B5CF6', 24, '📍'),
              draggable: true,
            }).addTo(map);
            marker.on('dragend', (event: L.DragEndEvent) => {
              const position = event.target.getLatLng();
              handleFormChange('customLat', position.lat.toFixed(6));
              handleFormChange('customLng', position.lng.toFixed(6));
            });
            customMarkerRef.current = marker;
            map.setView([lat, lng], 14);
          }
        }
      } catch (error) {
        console.error('Custom map initialization error:', error);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (customMapInstanceRef.current) {
        try { customMapInstanceRef.current.remove(); } catch { /* ignore */ }
        customMapInstanceRef.current = null;
      }
      customMarkerRef.current = null;
    };
  }, [formData.locationType, formData.customLat, formData.customLng, savedLoc]);

  // Render camp and user markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    
    // Skip if map not ready, still loading, or in list view
    if (!map || loading || viewMode !== 'map') return;
    
    // Clear existing camp markers
    campMarkersRef.current.forEach(m => {
      try {
        map.removeLayer(m);
      } catch (e) {
        // Marker might already be removed
      }
    });
    campMarkersRef.current = [];

    // Clear existing user markers
    userMarkersRef.current.forEach(m => {
      try {
        map.removeLayer(m);
      } catch (e) {
        // Marker might already be removed
      }
    });
    userMarkersRef.current = [];

    // Add camp markers
    camps.forEach(camp => {
      if (filters.status && camp.status !== filters.status) return;
      
      // Handle location - could be object or old format
      let lat: number | undefined;
      let lng: number | undefined;
      
      if (typeof camp.location === 'object' && camp.location.lat && camp.location.lng) {
        lat = camp.location.lat;
        lng = camp.location.lng;
      } else if (camp.lat && camp.lng) {
        lat = camp.lat;
        lng = camp.lng;
      }
      
      if (!lat || !lng) return;

      try {
        const marker = L.marker([lat, lng], { 
          icon: ICONS.camp(), 
          zIndexOffset: 1000 
        }).addTo(map);
        
        marker.bindPopup(buildCampPopupHTML(camp), { maxWidth: 280 });
        campMarkersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding camp marker:', error);
      }
    });

    // Add user markers (only if not too many to prevent performance issues)
    if (users.length < 100) {
      users.forEach(user => {
        if (!user.tempLocation?.lat || !user.tempLocation?.lng) return;
        if (user._id === me?._id) return; // Skip current user (already shown as "you")

        try {
          const marker = L.marker([user.tempLocation.lat, user.tempLocation.lng], { 
            icon: ICONS.user(), 
            zIndexOffset: 500 
          }).addTo(map);
          
          const bloodGroup = user.bloodGroup || 'Unknown';
          const displayName = user.name || 'Donor';
          marker.bindPopup(
            `<div style="padding:8px 12px;font-family:sans-serif;min-width:120px;text-align:center;">
              <div style="font-size:22px;margin-bottom:4px;">🩸</div>
              <div style="font-weight:800;font-size:16px;color:#B91C1C;margin-bottom:2px;">${bloodGroup}</div>
              <div style="font-size:11px;color:#6b7280;">${displayName}</div>
            </div>`,
            { closeButton: false, offset: [0, -8] }
          );
          // Open on hover, close on mouse out
          marker.on('mouseover', () => marker.openPopup());
          marker.on('mouseout', () => marker.closePopup());
          
          userMarkersRef.current.push(marker);
        } catch (error) {
          console.error('Error adding user marker:', error);
        }
      });
    }
  }, [camps, users, filters.status, loading, viewMode, me]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleRegister = (campId: string) => {
    const camp = camps.find(c => c._id === campId || c.id === campId);
    if (!camp) return;
    
    setSelectedCampForRegistration(camp);
    setRegisterFormData({
      fullName: me?.name || '',
      email: me?.email || '',
      phone: me?.phone || '',
      age: '',
      weight: '',
      lastDonationMonth: '',
      lastDonationYear: '',
    });
    setShowRegisterDialog(true);
  };

  const handleSubmitRegistration = async () => {
    if (!selectedCampForRegistration) return;

    const token = localStorage.getItem('lf_token');
    if (!token) {
      showToast('Please log in first.', 'error');
      return;
    }

    if (!registerFormData.fullName || !registerFormData.email || !registerFormData.phone) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const campId = selectedCampForRegistration._id || selectedCampForRegistration.id;
      const res = await fetch(`${API}/api/camp-registration/${campId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(registerFormData),
      });

      if (!res.ok) {
        const error = await res.json();
        showToast(error.error || 'Failed to register for blood camp.', 'error');
        return;
      }

      showToast('Successfully registered for blood camp!', 'success');
      setShowRegisterDialog(false);
      setSelectedCampForRegistration(null);

      // Refresh camps
      const refreshRes = await fetch(`${API}/api/blood-camps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshRes.ok) setCamps(await refreshRes.json());
    } catch (err) {
      console.error('Registration error:', err);
      showToast('Failed to register for blood camp.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (campId: string) => {
    const camp = camps.find(c => c._id === campId || c.id === campId);
    const isPending = camp?.status === 'pending';
    const confirmMsg = isPending
      ? 'Cancel this blood camp request? This will remove it from admin review.'
      : 'Are you sure you want to delete this blood camp?';
    if (!confirm(confirmMsg)) return;

    const token = localStorage.getItem('lf_token');
    if (!token) return;

    try {
      let res;
      if (isPending) {
        res = await fetch(`${API}/api/blood-camps/${campId}/cancel`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          showToast('Blood camp request cancelled successfully', 'success');
          const refreshRes = await fetch(`${API}/api/blood-camps`, { headers: { Authorization: `Bearer ${token}` } });
          if (refreshRes.ok) setCamps(await refreshRes.json());
        } else {
          const error = await res.json();
          showToast(error.error || 'Failed to cancel camp request', 'error');
        }
      } else {
        res = await fetch(`${API}/api/blood-camps/${campId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          showToast('Blood camp deleted successfully', 'success');
          setCamps(prev => prev.filter(c => c._id !== campId && c.id !== campId));
        } else {
          const error = await res.json();
          showToast(error.error || 'Failed to delete camp', 'error');
        }
      }
    } catch {
      showToast('Failed to process camp action', 'error');
    }
  };

  const handleViewDetails = (camp: BloodCamp) => {
    setSelectedCampForDetails(camp);
    setShowCampDetailsModal(true);
  };

  const handleFilterChange = (key: string, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ status: '' });

  const handleFormChange = (key: string, value: string | string[]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmitCamp = async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) { showToast('Please log in first.', 'error'); return; }

    if (!formData.title || !formData.expectedDonors || !formData.startDate || !formData.startTime || !formData.duration) {
      showToast('Please fill in all required fields.', 'error'); return;
    }
    if (formData.locationType === 'custom' && (!formData.customLat || !formData.customLng || !formData.customLabel)) {
      showToast('Please provide custom location details.', 'error'); return;
    }
    if (formData.locationType === 'saved' && !savedLoc?.lat) {
      showToast('No saved location found. Please set one in Settings or use custom location.', 'error'); return;
    }

    setSubmitting(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const location = formData.locationType === 'saved'
        ? { type: 'saved', lat: savedLoc!.lat, lng: savedLoc!.lng, label: savedLoc!.label }
        : { type: 'custom', lat: parseFloat(formData.customLat), lng: parseFloat(formData.customLng), label: formData.customLabel };

      const res = await fetch(`${API}/api/blood-camps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          expectedDonors: parseInt(formData.expectedDonors),
          bloodGroups: formData.bloodGroups,
          location,
          startTime: startDateTime.toISOString(),
          duration: parseInt(formData.duration),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        showToast(error.error || 'Failed to submit blood camp request.', 'error');
        return;
      }

      showToast('Blood camp request submitted for admin approval!', 'success');
      setShowAddDialog(false);
      setFormData({
        title: '', description: '', expectedDonors: '', bloodGroups: ['All'],
        locationType: 'saved', customLat: '', customLng: '', customLabel: '',
        startDate: '', startTime: '', duration: '',
      });

      const refreshRes = await fetch(`${API}/api/blood-camps`, { headers: { Authorization: `Bearer ${token}` } });
      if (refreshRes.ok) setCamps(await refreshRes.json());
    } catch {
      showToast('Failed to submit blood camp request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;
  const filteredCamps = camps.filter(camp => !filters.status || camp.status === filters.status);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={userRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
            background: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.msg}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Open menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Blood Donation Camps</h1>
                <p className="text-gray-600 mt-1">Find and register for upcoming blood donation camps</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userRole === 'hospital' && (
                <Button onClick={() => setShowAddDialog(true)} leftIcon={<PlusIcon className="w-4 h-4" />}>
                  Add Blood Camp
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(userRole === 'hospital' ? '/hospital/dashboard' : '/dashboard')}>
                Back to Dashboard
              </Button>
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar filters */}
            <aside className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <Card className="sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                    <FilterIcon className="w-5 h-5" /> Filters
                    {activeFilterCount > 0 && <Badge variant="primary" size="sm">{activeFilterCount}</Badge>}
                  </h2>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear all</button>
                  )}
                </div>
                <div className="space-y-4">
                  <Select
                    label="Status"
                    options={[
                      { value: '', label: 'All Camps' },
                      { value: 'upcoming', label: 'Upcoming' },
                      { value: 'ongoing', label: 'Ongoing' },
                      { value: 'completed', label: 'Completed' },
                    ]}
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                  />
                  {locError && (
                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{locError}</div>
                  )}
                  <Button fullWidth variant="outline" leftIcon={<LocateIcon className="w-4 h-4" />}
                    onClick={() => requestLocation(true)} isLoading={locating}>
                    {locating ? 'Getting location…' : 'Use My Live Location'}
                  </Button>
                  {userPos && !locating && (
                    <p className="text-xs text-center text-gray-400">📍 {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">Map Legend</p>
                  {[
                    { color: '#EAB308', label: 'Your location' },
                    { color: '#22C55E', label: 'Hospital' },
                    { color: '#8B5CF6', label: 'Blood camp' },
                    { color: '#3B82F6', label: 'Donors (hover for blood group)' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: `0 1px 4px ${color}88`, flexShrink: 0 }} />
                      {label}
                    </div>
                  ))}
                </div>
              </Card>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading blood camps...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-semibold">{filteredCamps.length}</span> camp{filteredCamps.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/*
                    KEY FIX: The map div is ALWAYS rendered in the DOM.
                    We hide it with display:none (not conditional rendering) so
                    Leaflet's canvas is never destroyed between view switches.
                  */}
                  <div
                    className="rounded-xl overflow-hidden shadow-lg mb-6"
                    style={{
                      height: 520,
                      position: 'relative',
                      zIndex: 0,
                      display: viewMode === 'map' ? 'block' : 'none',
                    }}
                  >
                    {locating && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 400,
                        background: 'rgba(255,255,255,0.55)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: 10, backdropFilter: 'blur(2px)',
                      }}>
                        <NavigationIcon className="w-8 h-8 text-yellow-500 animate-spin" />
                        <p style={{ fontWeight: 600, color: '#EAB308', fontSize: 14 }}>Getting your precise location…</p>
                      </div>
                    )}
                    <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                    {!locating && (
                      <button
                        onClick={() => requestLocation(true)}
                        style={{
                          position: 'absolute', bottom: 16, right: 16, zIndex: 500,
                          background: '#fff', border: '2px solid #EAB308', borderRadius: 8,
                          padding: '6px 12px', fontWeight: 600, fontSize: 12, color: '#EAB308',
                          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <LocateIcon style={{ width: 14, height: 14 }} /> Re-centre
                      </button>
                    )}
                  </div>

                  {/* List view */}
                  {viewMode === 'list' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredCamps.map(camp => (
                        <CampCard
                          key={camp.id || camp._id}
                          camp={camp}
                          onRegister={handleRegister}
                          onDelete={handleDelete}
                          onViewDetails={handleViewDetails}
                          userRole={userRole}
                        />
                      ))}
                      {filteredCamps.length === 0 && (
                        <div className="col-span-2 text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <MapPinIcon className="w-16 h-16 mx-auto mb-2" />
                          </div>
                          <p className="text-gray-700 font-medium mb-2">No blood camps found</p>
                          <p className="text-gray-500 text-sm mb-4">
                            {filters.status
                              ? 'Try adjusting your filters or create a new blood camp.'
                              : userRole === 'hospital'
                                ? 'Create your first blood camp to get started.'
                                : 'No camps are currently available.'}
                          </p>
                          {userRole === 'hospital' && (
                            <Button onClick={() => setShowAddDialog(true)} leftIcon={<PlusIcon className="w-4 h-4" />}>
                              Create Blood Camp
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Add Blood Camp Dialog */}
        {showAddDialog && (
          <Modal isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} title="Create Blood Donation Camp" size="lg">
            <div className="space-y-4">
              <Input
                label="Camp Title"
                placeholder="e.g., World Blood Donor Day Camp"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the blood camp..."
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
              </div>
              <Input
                label="Expected Number of Donors"
                type="number"
                placeholder="e.g., 100"
                value={formData.expectedDonors}
                onChange={(e) => handleFormChange('expectedDonors', e.target.value)}
                required
                min="1"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Groups Needed <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => {
                        const current = formData.bloodGroups || [];
                        if (bg === 'All') {
                          handleFormChange('bloodGroups', ['All']);
                        } else {
                          const filtered = current.filter(g => g !== 'All');
                          if (filtered.includes(bg)) {
                            const newGroups = filtered.filter(g => g !== bg);
                            handleFormChange('bloodGroups', newGroups.length > 0 ? newGroups : ['All']);
                          } else {
                            handleFormChange('bloodGroups', [...filtered, bg]);
                          }
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        (formData.bloodGroups || ['All']).includes(bg)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Select "All" for all blood groups, or select specific groups needed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleFormChange('locationType', 'saved')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      formData.locationType === 'saved' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={!savedLoc?.lat}
                  >
                    Use Saved Location
                  </button>
                  <button
                    onClick={() => handleFormChange('locationType', 'custom')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      formData.locationType === 'custom' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Custom Location
                  </button>
                </div>

                {formData.locationType === 'saved' && savedLoc?.lat && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <p className="font-medium text-green-900">📍 {savedLoc.label}</p>
                    <p className="text-green-700 text-xs mt-1">{savedLoc.lat.toFixed(4)}, {savedLoc.lng.toFixed(4)}</p>
                  </div>
                )}
                {formData.locationType === 'saved' && !savedLoc?.lat && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    No saved location found. Please set one in Settings or use custom location.
                  </div>
                )}
                {formData.locationType === 'custom' && (
                  <div className="space-y-3">
                    <Input
                      label="Location Name"
                      placeholder="e.g., Ratna Park, Kathmandu"
                      value={formData.customLabel}
                      onChange={(e) => handleFormChange('customLabel', e.target.value)}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pick Location on Map <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                        <div ref={customMapRef} style={{ height: '350px', width: '100%' }} />
                        <div className="p-3 bg-purple-50 text-sm text-purple-700 flex items-start gap-2">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Click on the map to place a marker</p>
                            <p className="text-xs mt-1">You can drag the marker to adjust the location</p>
                            {formData.customLat && formData.customLng && (
                              <p className="text-xs mt-1 text-purple-600">
                                📍 Selected: {parseFloat(formData.customLat).toFixed(4)}, {parseFloat(formData.customLng).toFixed(4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  required
                />
              </div>

              <Input
                label="Duration (hours)"
                type="number"
                placeholder="e.g., 8"
                value={formData.duration}
                onChange={(e) => handleFormChange('duration', e.target.value)}
                required
                min="1"
                max="24"
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-medium">ℹ️ Note:</p>
                <p className="mt-1">Your blood camp request will be sent to the admin for approval. You'll be notified once it's approved.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button fullWidth variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button fullWidth onClick={handleSubmitCamp} isLoading={submitting}>
                  Submit Request
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Camp Details Modal */}
        {showCampDetailsModal && selectedCampForDetails && (
          <Modal
            isOpen={showCampDetailsModal}
            onClose={() => { setShowCampDetailsModal(false); setSelectedCampForDetails(null); }}
            title="Blood Camp Details"
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedCampForDetails.title}</h3>
                <p className="text-gray-600">{selectedCampForDetails.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Organizer</p>
                  <p className="font-medium text-gray-900">
                    {(selectedCampForDetails as any).hospitalId?.hospitalName ||
                     (selectedCampForDetails as any).hospitalId?.name ||
                     selectedCampForDetails.organizer || 'Hospital'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <Badge
                    variant={
                      selectedCampForDetails.status === 'approved' ? 'success' :
                      selectedCampForDetails.status === 'pending' ? 'warning' :
                      selectedCampForDetails.status === 'rejected' ? 'error' : 'default'
                    }
                  >
                    {selectedCampForDetails.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {selectedCampForDetails.startTime
                      ? new Date(selectedCampForDetails.startTime).toLocaleString()
                      : selectedCampForDetails.date || 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="font-medium text-gray-900">{(selectedCampForDetails as any).duration || 'N/A'} hours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Expected Donors</p>
                  <p className="font-medium text-gray-900">
                    {(selectedCampForDetails as any).expectedDonors || selectedCampForDetails.maxCapacity || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Registered</p>
                  <p className="font-medium text-gray-900">
                    {(selectedCampForDetails as any).registeredDonors?.length || selectedCampForDetails.registeredCount || 0}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Blood Groups Needed</p>
                  <div className="flex gap-1 flex-wrap">
                    {((selectedCampForDetails as any).bloodGroups || ['All']).map((bg: string) => (
                      <Badge key={bg} variant="primary" size="sm">{bg}</Badge>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-medium text-gray-900">
                    {typeof selectedCampForDetails.location === 'object'
                      ? selectedCampForDetails.location.label
                      : selectedCampForDetails.location || selectedCampForDetails.address || 'Unknown'}
                  </p>
                </div>
                {selectedCampForDetails.status === 'rejected' && (selectedCampForDetails as any).rejectionReason && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Rejection Reason</p>
                    <p className="text-red-600 text-sm">{(selectedCampForDetails as any).rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Registered Donors Section */}
              {(selectedCampForDetails as any).registeredDonors && (selectedCampForDetails as any).registeredDonors.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Registered Donors ({(selectedCampForDetails as any).registeredDonors.length})</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {(selectedCampForDetails as any).registeredDonors.map((donor: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{donor.fullName || donor.userId?.name || 'Anonymous'}</p>
                            <div className="mt-1 space-y-1 text-xs text-gray-600">
                              {donor.email && <p>📧 {donor.email}</p>}
                              {donor.phone && <p>📱 {donor.phone}</p>}
                              {donor.age && <p>👤 Age: {donor.age}</p>}
                              {donor.weight && <p>⚖️ Weight: {donor.weight} kg</p>}
                              {donor.lastDonationMonth && donor.lastDonationYear && (
                                <p>🩸 Last Donation: {donor.lastDonationMonth} {donor.lastDonationYear}</p>
                              )}
                              {donor.userId?.bloodGroup && (
                                <p>🩸 Blood Group: <span className="font-semibold text-red-600">{donor.userId.bloodGroup}</span></p>
                              )}
                            </div>
                          </div>
                          {donor.registeredAt && (
                            <p className="text-xs text-gray-400 ml-2">
                              {new Date(donor.registeredAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => { setShowCampDetailsModal(false); setSelectedCampForDetails(null); }}
                >
                  Close
                </Button>
                {userRole === 'hospital' && (
                  <Button
                    fullWidth
                    variant="primary"
                    onClick={() => {
                      handleDelete(selectedCampForDetails._id || selectedCampForDetails.id || '');
                      setShowCampDetailsModal(false);
                      setSelectedCampForDetails(null);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {selectedCampForDetails.status === 'pending' ? 'Cancel Request' :
                     selectedCampForDetails.status === 'rejected' ? 'Remove Camp' :
                     'Delete Camp'}
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Registration Dialog */}
        {showRegisterDialog && selectedCampForRegistration && (
          <Modal
            isOpen={showRegisterDialog}
            onClose={() => { setShowRegisterDialog(false); setSelectedCampForRegistration(null); }}
            title="Register for Blood Camp"
            size="md"
          >
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-1">{selectedCampForRegistration.title}</h4>
                <p className="text-sm text-purple-700">
                  {selectedCampForRegistration.startTime
                    ? new Date(selectedCampForRegistration.startTime).toLocaleString()
                    : 'TBD'}
                </p>
              </div>

              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={registerFormData.fullName}
                onChange={(e) => setRegisterFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="your.email@example.com"
                value={registerFormData.email}
                onChange={(e) => setRegisterFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                value={registerFormData.phone}
                onChange={(e) => setRegisterFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Age"
                  type="number"
                  placeholder="Your age"
                  value={registerFormData.age}
                  onChange={(e) => setRegisterFormData(prev => ({ ...prev, age: e.target.value }))}
                  min="18"
                  max="65"
                />

                <Input
                  label="Weight (kg)"
                  type="number"
                  placeholder="Your weight"
                  value={registerFormData.weight}
                  onChange={(e) => setRegisterFormData(prev => ({ ...prev, weight: e.target.value }))}
                  min="45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Blood Donation (Optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label=""
                    options={[
                      { value: '', label: 'Month' },
                      { value: 'January', label: 'January' },
                      { value: 'February', label: 'February' },
                      { value: 'March', label: 'March' },
                      { value: 'April', label: 'April' },
                      { value: 'May', label: 'May' },
                      { value: 'June', label: 'June' },
                      { value: 'July', label: 'July' },
                      { value: 'August', label: 'August' },
                      { value: 'September', label: 'September' },
                      { value: 'October', label: 'October' },
                      { value: 'November', label: 'November' },
                      { value: 'December', label: 'December' },
                    ]}
                    value={registerFormData.lastDonationMonth}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, lastDonationMonth: e.target.value }))}
                  />
                  <Input
                    label=""
                    type="number"
                    placeholder="Year"
                    value={registerFormData.lastDonationYear}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, lastDonationYear: e.target.value }))}
                    min="1950"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-medium">ℹ️ Important:</p>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>You must be between 18-65 years old</li>
                  <li>Minimum weight requirement: 45 kg</li>
                  <li>At least 3 months gap since last donation</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => { setShowRegisterDialog(false); setSelectedCampForRegistration(null); }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button fullWidth onClick={handleSubmitRegistration} isLoading={submitting}>
                  Register
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}


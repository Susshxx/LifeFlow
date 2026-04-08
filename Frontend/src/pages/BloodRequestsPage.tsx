import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FilterIcon, MapIcon, ListIcon, AlertTriangleIcon, XIcon,
  LocateIcon, NavigationIcon, PhoneIcon, MailIcon, MapPinIcon, MenuIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
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

// Blood request pin — dark orange with light red halo
function makeBloodRequestIcon(isEmergency: boolean) {
  const coreColor = isEmergency ? '#B91C1C' : '#C2410C';
  const haloColor = isEmergency ? '#FCA5A5' : '#FDBA74';
  const pulseStyle = isEmergency
    ? `@keyframes ep{0%,100%{box-shadow:0 0 0 0 ${haloColor}88}70%{box-shadow:0 0 0 10px transparent}}`
    : '';
  const pulseCSS = isEmergency ? `animation:ep 1.2s infinite;` : '';
  return L.divIcon({
    className: '',
    html: `<style>${pulseStyle}</style>
      <div style="width:20px;height:20px;border-radius:50%;background:${coreColor};
        border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
        font-size:9px;font-weight:800;color:#fff;${pulseCSS}">🩸</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });
}

function makeDotIcon(color: string, size = 18) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

const ICONS = {
  you: () => makeDotIcon('#EAB308', 20),
  request: () => makeBloodRequestIcon(false),
  emergency: () => makeBloodRequestIcon(true),
};

interface BloodRequest {
  _id: string;
  userId: string | { _id: string; avatar?: string };
  name: string;
  phone: string;
  email: string;
  bloodGroup: string;
  isEmergency: boolean;
  location: { lat: number; lng: number; label: string };
  createdAt: string;
}

const bloodGroupOptions = [
  { value: '', label: 'All Blood Groups' },
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
];

function buildBloodRequestPopupHTML(req: BloodRequest, isMe: boolean) {
  const bg = req.isEmergency ? '#FEF2F2' : '#FFF7ED';
  const border = req.isEmergency ? '#FCA5A5' : '#FDBA74';
  const badge = req.isEmergency ? '#B91C1C' : '#C2410C';

  return `<div style="min-width:220px;max-width:250px;font-family:sans-serif;background:${bg};padding:12px;border-radius:8px;border:2px solid ${border};">
    ${req.isEmergency ? '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="font-size:16px;">🚨</span><span style="font-weight:800;color:#B91C1C;font-size:13px;">EMERGENCY REQUEST</span></div>' : ''}
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <div style="width:36px;height:36px;border-radius:50%;background:${badge};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;flex-shrink:0;">${req.bloodGroup}</div>
      <div style="min-width:0;">
        <p style="font-weight:700;font-size:13px;margin:0;color:#1f2937;">${req.name}</p>
        <p style="font-size:10px;color:#6b7280;margin:2px 0 0;">Requested ${new Date(req.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
    <div style="font-size:11px;color:#4b5563;margin-top:8px;line-height:1.4;">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
        <span>📞</span><span>${req.phone}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
        <span>✉️</span><span style="word-break:break-all;">${req.email}</span>
      </div>
      ${req.location?.label ? `<div style="display:flex;align-items:center;gap:4px;"><span>📍</span><span>${req.location.label}</span></div>` : ''}
    </div>
    ${isMe ? '<p style="text-align:center;font-size:10px;color:#6b7280;margin-top:8px;font-style:italic;">This is your request</p>' : ''}
  </div>`;
}

function BloodRequestCard({ req, isMe }: { req: BloodRequest; isMe: boolean }) {
  const isEmergency = req.isEmergency;
  const border = isEmergency ? '#FCA5A5' : '#FDBA74';
  const bg = isEmergency ? '#FEF2F2' : '#FFF7ED';
  const badge = isEmergency ? '#B91C1C' : '#C2410C';

  return (
    <div style={{ border: `2px solid ${border}`, borderRadius: 12, padding: 16, background: bg }}>
      {isEmergency && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <span style={{ fontWeight: 800, color: '#B91C1C', fontSize: 14 }}>EMERGENCY REQUEST</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: badge, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>
          {req.bloodGroup}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#1f2937' }}>{req.name}</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            Requested {new Date(req.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <PhoneIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>{req.phone}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <MailIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span style={{ wordBreak: 'break-all' }}>{req.email}</span>
        </div>
        {req.location?.label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPinIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>{req.location.label}</span>
          </div>
        )}
      </div>
      {isMe && (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginTop: 12, fontStyle: 'italic' }}>
          This is your request
        </p>
      )}
    </div>
  );
}

export function BloodRequestsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [filters, setFilters] = useState({ bloodGroup: '', emergencyOnly: false });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const youMarkerRef = useRef<L.Marker | null>(null);
  const requestMarkersRef = useRef<L.Marker[]>([]);

  const me = (() => { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } })();
  const userRole = me?.role || 'user';
  const myId = me?.id || me?._id || null;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch blood requests
  const fetchBloodRequests = useCallback(async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/blood-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data: BloodRequest[] = await res.json();
      setBloodRequests(data);
    } catch { }
  }, []);

  useEffect(() => {
    fetchBloodRequests();
    const interval = setInterval(fetchBloodRequests, 30_000);
    return () => clearInterval(interval);
  }, [fetchBloodRequests]);

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

  const requestLocation = useCallback((panMap = true) => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    setLocating(true); setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng }); setLocating(false);
        const map = mapInstanceRef.current;
        if (map && panMap) {
          map.setView([lat, lng], 14, { animate: true });
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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const paramLat = searchParams.get('lat');
    const paramLng = searchParams.get('lng');
    const startLat = paramLat ? parseFloat(paramLat) : me?.tempLocation?.lat ?? 27.7172;
    const startLng = paramLng ? parseFloat(paramLng) : me?.tempLocation?.lng ?? 85.3240;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([startLat, startLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    if (me?.tempLocation?.lat) placeYouMarker(me.tempLocation.lat, me.tempLocation.lng);
    requestLocation(false);
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      youMarkerRef.current = null;
    };
  }, [requestLocation, placeYouMarker, searchParams]); // eslint-disable-line

  // Render blood request markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    requestMarkersRef.current.forEach(m => map.removeLayer(m));
    requestMarkersRef.current = [];

    bloodRequests.forEach(req => {
      if (!req.location?.lat) return;
      if (filters.bloodGroup && req.bloodGroup !== filters.bloodGroup) return;
      if (filters.emergencyOnly && !req.isEmergency) return;

      const uid = typeof req.userId === 'object' ? (req.userId as any)._id : req.userId;
      const isMe = uid === myId;
      const icon = req.isEmergency ? ICONS.emergency() : ICONS.request();
      const marker = L.marker([req.location.lat, req.location.lng], { icon, zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(buildBloodRequestPopupHTML(req, isMe), { maxWidth: 270 });
      requestMarkersRef.current.push(marker);
    });
  }, [bloodRequests, filters, myId]);

  const handleFilterChange = (key: string, value: string | boolean) =>
    setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ bloodGroup: '', emergencyOnly: false });
  const activeFilterCount = Object.values(filters).filter(v => v && v !== true).length;

  const emergencyRequests = bloodRequests.filter(r => r.isEmergency);
  const normalRequests = bloodRequests.filter(r => !r.isEmergency);

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
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Blood Requests</h1>
              <p className="text-gray-600 mt-1">View all active blood requests on the map</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(userRole === 'hospital' ? '/hospital/dashboard' : '/dashboard')}>
              Back to Dashboard
            </Button>
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <button onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <MapIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <FilterIcon className="w-5 h-5" /> Filters
                  {activeFilterCount > 0 && <Badge variant="primary" size="sm">{activeFilterCount}</Badge>}
                </h2>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear all</button>}
              </div>
              <div className="space-y-4">
                <Select label="Blood Group" options={bloodGroupOptions} value={filters.bloodGroup} onChange={e => handleFilterChange('bloodGroup', e.target.value)} />
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="emergency" checked={filters.emergencyOnly}
                    onChange={e => handleFilterChange('emergencyOnly', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                  <label htmlFor="emergency" className="text-sm text-gray-700">Emergency requests only</label>
                </div>
                {locError && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{locError}</div>}
                <Button fullWidth variant="outline" leftIcon={<LocateIcon className="w-4 h-4" />}
                  onClick={() => requestLocation(true)} isLoading={locating}>
                  {locating ? 'Getting location…' : 'Use My Live Location'}
                </Button>
                {userPos && !locating && <p className="text-xs text-center text-gray-400">📍 {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}</p>}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Map Legend</p>
                {[
                  { color: '#EAB308', label: 'Your location' },
                  { color: '#C2410C', label: 'Blood request' },
                  { color: '#B91C1C', label: 'Emergency request' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: `0 1px 4px ${color}88`, flexShrink: 0 }} />
                    {label}
                  </div>
                ))}
              </div>
            </Card>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{bloodRequests.length}</span> active request{bloodRequests.length !== 1 ? 's' : ''}
              </p>
            </div>

            {viewMode === 'map' && (
              <div className="rounded-xl overflow-hidden shadow-lg mb-6" style={{ height: 520, position: 'relative', zIndex: 0 }}>
                {locating && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 400, background: 'rgba(255,255,255,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backdropFilter: 'blur(2px)' }}>
                    <NavigationIcon className="w-8 h-8 text-yellow-500 animate-spin" />
                    <p style={{ fontWeight: 600, color: '#EAB308', fontSize: 14 }}>Getting your precise location…</p>
                  </div>
                )}
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                {!locating && (
                  <button onClick={() => requestLocation(true)} style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 500, background: '#fff', border: '2px solid #EAB308', borderRadius: 8, padding: '6px 12px', fontWeight: 600, fontSize: 12, color: '#EAB308', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LocateIcon style={{ width: 14, height: 14 }} /> Re-centre
                  </button>
                )}
              </div>
            )}

            <div className="space-y-6">
              {viewMode === 'list' && (
                <>
                  {emergencyRequests.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangleIcon className="w-5 h-5 text-emergency" />
                        Emergency Requests ({emergencyRequests.length})
                      </h3>
                      <div className="grid gap-4">
                        {emergencyRequests.map(req => {
                          const uid = typeof req.userId === 'object' ? (req.userId as any)._id : req.userId;
                          return <BloodRequestCard key={req._id} req={req} isMe={uid === myId} />;
                        })}
                      </div>
                    </section>
                  )}

                  {normalRequests.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Regular Requests ({normalRequests.length})
                      </h3>
                      <div className="grid gap-4">
                        {normalRequests.map(req => {
                          const uid = typeof req.userId === 'object' ? (req.userId as any)._id : req.userId;
                          return <BloodRequestCard key={req._id} req={req} isMe={uid === myId} />;
                        })}
                      </div>
                    </section>
                  )}

                  {bloodRequests.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No active blood requests at the moment.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

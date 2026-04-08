import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulseIcon, UserIcon, CameraIcon, CheckCircleIcon,
  AlertCircleIcon, PhoneIcon, MapPinIcon,
  SaveIcon, Loader2Icon, StarIcon, CheckIcon, XIcon, MenuIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Sidebar } from '../components/layout/Sidebar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fix Leaflet's default icon URLs (broken by bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeStarIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 6px rgba(234,179,8,0.7));">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#EAB308" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#b45309" stroke-width="1" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -18],
  });
}

const provinces = [
  { value: 'koshi', label: 'Koshi Province' },
  { value: 'madhesh', label: 'Madhesh Province' },
  { value: 'bagmati', label: 'Bagmati Province' },
  { value: 'gandaki', label: 'Gandaki Province' },
  { value: 'lumbini', label: 'Lumbini Province' },
  { value: 'karnali', label: 'Karnali Province' },
  { value: 'sudurpashchim', label: 'Sudurpashchim Province' },
];

const districtsByProvince: Record<string, { value: string; label: string }[]> = {
  koshi: [
    { value: 'taplejung', label: 'Taplejung' }, { value: 'panchthar', label: 'Panchthar' },
    { value: 'illam', label: 'Ilam' }, { value: 'jhapa', label: 'Jhapa' },
    { value: 'morang', label: 'Morang' }, { value: 'sunsari', label: 'Sunsari' },
    { value: 'dhankuta', label: 'Dhankuta' }, { value: 'terhathum', label: 'Terhathum' },
    { value: 'sankhuwasabha', label: 'Sankhuwasabha' }, { value: 'bhojpur', label: 'Bhojpur' },
    { value: 'solukhumbu', label: 'Solukhumbu' }, { value: 'okhaldhunga', label: 'Okhaldhunga' },
    { value: 'khotang', label: 'Khotang' }, { value: 'udayapur', label: 'Udayapur' },
  ],
  madhesh: [
    { value: 'saptari', label: 'Saptari' }, { value: 'sarlahi', label: 'Sarlahi' },
    { value: 'dhanusha', label: 'Dhanusha' }, { value: 'mahottari', label: 'Mahottari' },
    { value: 'siraha', label: 'Siraha' }, { value: 'rautahat', label: 'Rautahat' },
    { value: 'bara', label: 'Bara' }, { value: 'parsa', label: 'Parsa' },
  ],
  bagmati: [
    { value: 'kathmandu', label: 'Kathmandu' }, { value: 'lalitpur', label: 'Lalitpur' },
    { value: 'bhaktapur', label: 'Bhaktapur' }, { value: 'kavrepalanchok', label: 'Kavrepalanchok' },
    { value: 'sindhupalchok', label: 'Sindhupalchok' }, { value: 'nuwakot', label: 'Nuwakot' },
    { value: 'dhading', label: 'Dhading' }, { value: 'makwanpur', label: 'Makwanpur' },
    { value: 'chitwan', label: 'Chitwan' }, { value: 'ramechhap', label: 'Ramechhap' },
    { value: 'dolakha', label: 'Dolakha' }, { value: 'sindhuli', label: 'Sindhuli' },
    { value: 'rasuwa', label: 'Rasuwa' },
  ],
  gandaki: [
    { value: 'kaski', label: 'Kaski' }, { value: 'tanahun', label: 'Tanahun' },
    { value: 'syangja', label: 'Syangja' }, { value: 'lamjung', label: 'Lamjung' },
    { value: 'gorkha', label: 'Gorkha' }, { value: 'manang', label: 'Manang' },
    { value: 'mustang', label: 'Mustang' }, { value: 'myagdi', label: 'Myagdi' },
    { value: 'baglung', label: 'Baglung' }, { value: 'parbat', label: 'Parbat' },
    { value: 'nawalpur', label: 'Nawalpur' },
  ],
  lumbini: [
    { value: 'rupandehi', label: 'Rupandehi' }, { value: 'kapilvastu', label: 'Kapilvastu' },
    { value: 'arghakhanchi', label: 'Arghakhanchi' }, { value: 'gulmi', label: 'Gulmi' },
    { value: 'palpa', label: 'Palpa' }, { value: 'dang', label: 'Dang' },
    { value: 'pyuthan', label: 'Pyuthan' }, { value: 'rolpa', label: 'Rolpa' },
    { value: 'banke', label: 'Banke' }, { value: 'bardiya', label: 'Bardiya' },
  ],
  karnali: [
    { value: 'humla', label: 'Humla' }, { value: 'mugu', label: 'Mugu' },
    { value: 'dolpa', label: 'Dolpa' }, { value: 'jumla', label: 'Jumla' },
    { value: 'kalikot', label: 'Kalikot' }, { value: 'jajarkot', label: 'Jajarkot' },
    { value: 'surkhet', label: 'Surkhet' }, { value: 'salyan', label: 'Salyan' },
    { value: 'dailekh', label: 'Dailekh' },
  ],
  sudurpashchim: [
    { value: 'kailali', label: 'Kailali' }, { value: 'kanchanpur', label: 'Kanchanpur' },
    { value: 'doti', label: 'Doti' }, { value: 'dadeldhura', label: 'Dadeldhura' },
    { value: 'bajhang', label: 'Bajhang' }, { value: 'bajura', label: 'Bajura' },
    { value: 'baitadi', label: 'Baitadi' }, { value: 'darchula', label: 'Darchula' },
  ],
};

// ── Temp Location Map Picker ──────────────────────────────────────────────────
interface TempLocation { lat: number; lng: number; label: string; }

function TempLocationPicker({
  current, onPick,
}: { current: TempLocation | null; onPick: (loc: TempLocation) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [pendingLL, setPendingLL] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState(current?.label || '');

  const startLat = current?.lat ?? 27.7172;
  const startLng = current?.lng ?? 85.3240;

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([startLat, startLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    mapInst.current = map;

    if (current?.lat) {
      const m = L.marker([current.lat, current.lng], { icon: makeStarIcon(), draggable: true }).addTo(map);
      m.bindPopup('⭐ Your saved location').openPopup();
      m.on('dragend', () => { const ll = m.getLatLng(); setPendingLL({ lat: ll.lat, lng: ll.lng }); });
      markerRef.current = m;
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const m = L.marker([lat, lng], { icon: makeStarIcon(), draggable: true }).addTo(map);
        m.on('dragend', () => { const ll = m.getLatLng(); setPendingLL({ lat: ll.lat, lng: ll.lng }); });
        markerRef.current = m;
      }
      setPendingLL({ lat, lng });
    });

    return () => { map.remove(); mapInst.current = null; markerRef.current = null; };
  }, []); // eslint-disable-line

  const handleSet = () => {
    if (!pendingLL) return;
    const finalLabel = label.trim() || `${pendingLL.lat.toFixed(4)}, ${pendingLL.lng.toFixed(4)}`;
    onPick({ lat: pendingLL.lat, lng: pendingLL.lng, label: finalLabel });
    setPendingLL(null);
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e5e7eb', marginBottom: 10, position: 'relative', zIndex: 0 }}>
        <div ref={mapRef} style={{ height: 280, width: '100%', position: 'relative', zIndex: 1 }} />
      </div>
      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
        <StarIcon className="w-3 h-3 text-yellow-500" />
        Click on the map to place or drag your temporary location pin.
      </p>
      {pendingLL && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '12px 14px' }}>
          <p className="text-xs font-semibold text-yellow-700 mb-2">
            📍 {pendingLL.lat.toFixed(5)}, {pendingLL.lng.toFixed(5)}
          </p>
          <input
            type="text"
            placeholder="Label this location (e.g. Home, Office…)"
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
              border: '1.5px solid #fcd34d', background: '#fff', marginBottom: 8,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button onClick={handleSet} style={{
            width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
            background: '#EAB308', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <CheckIcon style={{ width: 14, height: 14 }} /> Set as Temporary Location
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main SettingsPage ─────────────────────────────────────────────────────────
export function SettingsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const userRole = currentUser?.role || 'user';
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarBase64, setAvatarBase64] = useState<string>('');
  const [avatarChanged, setAvatarChanged] = useState(false);

  const [formData, setFormData] = useState({ phone: '', province: '', district: '', municipality: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Temporary location state — pendingTempLoc holds a newly picked loc not yet saved
  const [tempLocation, setTempLocation] = useState<TempLocation | null>(null);
  const [pendingTempLoc, setPendingTempLoc] = useState<TempLocation | null>(null);

  const availableDistricts = formData.province ? (districtsByProvince[formData.province] || []) : [];

  // ── Load user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('lf_user');
    if (!stored) { navigate('/login'); return; }
    const user = JSON.parse(stored);
    setCurrentUser(user);
    setAvatarPreview(user.avatar || '');
    setTempLocation(user.tempLocation || null);
    setFormData({ phone: user.phone || '', province: user.province || '', district: user.district || '', municipality: user.municipality || '' });

    const token = localStorage.getItem('lf_token');
    if (token) {
      console.log('Fetching profile from:', `${API}/api/profile`);
      fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          console.log('Profile response status:', r.status);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(data => {
          console.log('Profile data received:', data);
          if (data.id) {
            setCurrentUser(data);
            setAvatarPreview(data.avatar || '');
            setTempLocation(data.tempLocation || null);
            setFormData({ phone: data.phone || '', province: data.province || '', district: data.district || '', municipality: data.municipality || '' });
          }
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          setSaveError('Failed to load profile data. Using cached data.');
        })
        .finally(() => setIsFetching(false));
    } else {
      setIsFetching(false);
    }
  }, [navigate]);

  // ── Photo handlers ─────────────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSaveError('Please select an image file (JPG, PNG, etc.)'); return; }
    if (file.size > 1.5 * 1024 * 1024) { setSaveError('Photo must be under 1.5MB.'); return; }
    setSaveError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl); setAvatarBase64(dataUrl); setAvatarChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(''); setAvatarBase64(''); setAvatarChanged(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'province') setFormData(prev => ({ ...prev, province: value, district: '' }));
    else setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setSaveSuccess(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) e.phone = 'Please enter a valid 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save (profile + temp location together) ────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setIsLoading(true); setSaveError(''); setSaveSuccess(false);

    try {
      const token = localStorage.getItem('lf_token');
      if (!token) { navigate('/login'); return; }

      // If user picked a new temp location, confirm it now
      const locToSave = pendingTempLoc ?? tempLocation;

      const payload: Record<string, any> = {
        phone: formData.phone,
        province: formData.province,
        district: formData.district,
        municipality: formData.municipality,
        tempLocation: locToSave || null,
      };
      if (avatarChanged) payload.avatar = avatarBase64;

      console.log('Saving profile to:', `${API}/api/profile`);
      console.log('Payload:', { ...payload, avatar: payload.avatar ? '[base64 data]' : undefined });

      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      console.log('Save response status:', res.status);
      const data = await res.json();
      console.log('Save response data:', data);

      if (!res.ok) { 
        setSaveError(data.error || 'Failed to save changes.'); 
        return; 
      }

      // Persist to localStorage
      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem('lf_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setTempLocation(data.tempLocation || null);
      setPendingTempLoc(null);
      setAvatarChanged(false);
      setSaveSuccess(true);
      window.dispatchEvent(new Event('lf_user_updated'));
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Save error:', err);
      setSaveError('Could not connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="user" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2Icon className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const displayName = currentUser?.role === 'hospital'
    ? (currentUser?.hospitalName || currentUser?.name)
    : currentUser?.name;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={userRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Open menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <div className="max-w-2xl mx-auto">

        {/* ── Profile Photo ───────────────────────────────────────────────── */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CameraIcon className="w-4 h-4 text-primary" /> Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 border-4 border-white shadow-md flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-primary" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <CameraIcon className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">{displayName}</p>
              <p className="text-xs text-gray-400 mb-3">JPG or PNG · Max 1.5MB</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} leftIcon={<CameraIcon className="w-4 h-4" />}>
                  Upload Photo
                </Button>
                {avatarPreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    Remove
                  </Button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </div>
          </div>
        </Card>

        {/* ── Contact Information ─────────────────────────────────────────── */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PhoneIcon className="w-4 h-4 text-primary" /> Contact Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-500">{currentUser?.email}</span>
                <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Cannot change</span>
              </div>
            </div>
            
            {/* Blood Group - Read Only */}
            {currentUser?.bloodGroup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <HeartPulseIcon className="w-4 h-4 text-red-500" />
                  Blood Group
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-sm font-bold text-red-600">{currentUser.bloodGroup}</span>
                  <span className="ml-auto text-xs text-red-400 bg-red-100 px-2 py-0.5 rounded">Cannot change</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your blood group was verified during registration and cannot be modified for safety reasons.
                </p>
              </div>
            )}
            
            <Input label="Phone Number" name="phone" type="tel" placeholder="98XXXXXXXX"
              value={formData.phone} onChange={handleChange} error={errors.phone}
              leftIcon={<PhoneIcon className="w-4 h-4" />} />
          </div>
        </Card>

        {/* ── Address ────────────────────────────────────────────────────── */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-primary" /> Address
          </h2>
          <div className="space-y-4">
            <Select label="Province" name="province" options={provinces} placeholder="Select province"
              value={formData.province} onChange={handleChange} error={errors.province} />
            <Select label="District" name="district" options={availableDistricts}
              placeholder={formData.province ? '-- Select District --' : 'Select province first'}
              value={formData.district} onChange={handleChange} error={errors.district}
              disabled={!formData.province} />
            <Input label="Municipality / VDC" name="municipality" placeholder="Enter municipality or VDC"
              value={formData.municipality} onChange={handleChange} error={errors.municipality}
              leftIcon={<MapPinIcon className="w-4 h-4" />} />
          </div>
        </Card>

        {/* ── Temporary Location ──────────────────────────────────────────── */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <StarIcon className="w-4 h-4 text-yellow-500" /> Temporary Location
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Pin your current location on the map. This is used to show you on the Search page and calculate distances for other users.
          </p>

          {/* Current location display */}
          {(pendingTempLoc || tempLocation) && (
            <div className="flex items-center justify-between mb-4 px-3 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-yellow-700">
                  {pendingTempLoc ? '📍 New location selected (not saved yet)' : '⭐ Current saved location'}
                </p>
                <p className="text-xs text-yellow-600 mt-0.5">
                  {(pendingTempLoc || tempLocation)!.label} · {(pendingTempLoc || tempLocation)!.lat.toFixed(4)}, {(pendingTempLoc || tempLocation)!.lng.toFixed(4)}
                </p>
              </div>
              {tempLocation && !pendingTempLoc && (
                <button onClick={() => { setTempLocation(null); setPendingTempLoc(null); }}
                  className="text-red-400 hover:text-red-600 transition-colors" title="Remove location">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <TempLocationPicker
            current={tempLocation}
            onPick={(loc) => setPendingTempLoc(loc)}
          />
          {pendingTempLoc && (
            <p className="text-xs text-center text-amber-600 mt-2 font-medium">
              ⚠️ Click <strong>Save Changes</strong> below to save this location to your profile.
            </p>
          )}
        </Card>

        {/* ── Status messages ─────────────────────────────────────────────── */}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-700">
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0" /> Profile updated successfully!
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" /> {saveError}
          </div>
        )}

        <Button type="button" onClick={handleSave} isLoading={isLoading} fullWidth size="lg" leftIcon={<SaveIcon className="w-4 h-4" />}>
          Save Changes
        </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

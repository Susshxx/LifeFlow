import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FilterIcon, MapIcon, ListIcon, AlertTriangleIcon, XIcon,
  SlidersHorizontalIcon, LocateIcon, NavigationIcon, PhoneIcon,
  UserPlusIcon, StarIcon, HeartIcon, ZapIcon, CheckIcon, MailIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { DonorCard } from '../components/features/DonorCard';
import { HospitalCard } from '../components/features/HospitalCard';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


//Icon Factories

function makeDotIcon(color: string, size = 18, pulse = false, label = '') {
  const pulseStyle = pulse
    ? `@keyframes ep{0%,100%{box-shadow:0 0 0 0 ${color}88}70%{box-shadow:0 0 0 10px transparent}}`
    : '';
  const pulseCSS = pulse ? `animation:ep 1.2s infinite;` : '';
  return L.divIcon({
    className: '',
    html: `<style>${pulseStyle}</style>
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
        border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
        font-size:9px;font-weight:800;color:#fff;${pulseCSS}">${label}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2 + 4)],
  });
}

function makeStarIcon(size = 10) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        filter: drop-shadow(0 1px 3px rgba(234, 179, 8, 0.7));
      ">
        <svg 
          width="${size - 2}" 
          height="${size - 2}" 
          viewBox="0 0 24 24" 
          fill="#EAB308" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
            stroke="#b45309" 
            stroke-width="1.5" 
            stroke-linejoin="round"
          />
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

//Blood request pin — dark orange with light red halo
function makeBloodRequestIcon(isEmergency: boolean) {
  const coreColor = isEmergency ? '#B91C1C' : '#C2410C';   // dark red or dark orange
  const haloColor = isEmergency ? '#FCA5A5' : '#FDBA74';   // light red or light orange
  const size = isEmergency ? 22 : 18;

  // emergency pulses; normal does not
  const pulseKeyframes = isEmergency
    ? `@keyframes brp{0%,100%{box-shadow:0 0 0 0 ${haloColor}}60%{box-shadow:0 0 0 14px transparent}}`
    : '';
  const pulseCSS = isEmergency ? `animation:brp 1s infinite;` : '';

  return L.divIcon({
    className: '',
    html: `<style>${pulseKeyframes}</style>
      <div style="
        width:${size + 10}px;height:${size + 10}px;border-radius:50%;
        background:${haloColor};opacity:0.85;
        display:flex;align-items:center;justify-content:center;
        ${pulseCSS}
      ">
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;background:${coreColor};
          border:2.5px solid #fff;
          display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:900;color:#fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
        ">🩸</div>
      </div>`,
    iconSize: [size + 10, size + 10],
    iconAnchor: [(size + 10) / 2, (size + 10) / 2],
    popupAnchor: [0, -((size + 10) / 2 + 4)],
  });
}

const ICONS = {
  savedYou: () => makeStarIcon(26),
  liveYou: () => makeDotIcon('#EAB308', 20, true),
  donor: () => makeDotIcon('#3B82F6', 16),
  hospital: () => makeDotIcon('#22C55E', 18, false, 'H'),
  request: () => makeBloodRequestIcon(false),
  emergency: () => makeBloodRequestIcon(true),
  camp: () => makeDotIcon('#8B5CF6', 20, false, '⛺'),
};

function buildCampPopupHTML(camp: any) {
  const organizer = camp.hospitalId?.hospitalName || camp.hospitalId?.name || 'Hospital';
  const locationLabel = typeof camp.location === 'object' ? camp.location.label : camp.location || '';
  const date = camp.startTime ? new Date(camp.startTime).toLocaleDateString() : 'TBD';
  const time = camp.startTime
    ? new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const registered = camp.registeredDonors?.length || 0;
  const capacity = camp.expectedDonors || 0;
  const bloodGroups = (camp.bloodGroups || ['All']).join(', ');
  return `<div style="min-width:230px;max-width:260px;font-family:sans-serif;">
    <div style="margin-bottom:8px;">
      <span style="background:#8B5CF6;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">⛺ Blood Camp</span>
    </div>
    <h4 style="font-weight:800;font-size:14px;margin:0 0 6px;color:#1f2937;">${camp.title}</h4>
    <div style="font-size:11px;color:#4b5563;line-height:1.7;">
      <div>🏥 ${organizer}</div>
      <div>📅 ${date} ${time ? '· ' + time : ''}</div>
      <div>📍 ${locationLabel}</div>
      <div>👥 ${registered}/${capacity} registered</div>
      <div>🩸 ${bloodGroups}</div>
    </div>
  </div>`;
}


//Types

interface MapUser {
  _id: string; name: string; role: 'user' | 'hospital';
  bloodGroup?: string; avatar?: string; isVerified: boolean;
  hospitalName?: string; municipality?: string; district?: string;
  phone?: string;
  tempLocation: { lat: number; lng: number; label: string };
}

interface BloodRequest {
  _id: string;
  userId: string | { _id: string; avatar?: string };
  name: string; phone: string; email: string; bloodGroup: string;
  isEmergency: boolean;
  location: { lat: number; lng: number; label: string };
  createdAt: string;
}

interface Donor {
  id: string; name: string; bloodGroup: string; location: string;
  distance: string; lastDonation: string; isVerified: boolean; isAvailable: boolean;
}
interface Hospital {
  id: string; name: string; location: string; distance: string;
  phone: string; isOpen: boolean; openHours: string;
  bloodStock: Array<{ group: string; units: number; status: 'available' | 'low' | 'critical' | 'unavailable' }>;
  isVerified: boolean;
}


//Filter options

const bloodGroupOptions = [
  { value: '', label: 'All Blood Groups' },
  ...'A+,A-,B+,B-,AB+,AB-,O+,O-'.split(',').map(v => ({ value: v, label: v })),
];
const provinceOptions = [
  { value: '', label: 'All Provinces' },
  { value: 'bagmati', label: 'Bagmati Province' }, { value: 'gandaki', label: 'Gandaki Province' },
  { value: 'koshi', label: 'Koshi Province' }, { value: 'madhesh', label: 'Madhesh Province' },
  { value: 'lumbini', label: 'Lumbini Province' }, { value: 'karnali', label: 'Karnali Province' },
  { value: 'sudurpashchim', label: 'Sudurpashchim Province' },
];
const districtOptions = [
  { value: '', label: 'All Districts' },
  { value: 'kathmandu', label: 'Kathmandu' }, { value: 'lalitpur', label: 'Lalitpur' },
  { value: 'bhaktapur', label: 'Bhaktapur' },
];
const distanceOptions = [
  { value: '', label: 'Any Distance' },
  { value: '5', label: 'Within 5 km' }, { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' }, { value: '50', label: 'Within 50 km' },
];

const sampleDonors: Donor[] = [
  { id: '1', name: 'Ram Sharma', bloodGroup: 'A+', location: 'Kathmandu', distance: '1.2 km', lastDonation: '3 months ago', isVerified: true, isAvailable: true },
  { id: '2', name: 'Sita Thapa', bloodGroup: 'O+', location: 'Lalitpur', distance: '2.5 km', lastDonation: '4 months ago', isVerified: true, isAvailable: true },
  { id: '3', name: 'Hari Prasad', bloodGroup: 'B+', location: 'Bhaktapur', distance: '3.1 km', lastDonation: '2 months ago', isVerified: true, isAvailable: false },
  { id: '4', name: 'Maya Gurung', bloodGroup: 'AB-', location: 'Kathmandu', distance: '4.2 km', lastDonation: '5 months ago', isVerified: true, isAvailable: true },
  { id: '5', name: 'Bikash Tamang', bloodGroup: 'O-', location: 'Kirtipur', distance: '5.8 km', lastDonation: '6 months ago', isVerified: false, isAvailable: true },
];
const sampleHospitals: Hospital[] = [
  {
    id: '1', name: 'Kathmandu Teaching Hospital', location: 'Maharajgunj, Kathmandu',
    distance: '0.8 km', phone: '01-4412303', isOpen: true, openHours: '24/7', isVerified: true,
    bloodStock: [
      { group: 'A+', units: 15, status: 'available' }, { group: 'A-', units: 3, status: 'low' },
      { group: 'B+', units: 20, status: 'available' }, { group: 'B-', units: 0, status: 'unavailable' },
      { group: 'AB+', units: 8, status: 'available' }, { group: 'AB-', units: 1, status: 'critical' },
      { group: 'O+', units: 25, status: 'available' }, { group: 'O-', units: 2, status: 'low' },
    ],
  },
  {
    id: '2', name: 'Bir Hospital', location: 'Mahaboudha, Kathmandu',
    distance: '1.5 km', phone: '01-4221119', isOpen: true, openHours: '24/7', isVerified: true,
    bloodStock: [
      { group: 'A+', units: 10, status: 'available' }, { group: 'A-', units: 5, status: 'available' },
      { group: 'B+', units: 12, status: 'available' }, { group: 'B-', units: 2, status: 'low' },
      { group: 'AB+', units: 6, status: 'available' }, { group: 'AB-', units: 0, status: 'unavailable' },
      { group: 'O+', units: 18, status: 'available' }, { group: 'O-', units: 4, status: 'available' },
    ],
  },
];

function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const connStatusCache = new Map<string, string>();
async function sendConnectRequest(toUserId: string): Promise<'sent' | 'already' | 'error'> {
  const token = localStorage.getItem('lf_token');
  if (!token) return 'error';
  try {
    const res = await fetch(`${API}/api/connections/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUserId }),
    });
    if (res.status === 409) return 'already';
    if (!res.ok) return 'error';
    connStatusCache.set(toUserId, 'pending');
    return 'sent';
  } catch { return 'error'; }
}

function buildUserPopupHTML(u: MapUser, isMe: boolean, connStatus: string) {
  const avatarHTML = u.avatar
    ? `<img src="${u.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb;flex-shrink:0;"/>`
    : `<div style="width:40px;height:40px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#6b7280;flex-shrink:0;">${u.name[0]?.toUpperCase()}</div>`;
  const roleTag = u.role === 'hospital'
    ? `<span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">Hospital</span>`
    : `<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">Blood Donor</span>`;
  const bgTag = u.bloodGroup
    ? `<span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;">🩸 ${u.bloodGroup}</span>`
    : '';
  const locTag = u.tempLocation?.label
    ? `<p style="font-size:11px;color:#6b7280;margin:4px 0 0;">📍 ${u.tempLocation.label}</p>` : '';
  let actionBtn = '';
  if (isMe) {
    actionBtn = `<p style="text-align:center;font-size:11px;color:#6b7280;margin-top:8px;font-style:italic;">This is you</p>`;
  } else if (connStatus === 'accepted') {
    actionBtn = `<button onclick="window.dispatchEvent(new CustomEvent('lf:openmsg',{detail:'${u._id}'}))"
      style="margin-top:10px;width:100%;padding:7px 0;background:#22c55e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">💬 Message</button>`;
  } else if (connStatus === 'pending') {
    actionBtn = `<button disabled style="margin-top:10px;width:100%;padding:7px 0;background:#f3f4f6;color:#9ca3af;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:not-allowed;">⏳ Request Sent</button>`;
  } else {
    actionBtn = `<button onclick="window.dispatchEvent(new CustomEvent('lf:connect',{detail:'${u._id}'}))"
      style="margin-top:10px;width:100%;padding:7px 0;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">🩸 Connect</button>`;
  }
  return `<div style="min-width:200px;max-width:230px;font-family:sans-serif;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      ${avatarHTML}
      <div style="min-width:0;">
        <p style="font-weight:700;font-size:14px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.name}</p>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px;">${roleTag}${bgTag}</div>
      </div>
    </div>
    ${locTag}${actionBtn}
  </div>`;
}

function buildBloodRequestPopupHTML(req: BloodRequest, isMe: boolean) {
  const bg = req.isEmergency ? '#FEF2F2' : '#FFF7ED';
  const border = req.isEmergency ? '#FCA5A5' : '#FDBA74';
  const tagBg = req.isEmergency ? '#FEE2E2' : '#FFEDD5';
  const tagColor = req.isEmergency ? '#B91C1C' : '#C2410C';
  const emoji = req.isEmergency ? '🚨' : '🩸';
  const label = req.isEmergency ? 'Emergency Request' : 'Blood Request';
  const msgDetail = JSON.stringify({ userId: typeof req.userId === 'object' ? req.userId._id : req.userId, name: req.name });

  return `<div style="min-width:210px;max-width:250px;font-family:sans-serif;background:${bg};border-radius:12px;padding:12px;border:1.5px solid ${border};">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <span style="font-size:20px;">${emoji}</span>
      <div>
        <p style="font-weight:800;font-size:13px;margin:0;color:${tagColor};">${label}</p>
        <span style="background:${tagBg};color:${tagColor};padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700;">🩸 ${req.bloodGroup}</span>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${req.name}</p>
      <p style="font-size:12px;color:#374151;margin:2px 0;">📞 ${req.phone}</p>
      <p style="font-size:12px;color:#374151;margin:2px 0;">✉️ ${req.email}</p>
      ${req.location?.label ? `<p style="font-size:11px;color:#6b7280;margin:4px 0 0;">📍 ${req.location.label}</p>` : ''}
    </div>
    ${!isMe ? `
    <div style="display:flex;gap:6px;margin-top:10px;">
      <a href="tel:${req.phone}" style="flex:1;padding:7px 0;background:${tagColor};color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px;">📞 Call</a>
      <button onclick="window.dispatchEvent(new CustomEvent('lf:openmsg',{detail:'${typeof req.userId === 'object' ? req.userId._id : req.userId}'}))"
        style="flex:1;padding:7px 0;background:#fff;color:${tagColor};border:1.5px solid ${border};border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">💬 Message</button>
    </div>` : `<p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:8px;font-style:italic;">Your active request</p>`}
  </div>`;
}


//Blood Request Dialog — mini Leaflet map for custom location

interface RequestDialogProps {
  isOpen: boolean;
  isEmergency: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string; phone: string; email: string; bloodGroup: string;
    location: { lat: number; lng: number; label: string };
    isEmergency: boolean;
  }) => Promise<void>;
  currentUser: any;
  savedLoc: { lat: number; lng: number; label: string } | undefined;
  livePos: { lat: number; lng: number } | null;
}

function BloodRequestDialog({ isOpen, isEmergency, onClose, onSubmit, currentUser, savedLoc, livePos }: RequestDialogProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    bloodGroup: '',
  });
  const [locMode, setLocMode] = useState<'saved' | 'live' | 'custom'>('saved');
  const [customLoc, setCustomLoc] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInst = useRef<L.Map | null>(null);
  const miniMarker = useRef<L.Marker | null>(null);

  // Pre-fill from user
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      email: currentUser?.email || '',
      bloodGroup: currentUser?.bloodGroup || '',
    });
    setErrors({});
    setCustomLoc(null);
    setLocMode(savedLoc?.lat ? 'saved' : livePos ? 'live' : 'custom');
  }, [isOpen]);

  // Init mini map when custom tab is selected
  useEffect(() => {
    if (locMode !== 'custom') {
      if (miniMapInst.current) { miniMapInst.current.remove(); miniMapInst.current = null; miniMarker.current = null; }
      return;
    }
    if (!miniMapRef.current || miniMapInst.current) return;

    const startLat = savedLoc?.lat ?? livePos?.lat ?? 27.7172;
    const startLng = savedLoc?.lng ?? livePos?.lng ?? 85.3240;

    const map = L.map(miniMapRef.current, { zoomControl: true }).setView([startLat, startLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    miniMapInst.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (miniMarker.current) {
        miniMarker.current.setLatLng([lat, lng]);
      } else {
        const m = L.marker([lat, lng], { draggable: true }).addTo(map);
        m.on('dragend', () => {
          const ll = m.getLatLng();
          setCustomLoc(prev => prev ? { ...prev, lat: ll.lat, lng: ll.lng } : { lat: ll.lat, lng: ll.lng, label: '' });
        });
        miniMarker.current = m;
      }
      setCustomLoc({ lat, lng, label: '' });
    });

    return () => { map.remove(); miniMapInst.current = null; miniMarker.current = null; };
  }, [locMode]);

  const getSelectedLocation = (): { lat: number; lng: number; label: string } | null => {
    if (locMode === 'saved' && savedLoc?.lat) return savedLoc;
    if (locMode === 'live' && livePos) return { lat: livePos.lat, lng: livePos.lng, label: 'Live GPS location' };
    if (locMode === 'custom' && customLoc) return { ...customLoc, label: customLabel || `${customLoc.lat.toFixed(4)}, ${customLoc.lng.toFixed(4)}` };
    return null;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.bloodGroup) e.bloodGroup = 'Blood group is required';
    if (!getSelectedLocation()) e.location = 'Please select a location';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ ...form, location: getSelectedLocation()!, isEmergency });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const accent = isEmergency ? '#B91C1C' : '#C2410C';
  const accentBg = isEmergency ? '#FEF2F2' : '#FFF7ED';
  const accentBdr = isEmergency ? '#FCA5A5' : '#FDBA74';
  const title = isEmergency ? '🚨 Emergency Blood Request' : '🩸 Request Blood';

  const tabStyle = (active: boolean, disabled = false) => ({
    flex: 1, padding: '7px 4px', borderRadius: 8, border: active ? `2px solid ${accent}` : '1.5px solid #e5e7eb',
    background: active ? accentBg : '#fff', color: active ? accent : '#6b7280',
    fontWeight: 700, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', animation: 'rfIn 0.2s ease' }}>
        <style>{`@keyframes rfIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${accentBdr}` }}>
              <span style={{ fontSize: 22 }}>{isEmergency ? '🚨' : '🩸'}</span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, margin: 0, color: accent }}>{title}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                {isEmergency ? 'Alert all nearby donors immediately' : 'Find compatible blood donors near you'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#374151' }}>×</button>
        </div>

        {isEmergency && (
          <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>
            ⚠️ Emergency requests send push notifications to all nearby donors and appear as a blinking red pin on the map.
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Your Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${errors.name ? '#ef4444' : '#e5e7eb'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            {errors.name && <p style={{ color: '#ef4444', fontSize: 11, margin: '3px 0 0' }}>{errors.name}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Phone *</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="98XXXXXXXX" type="tel"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${errors.phone ? '#ef4444' : '#e5e7eb'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              {errors.phone && <p style={{ color: '#ef4444', fontSize: 11, margin: '3px 0 0' }}>{errors.phone}</p>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Blood Group *</label>
              <select value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${errors.bloodGroup ? '#ef4444' : '#e5e7eb'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                <option value="">Select...</option>
                {'A+,A-,B+,B-,AB+,AB-,O+,O-'.split(',').map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.bloodGroup && <p style={{ color: '#ef4444', fontSize: 11, margin: '3px 0 0' }}>{errors.bloodGroup}</p>}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label>
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="you@email.com" type="email"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${errors.email ? '#ef4444' : '#e5e7eb'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            {errors.email && <p style={{ color: '#ef4444', fontSize: 11, margin: '3px 0 0' }}>{errors.email}</p>}
          </div>

          {/* Location picker */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Location *</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button onClick={() => setLocMode('saved')} disabled={!savedLoc?.lat} style={tabStyle(locMode === 'saved', !savedLoc?.lat)}>
                ⭐ Saved
              </button>
              <button onClick={() => setLocMode('live')} disabled={!livePos} style={tabStyle(locMode === 'live', !livePos)}>
                📍 Live GPS
              </button>
              <button onClick={() => setLocMode('custom')} style={tabStyle(locMode === 'custom')}>
                🗺️ Custom
              </button>
            </div>

            {locMode === 'saved' && savedLoc?.lat && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                ⭐ {savedLoc.label} · {savedLoc.lat.toFixed(4)}, {savedLoc.lng.toFixed(4)}
              </div>
            )}
            {locMode === 'live' && livePos && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                📍 {livePos.lat.toFixed(5)}, {livePos.lng.toFixed(5)}
              </div>
            )}
            {locMode === 'custom' && (
              <div>
                <div ref={miniMapRef} style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e5e7eb', marginBottom: 8 }} />
                {customLoc && (
                  <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                    placeholder="Label this location (e.g. Patan Hospital)"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #fcd34d', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                )}
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Click on the map to set your location</p>
              </div>
            )}
            {errors.location && <p style={{ color: '#ef4444', fontSize: 11, margin: '6px 0 0' }}>{errors.location}</p>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
            background: submitting ? '#9ca3af' : accent,
            color: '#fff', fontWeight: 800, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: `0 4px 16px ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {submitting ? '⏳ Submitting…' : isEmergency ? '🚨 Send Emergency Alert' : '🩸 Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}


//Blood Request Card (for list view)

function BloodRequestCard({ req, isMe, onMessage }: { req: BloodRequest; isMe: boolean; onMessage: (userId: string) => void }) {
  const isEmergency = req.isEmergency;
  const border = isEmergency ? '#FCA5A5' : '#FDBA74';
  const bg = isEmergency ? '#FEF2F2' : '#FFF7ED';
  const accent = isEmergency ? '#B91C1C' : '#C2410C';

  return (
    <div style={{
      background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: isEmergency ? `0 0 0 3px #FCA5A544` : 'none',
      animation: isEmergency ? 'blink 1.5s ease infinite' : 'none',
    }}>
      <style>{`@keyframes blink{0%,100%{box-shadow:0 0 0 3px #FCA5A544}50%{box-shadow:0 0 0 8px #FCA5A511}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>{isEmergency ? '🚨' : '🩸'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: accent }}>{req.name}</p>
            <span style={{ background: accent, color: '#fff', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{req.bloodGroup}</span>
            {isEmergency && <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>EMERGENCY</span>}
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>
            {req.location?.label || `${req.location?.lat?.toFixed(4)}, ${req.location?.lng?.toFixed(4)}`}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#374151' }}>
        <span>📞 {req.phone}</span>
        <span>✉️ {req.email}</span>
      </div>
      {!isMe && (
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`tel:${req.phone}`} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: accent, color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            📞 Call
          </a>
          <button onClick={() => onMessage(typeof req.userId === 'object' ? (req.userId as any)._id : req.userId as string)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#fff', border: `1.5px solid ${border}`, color: accent, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            💬 Message
          </button>
        </div>
      )}
      {isMe && <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: 0 }}>This is your active request</p>}
    </div>
  );
}


//SearchPage

export function SearchPage() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  
  // Redirect hospitals to their dashboard - they shouldn't access search page
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('lf_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'hospital') {
          navigate('/hospital/dashboard', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }, [navigate]);

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(false);
  const [resultType, setResultType] = useState<'all' | 'donors' | 'hospitals' | 'requests'>('all');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  // ── FIXED: livePos & posMode are completely independent ──────────────────
  const [livePos, setLivePos] = useState<{ lat: number; lng: number } | null>(null);
  const [posMode, setPosMode] = useState<'saved' | 'live'>('saved');
  const [mapUsers, setMapUsers] = useState<MapUser[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [bloodCamps, setBloodCamps] = useState<any[]>([]);
  const [connStatuses, setConnStatuses] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [myActiveRequest, setMyActiveRequest] = useState<BloodRequest | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<MapUser | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<MapUser | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<any | null>(null);
  const [showCampRegistration, setShowCampRegistration] = useState(false);
  const [campRegForm, setCampRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    weight: '',
    lastDonationMonth: '',
    lastDonationYear: '',
  });

  const [filters, setFilters] = useState({
    bloodGroup: '', 
    distance: '', 
    availableOnly: true,
    contentType: '', // 'users', 'hospitals', 'blood-requests', 'emergency-requests', 'blood-camps'
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const savedMarkerRef = useRef<L.Marker | null>(null);
  const liveMarkerRef = useRef<L.Marker | null>(null);
  const liveCircleRef = useRef<L.Circle | null>(null);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const requestMarkersRef = useRef<L.Marker[]>([]);
  const campMarkersRef = useRef<L.Marker[]>([]);
  // Track which mode the map is currently centred on — avoids re-centre fights
  const mapCentredMode = useRef<'saved' | 'live' | null>(null);

  const me = (() => { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } })();
  const myId = me?.id || me?._id || null;
  const savedLoc = me?.tempLocation as { lat: number; lng: number; label: string } | undefined;

  const refPos = posMode === 'live' && livePos
    ? livePos
    : savedLoc ? { lat: savedLoc.lat, lng: savedLoc.lng } : null;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDistanceText = (targetLat: number, targetLng: number): string => {
    const userLoc = refPos;
    if (!userLoc) return '';
    const distance = calculateDistance(userLoc.lat, userLoc.lng, targetLat, targetLng);
    return `${distance.toFixed(1)} km`;
  };

  const handleCampRegister = (camp: any) => {
    if (!me) {
      showToast('Please login to register for blood camps', 'error');
      return;
    }
    if (me.role === 'hospital') {
      showToast('Hospitals cannot register for blood camps', 'error');
      return;
    }
    // Auto-fill form with user data
    setCampRegForm({
      fullName: me.name || '',
      email: me.email || '',
      phone: me.phone || '',
      age: '',
      weight: '',
      lastDonationMonth: '',
      lastDonationYear: '',
    });
    setSelectedCamp(camp);
    setShowCampRegistration(true);
  };

  // ── Fetch map users ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;
    fetch(`${API}/api/auth/users/map`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setMapUsers)
      .catch(() => { });
  }, []);

  // ── Fetch approved blood camps ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;
    const fetchCamps = () => {
      fetch(`${API}/api/blood-camps`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => {
          // Filter out completed camps for users - only show approved and active camps
          const now = new Date();
          const activeCamps = data.filter((c: any) => {
            if (c.status !== 'approved') return false;
            
            // Calculate end time
            const startTime = new Date(c.startTime);
            const endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + (c.duration || 0));
            
            // Only show camps that haven't ended yet
            return now <= endTime;
          });
          setBloodCamps(activeCamps);
        })
        .catch(() => {});
    };
    fetchCamps();
    const interval = setInterval(fetchCamps, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch blood requests ────────────────────────────────────────────────
  const fetchBloodRequests = useCallback(async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/blood-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data: BloodRequest[] = await res.json();
      setBloodRequests(data);
      // Broadcast emergency requests so DonorDashboard can read them
      const emergencies = data.filter(r => r.isEmergency);
      localStorage.setItem('lf_emergency_requests', JSON.stringify(emergencies));
      window.dispatchEvent(new Event('lf_emergency_updated'));
      const mine = data.find(r => {
        const uid = typeof r.userId === 'object' ? (r.userId as any)._id : r.userId;
        return uid === myId;
      });
      setMyActiveRequest(mine || null);
    } catch { }
  }, [myId]);

  useEffect(() => {
    fetchBloodRequests();
    const interval = setInterval(fetchBloodRequests, 30_000);
    return () => clearInterval(interval);
  }, [fetchBloodRequests]);

  // ── Fetch connection statuses ──────────────────────────────────────────
  useEffect(() => {
    if (!mapUsers.length) return;
    const token = localStorage.getItem('lf_token');
    if (!token) return;
    Promise.all(
      mapUsers.filter(u => u._id !== myId).map(u =>
        fetch(`${API}/api/connections/status/${u._id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : { status: 'none' })
          .then(data => ({ userId: u._id, status: data.status }))
          .catch(() => ({ userId: u._id, status: 'none' }))
      )
    ).then(results => {
      const map: Record<string, string> = {};
      results.forEach(({ userId, status }) => { map[userId] = status; });
      setConnStatuses(map);
    });
  }, [mapUsers, myId]);

  // ── Event listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const handleConnect = async (e: Event) => {
      const userId = (e as CustomEvent<string>).detail;
      const result = await sendConnectRequest(userId);
      if (result === 'sent') {
        setConnStatuses(prev => ({ ...prev, [userId]: 'pending' }));
        showToast('Connection request sent!', 'success');
        mapInstanceRef.current?.closePopup();
      } else if (result === 'already') {
        showToast('Already connected or request pending.', 'info');
      } else {
        showToast('Failed to send request.', 'error');
      }
    };
    const handleOpenMsg = (e: Event) => {
      window.dispatchEvent(new CustomEvent('lf:openchat', { detail: (e as CustomEvent<string>).detail }));
    };
    window.addEventListener('lf:connect', handleConnect);
    window.addEventListener('lf:openmsg', handleOpenMsg);
    return () => {
      window.removeEventListener('lf:connect', handleConnect);
      window.removeEventListener('lf:openmsg', handleOpenMsg);
    };
  }, []);

  // ── Sync saved-location changes (lf_user_updated) ─────────────────────
  useEffect(() => {
    const handler = () => {
      // Force re-read from localStorage — React will re-render naturally via state
      // The savedLoc variable is re-derived from localStorage on every render
    };
    window.addEventListener('lf_user_updated', handler);
    return () => window.removeEventListener('lf_user_updated', handler);
  }, []);

  // ── Saved marker ──────────────────────────────────────────────────────
  const placeSavedMarker = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !savedLoc?.lat) return;
    if (savedMarkerRef.current) {
      savedMarkerRef.current.setLatLng([savedLoc.lat, savedLoc.lng]);
    } else {
      const m = L.marker([savedLoc.lat, savedLoc.lng], { icon: ICONS.savedYou(), zIndexOffset: 9998 }).addTo(map);
      m.bindPopup(`<div style="padding:6px 10px;font-weight:700;font-size:13px;color:#ca8a04;">⭐ ${savedLoc.label || 'Your saved location'}</div>`);
      m.on('mouseover', () => m.openPopup());
      m.on('mouseout', () => m.closePopup());
      savedMarkerRef.current = m;
    }
  }, [savedLoc]);

  // ── Live marker ───────────────────────────────────────────────────────
  const placeLiveMarker = useCallback((lat: number, lng: number, accuracy?: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const m = L.marker([lat, lng], { icon: ICONS.liveYou(), zIndexOffset: 9999 }).addTo(map);
      m.bindPopup(`<div style="padding:6px 10px;font-weight:700;font-size:13px;color:#EAB308;">📍 Your live GPS location</div>`);
      m.on('mouseover', () => m.openPopup());
      m.on('mouseout', () => m.closePopup());
      liveMarkerRef.current = m;
    }
    if (accuracy && accuracy < 5000) {
      if (liveCircleRef.current) {
        liveCircleRef.current.setLatLng([lat, lng]).setRadius(accuracy);
      } else {
        liveCircleRef.current = L.circle([lat, lng], {
          radius: accuracy, color: '#EAB308', fillColor: '#EAB308',
          fillOpacity: 0.08, weight: 1.5, dashArray: '4 4',
        }).addTo(map);
      }
    }
  }, []);

  // ── Request GPS location ──────────────────────────────────────────────
  const requestLocation = useCallback((panMap = true) => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    setLocating(true); setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setLivePos({ lat, lng });
        setLocating(false);
        placeLiveMarker(lat, lng, accuracy);
        if (panMap && mapInstanceRef.current) {
          const zoom = accuracy < 50 ? 17 : accuracy < 200 ? 16 : accuracy < 1000 ? 15 : 14;
          mapInstanceRef.current.setView([lat, lng], zoom, { animate: true });
          mapCentredMode.current = 'live';
        }
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
  }, [placeLiveMarker]);

  // ── Init map ONCE ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const startLat = savedLoc?.lat ?? 27.7172;
    const startLng = savedLoc?.lng ?? 85.3240;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([startLat, startLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    mapCentredMode.current = savedLoc?.lat ? 'saved' : null;

    if (savedLoc?.lat) placeSavedMarker();
    // Passive GPS load — do NOT pan the map on init
    requestLocation(false);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      savedMarkerRef.current = null;
      liveMarkerRef.current = null;
      liveCircleRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pan to location from URL params (e.g. from dashboard "Respond Now") ──
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const lat = parseFloat(params.get('lat') || '');
    const lng = parseFloat(params.get('lng') || '');
    if (!isNaN(lat) && !isNaN(lng)) {
      // Wait for map to be ready
      const tryPan = () => {
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([lat, lng], 16, { animate: true });
          // Add a temporary highlight marker
          const pulse = L.divIcon({
            className: '',
            html: `<div style="width:24px;height:24px;border-radius:50%;background:#B91C1C;border:3px solid #fff;box-shadow:0 0 0 6px #FCA5A566;animation:ep 1s infinite"></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12],
          });
          const m = L.marker([lat, lng], { icon: pulse, zIndexOffset: 9999 }).addTo(map);
          setTimeout(() => map.removeLayer(m), 8000);
        } else {
          setTimeout(tryPan, 300);
        }
      };
      setTimeout(tryPan, 400);
    }
  }, [routerLocation.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-render user pins ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    userMarkersRef.current.forEach(m => map.removeLayer(m));
    userMarkersRef.current = [];

    const distFilter = filters.distance ? parseFloat(filters.distance) : null;

    mapUsers.forEach(u => {
      if (!u.tempLocation?.lat) return;
      if (u._id === myId) return;
      
      // Apply contentType filter
      if (filters.contentType === 'users' && u.role !== 'user') return;
      if (filters.contentType === 'hospitals' && u.role !== 'hospital') return;
      if (filters.contentType === 'blood-requests' || filters.contentType === 'emergency-requests' || filters.contentType === 'blood-camps') return;
      
      // Legacy resultType filter (for backward compatibility)
      if (resultType === 'donors' && u.role !== 'user') return;
      if (resultType === 'hospitals' && u.role !== 'hospital') return;
      if (resultType === 'requests') return;
      
      if (distFilter && refPos) {
        if (distKm(refPos.lat, refPos.lng, u.tempLocation.lat, u.tempLocation.lng) > distFilter) return;
      }
      if (filters.bloodGroup && u.role === 'user' && u.bloodGroup !== filters.bloodGroup) return;

      const icon = u.role === 'hospital' ? ICONS.hospital() : ICONS.donor();
      const status = connStatuses[u._id] || 'none';
      const marker = L.marker([u.tempLocation.lat, u.tempLocation.lng], { icon }).addTo(map);
      marker.bindPopup(buildUserPopupHTML(u, false, status), { maxWidth: 260 });
      // Show blood group on hover for donors, click to interact
      if (u.role === 'user' && u.bloodGroup) {
        marker.on('mouseover', () => marker.openPopup());
      }
      userMarkersRef.current.push(marker);
    });
  }, [mapUsers, resultType, filters, refPos, myId, connStatuses]); // eslint-disable-line

  // ── Re-render blood request pins ──────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    requestMarkersRef.current.forEach(m => map.removeLayer(m));
    requestMarkersRef.current = [];

    // Hide requests if showing only users or hospitals
    if (filters.contentType === 'users' || filters.contentType === 'hospitals') return;
    if (resultType === 'donors' || resultType === 'hospitals') return;

    bloodRequests.forEach(req => {
      if (!req.location?.lat) return;
      
      // Apply contentType filter for requests
      if (filters.contentType === 'blood-requests' && req.isEmergency) return;
      if (filters.contentType === 'emergency-requests' && !req.isEmergency) return;
      if (filters.contentType === 'blood-camps') return;
      
      const uid = typeof req.userId === 'object' ? (req.userId as any)._id : req.userId;
      const isMe = uid === myId;
      const icon = req.isEmergency ? ICONS.emergency() : ICONS.request();
      const marker = L.marker([req.location.lat, req.location.lng], { icon, zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(buildBloodRequestPopupHTML(req, isMe), { maxWidth: 270 });
      requestMarkersRef.current.push(marker);
    });
  }, [bloodRequests, resultType, myId, filters.contentType]);

  // ── Re-render blood camp pins ─────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    campMarkersRef.current.forEach(m => map.removeLayer(m));
    campMarkersRef.current = [];

    // Only show camps when not explicitly hiding them
    if (filters.contentType && filters.contentType !== 'blood-camps') return;
    if (resultType === 'donors' || resultType === 'hospitals' || resultType === 'requests') return;

    bloodCamps.forEach(camp => {
      const loc = typeof camp.location === 'object' ? camp.location : null;
      if (!loc?.lat || !loc?.lng) return;

      try {
        const marker = L.marker([loc.lat, loc.lng], { icon: ICONS.camp(), zIndexOffset: 800 }).addTo(map);
        marker.bindPopup(buildCampPopupHTML(camp), { maxWidth: 280 });
        // Open on hover
        marker.on('mouseover', () => marker.openPopup());
        marker.on('mouseout', () => marker.closePopup());
        campMarkersRef.current.push(marker);
      } catch (e) {
        console.error('Error adding camp marker:', e);
      }
    });
  }, [bloodCamps, resultType, filters.contentType]);

  // ── Pan map ONLY when user explicitly changes posMode ─────────────────
  // This is separated from the GPS callback so the two don't fight each other.
  const handleSetPosMode = useCallback((mode: 'saved' | 'live') => {
    setPosMode(mode);
    const map = mapInstanceRef.current;
    if (!map) return;
    if (mode === 'live') {
      if (livePos) {
        map.setView([livePos.lat, livePos.lng], 15, { animate: true });
        mapCentredMode.current = 'live';
      } else {
        requestLocation(true);
      }
    } else {
      if (savedLoc?.lat) {
        map.setView([savedLoc.lat, savedLoc.lng], 14, { animate: true });
        mapCentredMode.current = 'saved';
      }
    }
  }, [livePos, savedLoc, requestLocation]);

  // ── Submit blood request ───────────────────────────────────────────────
  const handleSubmitRequest = async (data: any) => {
    const token = localStorage.getItem('lf_token');
    if (!token) { showToast('Please log in first.', 'error'); return; }
    try {
      const res = await fetch(`${API}/api/blood-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) { showToast('Failed to submit request.', 'error'); return; }
      setShowRequestDialog(false);
      setShowEmergencyDialog(false);
      showToast(data.isEmergency ? '🚨 Emergency alert sent to nearby donors!' : '🩸 Blood request posted!', 'success');
      await fetchBloodRequests();
      // If emergency: request browser notification permission
      if (data.isEmergency && 'Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification('🚨 Emergency Blood Request Sent', {
              body: `Your emergency request for ${data.bloodGroup} blood has been broadcast to nearby donors.`,
              icon: '/favicon.ico',
            });
          }
        });
      }
    } catch { showToast('Network error. Please try again.', 'error'); }
  };

  // ── Notify others of emergency (poll-based simulation) ───────────────
  // In a real app this would be a WebSocket / push notification server.
  // We trigger a browser Notification for other logged-in tabs.
  useEffect(() => {
    const emergencies = bloodRequests.filter(r => r.isEmergency);
    if (!emergencies.length) return;
    // Only notify if not your own request
    emergencies.forEach(req => {
      const uid = typeof req.userId === 'object' ? (req.userId as any)._id : req.userId;
      if (uid === myId) return;
      if ('Notification' in window && Notification.permission === 'granted') {
        // Only fire once per session per request using sessionStorage
        const key = `notified_${req._id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          new Notification(`🚨 Emergency Blood Request Nearby!`, {
            body: `${req.name} urgently needs ${req.bloodGroup} blood near ${req.location?.label || 'your area'}.`,
            icon: '/favicon.ico',
          });
        }
      }
    });
  }, [bloodRequests, myId]);

  // ── Cancel own request ────────────────────────────────────────────────
  const handleCancelRequest = async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;
    try {
      await fetch(`${API}/api/blood-requests/mine`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setMyActiveRequest(null);
      await fetchBloodRequests();
      showToast('Your request has been cancelled.', 'info');
    } catch { }
  };

  const handleFilterChange = (key: string, value: string | boolean) =>
    setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () =>
    setFilters({ bloodGroup: '', distance: '', availableOnly: true, contentType: '' });
  const activeFilterCount = Object.values(filters).filter(v => v && v !== true).length;

  const activeRequests = bloodRequests.filter(r => !r.isEmergency);
  const emergencyRequests = bloodRequests.filter(r => r.isEmergency);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Dialogs */}
      <BloodRequestDialog
        isOpen={showRequestDialog} isEmergency={false}
        onClose={() => setShowRequestDialog(false)}
        onSubmit={handleSubmitRequest}
        currentUser={me} savedLoc={savedLoc} livePos={livePos}
      />
      <BloodRequestDialog
        isOpen={showEmergencyDialog} isEmergency={true}
        onClose={() => setShowEmergencyDialog(false)}
        onSubmit={handleSubmitRequest}
        currentUser={me} savedLoc={savedLoc} livePos={livePos}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.msg}
        </div>
      )}

      {/* Emergency banner if active emergencies from others */}
      {emergencyRequests.some(r => {
        const uid = typeof r.userId === 'object' ? (r.userId as any)._id : r.userId;
        return uid !== myId;
      }) && (
          <div style={{ background: '#B91C1C', color: '#fff', padding: '10px 20px', textAlign: 'center', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ animation: 'pulse 1s ease infinite' }}>🚨</span>
            {emergencyRequests.length} emergency blood request(s) active nearby — check the map!
          </div>
        )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Find Blood Donors &amp; Hospitals</h1>
            <p className="text-gray-600 mt-1">Search for available blood donors and hospitals near you</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Blood Request Button */}
            {myActiveRequest ? (
              <button onClick={handleCancelRequest} style={{
                padding: '8px 16px', borderRadius: 10, border: '1.5px solid #FDBA74',
                background: '#FFF7ED', color: '#C2410C', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🩸 Cancel My Request
              </button>
            ) : (
              <button onClick={() => setShowRequestDialog(true)} style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: '#C2410C', color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 10px rgba(194,65,12,0.4)',
              }}>
                🩸 Request Blood
              </button>
            )}
            {/* Emergency Button */}
            <button onClick={() => setShowEmergencyDialog(true)} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: '#B91C1C', color: '#fff', fontWeight: 800, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 12px rgba(185,28,28,0.45)',
              animation: 'emergBtn 1.5s ease infinite',
            }}>
              <style>{`@keyframes emergBtn{0%,100%{box-shadow:0 2px 12px rgba(185,28,28,0.45)}50%{box-shadow:0 2px 22px rgba(185,28,28,0.75)}}`}</style>
              🚨 Emergency
            </button>
            {/* View toggle */}
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
          {/* Sidebar */}
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
                
                {/* Content Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter By Type</label>
                  <Select 
                    options={[
                      { value: '', label: 'All Content' },
                      { value: 'users', label: 'Users' },
                      { value: 'hospitals', label: 'Hospitals' },
                      { value: 'blood-requests', label: 'Blood Requests' },
                      { value: 'emergency-requests', label: 'Emergency Requests' },
                      { value: 'blood-camps', label: 'Blood Camps' },
                    ]} 
                    value={filters.contentType} 
                    onChange={e => handleFilterChange('contentType', e.target.value)} 
                  />
                </div>
                
                <Select label="Distance" options={distanceOptions} value={filters.distance} onChange={e => handleFilterChange('distance', e.target.value)} />
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="avail" checked={filters.availableOnly}
                    onChange={e => handleFilterChange('availableOnly', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                  <label htmlFor="avail" className="text-sm text-gray-700">Show available only</label>
                </div>

                {/* ── Location mode — clean two-button toggle ───────────── */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Reference Location</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetPosMode('saved')}
                      disabled={!savedLoc?.lat}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: posMode === 'saved' ? '2px solid #EAB308' : '1.5px solid #e5e7eb',
                        background: posMode === 'saved' ? '#fffbeb' : '#fff',
                        color: posMode === 'saved' ? '#92400e' : '#6b7280',
                        cursor: savedLoc?.lat ? 'pointer' : 'not-allowed',
                        opacity: savedLoc?.lat ? 1 : 0.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                      title={savedLoc?.lat ? `Saved: ${savedLoc.label}` : 'No saved location. Set one in Settings.'}
                    >
                      ⭐ Saved
                    </button>
                    <button
                      onClick={() => handleSetPosMode('live')}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: posMode === 'live' ? '2px solid #EAB308' : '1.5px solid #e5e7eb',
                        background: posMode === 'live' ? '#fffbeb' : '#fff',
                        color: posMode === 'live' ? '#92400e' : '#6b7280',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      📍 Live GPS
                    </button>
                  </div>

                  {/* Status line */}
                  <div className="mt-2 text-xs">
                    {posMode === 'saved' && savedLoc?.lat && (
                      <p className="text-yellow-600">⭐ {savedLoc.label} · {savedLoc.lat.toFixed(4)}, {savedLoc.lng.toFixed(4)}</p>
                    )}
                    {posMode === 'saved' && !savedLoc?.lat && (
                      <p className="text-gray-400">No saved location. <a href="/settings" className="text-primary underline">Set one in Settings →</a></p>
                    )}
                    {posMode === 'live' && livePos && !locating && (
                      <p className="text-gray-400">📍 {livePos.lat.toFixed(5)}, {livePos.lng.toFixed(5)}</p>
                    )}
                    {posMode === 'live' && locating && (
                      <p className="text-yellow-600 animate-pulse">Getting your location…</p>
                    )}
                    {posMode === 'live' && locError && (
                      <p className="text-red-500">{locError}</p>
                    )}
                  </div>
                </div>

                {posMode === 'live' && (
                  <Button fullWidth variant="outline" leftIcon={<LocateIcon className="w-4 h-4" />}
                    onClick={() => requestLocation(true)} isLoading={locating}>
                    {locating ? 'Getting location…' : 'Re-centre Live Location'}
                  </Button>
                )}
              </div>

              {/* Result type */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Show Results</p>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'donors', 'hospitals', 'requests'] as const).map(type => (
                    <button key={type} onClick={() => setResultType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${resultType === type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {type === 'requests' ? `🩸 Requests${bloodRequests.length ? ` (${bloodRequests.length})` : ''}` : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Map Legend</p>
                {[
                  { icon: '⭐', label: 'Your saved location' },
                  { dot: '#EAB308', label: 'Your live GPS', pulse: true },
                  { dot: '#3B82F6', label: 'Blood donor (hover for blood group)', pulse: false },
                  { dot: '#22C55E', label: 'Hospital', pulse: false },
                  { dot: '#8B5CF6', label: 'Blood donation camp (hover for details)', pulse: false },
                  { dot: '#C2410C', label: 'Blood request', pulse: false, halo: '#FDBA74' },
                  { dot: '#B91C1C', label: 'Emergency request', pulse: true, halo: '#FCA5A5' },
                ].map(({ icon, dot, label, pulse, halo }: any) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                    {icon
                      ? <span style={{ fontSize: 14 }}>{icon}</span>
                      : <div style={{ width: 14, height: 14, borderRadius: '50%', background: dot, border: '2px solid #fff', boxShadow: halo ? `0 0 0 3px ${halo}` : `0 1px 4px ${dot}88`, flexShrink: 0 }} />
                    }
                    {label}
                  </div>
                ))}
              </div>
            </Card>
          </aside>

          {/* Mobile filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden fixed bottom-6 left-6 z-40 px-4 py-3 bg-white rounded-full shadow-lg flex items-center gap-2 text-gray-700">
            <SlidersHorizontalIcon className="w-5 h-5" /> Filters
            {activeFilterCount > 0 && <Badge variant="primary" size="sm">{activeFilterCount}</Badge>}
          </button>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{mapUsers.length + bloodRequests.length}</span> results
              </p>
              <Select options={[
                { value: 'distance', label: 'Nearest First' },
                { value: 'availability', label: 'Available First' },
                { value: 'recent', label: 'Recently Active' },
              ]} value="distance" onChange={() => { }} size="sm" className="w-40" />
            </div>

            {/* Map */}
            {viewMode === 'map' && (
              <div className="rounded-xl overflow-hidden shadow-lg mb-6" style={{ height: 520, position: 'relative', zIndex: 0 }}>
                {locating && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 400, background: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backdropFilter: 'blur(2px)' }}>
                    <NavigationIcon className="w-8 h-8 text-yellow-500 animate-spin" />
                    <p style={{ fontWeight: 600, color: '#EAB308', fontSize: 14 }}>Getting your precise location…</p>
                  </div>
                )}
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                {/* Floating location mode toggle */}
                <div style={{
                  position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 500, display: 'flex', borderRadius: 10, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.18)', border: '1.5px solid #e5e7eb',
                }}>
                  <button onClick={() => handleSetPosMode('saved')} disabled={!savedLoc?.lat} style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 700, border: 'none',
                    background: posMode === 'saved' ? '#EAB308' : '#fff',
                    color: posMode === 'saved' ? '#fff' : '#374151',
                    cursor: savedLoc?.lat ? 'pointer' : 'not-allowed',
                    opacity: savedLoc?.lat ? 1 : 0.5,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>⭐ Saved</button>
                  <button onClick={() => handleSetPosMode('live')} style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 700, border: 'none',
                    borderLeft: '1.5px solid #e5e7eb',
                    background: posMode === 'live' ? '#EAB308' : '#fff',
                    color: posMode === 'live' ? '#fff' : '#374151',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>📍 Live GPS</button>
                </div>

                {/* Re-centre */}
                <button onClick={() => {
                  if (posMode === 'live') requestLocation(true);
                  else if (savedLoc?.lat && mapInstanceRef.current)
                    mapInstanceRef.current.setView([savedLoc.lat, savedLoc.lng], 14, { animate: true });
                }} style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 500, background: '#fff', border: '2px solid #EAB308', borderRadius: 8, padding: '6px 12px', fontWeight: 600, fontSize: 12, color: '#EAB308', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LocateIcon style={{ width: 14, height: 14 }} /> Re-centre
                </button>
              </div>
            )}

            {/* List sections */}
            <div className="space-y-6">

              {/* ── Blood Camps section ──────────────────────────────── */}
              {(resultType === 'all') && bloodCamps.length > 0 && (
                <section>
                  <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2" style={{ color: '#7C3AED' }}>
                    <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 0 4px #8B5CF622' }} />
                    Upcoming Blood Camps ({bloodCamps.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {bloodCamps.map(camp => {
                      const loc = typeof camp.location === 'object' ? camp.location : null;
                      const organizer = camp.hospitalId?.hospitalName || camp.hospitalId?.name || 'Hospital';
                      const dateStr = camp.startTime ? new Date(camp.startTime).toLocaleDateString() : 'TBD';
                      const timeStr = camp.startTime
                        ? new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';
                      const registered = camp.registeredDonors?.length || 0;
                      const capacity = camp.expectedDonors || 0;
                      const pct = capacity ? Math.round((registered / capacity) * 100) : 0;
                      const bgs: string[] = camp.bloodGroups || ['All'];
                      const isRegistered = me && camp.registeredDonors?.some((d: any) => {
                        const donorUserId = d.userId?._id || d.userId;
                        return donorUserId === (me.id || me._id);
                      });
                      const isFull = registered >= capacity;
                      
                      return (
                        <div key={camp._id} style={{
                          background: '#fff', border: '1.5px solid #DDD6FE', borderRadius: 14,
                          padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                          boxShadow: '0 2px 12px rgba(139,92,246,0.08)',
                          position: 'relative',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ background: '#EDE9FE', color: '#7C3AED', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>⛺ Upcoming Camp</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{dateStr}{timeStr ? ' · ' + timeStr : ''}</span>
                          </div>
                          <p style={{ fontWeight: 800, fontSize: 15, margin: 0, color: '#1f2937' }}>{camp.title}</p>
                          <div style={{ fontSize: 12, color: '#4b5563', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div>🏥 {organizer}</div>
                            {loc?.label && <div>📍 {loc.label}</div>}
                            <div>⏱ {camp.duration} hours</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {bgs.map((bg: string) => (
                              <span key={bg} style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>🩸 {bg}</span>
                            ))}
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                              <span>Registration Progress</span>
                              <span>{registered}/{capacity} · {pct}%</span>
                            </div>
                            <div style={{ height: 6, background: '#EDE9FE', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#8B5CF6', borderRadius: 4, transition: 'width 0.3s' }} />
                            </div>
                          </div>
                          
                          {me && me.role !== 'hospital' && (
                            <button
                              onClick={() => handleCampRegister(camp)}
                              disabled={isRegistered || isFull}
                              style={{
                                marginTop: 8,
                                padding: '10px 16px',
                                background: isRegistered ? '#9CA3AF' : isFull ? '#EF4444' : '#8B5CF6',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: (isRegistered || isFull) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: (isRegistered || isFull) ? 0.7 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!isRegistered && !isFull) e.currentTarget.style.background = '#7C3AED';
                              }}
                              onMouseLeave={(e) => {
                                if (!isRegistered && !isFull) e.currentTarget.style.background = '#8B5CF6';
                              }}
                            >
                              {isRegistered ? '✓ Registered' : isFull ? '🚫 Capacity Full' : 'Register Now'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Blood Requests section ───────────────────────────── */}
              {(resultType === 'all' || resultType === 'requests') && bloodRequests.length > 0 && (
                <section>
                  {emergencyRequests.length > 0 && (
                    <>
                      <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2" style={{ color: '#B91C1C' }}>
                        <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#B91C1C', boxShadow: '0 0 0 4px #FCA5A566' }} />
                        Emergency Requests ({emergencyRequests.length})
                      </h2>
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {emergencyRequests.map(req => {
                          const uid = typeof req.userId === 'object' ? (req.userId as any)._id : req.userId;
                          return (
                            <BloodRequestCard key={req._id} req={req} isMe={uid === myId}
                              onMessage={userId => window.dispatchEvent(new CustomEvent('lf:openchat', { detail: userId }))} />
                          );
                        })}
                      </div>
                    </>
                  )}
                  {activeRequests.length > 0 && (
                    <>
                      <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2" style={{ color: '#C2410C' }}>
                        <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#C2410C', boxShadow: '0 0 0 4px #FDBA7466' }} />
                        Blood Requests ({activeRequests.length})
                      </h2>
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {activeRequests.map(req => {
                          const uid = typeof req.userId === 'object' ? (req.userId as any)._id : req.userId;
                          return (
                            <BloodRequestCard key={req._id} req={req} isMe={uid === myId}
                              onMessage={userId => window.dispatchEvent(new CustomEvent('lf:openchat', { detail: userId }))} />
                          );
                        })}
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* ── Donors ────────────────────────────────────────────── */}
              {(resultType === 'all' || resultType === 'donors') && (
                <section>
                  {(() => {
                    const donors = mapUsers.filter(u => u.role === 'user' && u._id !== myId);
                    return (
                      <>
                        <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" /> Blood Donors ({donors.length})
                        </h2>
                        {donors.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            No donors found matching your criteria
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-4">
                            {donors.map(donor => {
                              const status = connStatuses[donor._id] || 'none';
                              const isConnected = status === 'accepted';
                              
                              return (
                                <div key={donor._id} className="relative group cursor-pointer" onClick={() => setSelectedDonor(donor)}>
                                  <Card className="p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-3">
                                      <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg">
                                          {donor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        {donor.isVerified && (
                                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                            <CheckIcon className="w-3 h-3 text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{donor.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="inline-flex items-center text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                            {donor.bloodGroup || '?'}
                                          </span>
                                          <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                            ● Available
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                                          <LocateIcon className="w-3 h-3" />
                                          {donor.district || 'Location not set'}
                                        </p>
                                      </div>
                                    </div>
                                  </Card>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedDonor(donor); }}
                                    className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow hover:bg-red-600 transition-colors">
                                    <UserPlusIcon className="w-3 h-3" /> {isConnected ? 'Connected' : 'Connect'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>
              )}

              {/* ── Hospitals ─────────────────────────────────────────── */}
              {(resultType === 'all' || resultType === 'hospitals') && (
                <section>
                  {(() => {
                    const hospitals = mapUsers.filter(u => u.role === 'hospital');
                    return (
                      <>
                        <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" /> Hospitals &amp; Blood Banks ({hospitals.length})
                        </h2>
                        {hospitals.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            No hospitals found
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-4">
                            {hospitals.map(hospital => (
                              <div key={hospital._id} className="relative group cursor-pointer" onClick={() => setSelectedHospital(hospital)}>
                                <Card className="p-4 hover:shadow-lg transition-shadow">
                                  <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
                                      🏥
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-gray-900">
                                          {hospital.hospitalName || hospital.name}
                                        </h4>
                                        {hospital.isVerified && (
                                          <span className="inline-flex items-center text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                                            Verified
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                        <LocateIcon className="w-3 h-3" />
                                        {hospital.municipality || hospital.district || 'Location not set'}
                                      </p>
                                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        Open Now • 24/7
                                      </p>
                                    </div>
                                  </div>
                                </Card>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedHospital(hospital); }}
                                  className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow hover:bg-red-600 transition-colors">
                                  <PhoneIcon className="w-3 h-3" /> Contact
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* ── Donor Dialog ──────────────────────────────────────────────────── */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDonor(null)}>
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            style={{ border: '4px solid #10B981' }}
            onClick={(e) => e.stopPropagation()}>
            
            {/* Header with Connect Button */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-2xl">
                      {selectedDonor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    {selectedDonor.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedDonor.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        {selectedDonor.bloodGroup || 'AB-'}
                      </span>
                      <span className="inline-flex items-center text-xs text-green-600 font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                        Available
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                  onClick={() => {
                    const status = connStatuses[selectedDonor._id] || 'none';
                    if (status === 'accepted') {
                      showToast('Already connected!', 'info');
                    } else {
                      showToast('Connection request sent!', 'success');
                    }
                  }}>
                  <UserPlusIcon className="w-4 h-4" />
                  Connect
                </button>
              </div>

              {/* Location and Last Donation */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <LocateIcon className="w-4 h-4 text-gray-400" />
                  <span>{selectedDonor.municipality || selectedDonor.district || 'Kathmandu'}</span>
                  {selectedDonor.tempLocation && refPos && (
                    <span className="text-red-500 font-semibold">
                      • {getDistanceText(selectedDonor.tempLocation.lat, selectedDonor.tempLocation.lng)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center text-gray-400">⏰</div>
                  <span>Last donation: 5 months ago</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button 
                onClick={() => {
                  showToast('Blood request feature coming soon!', 'info');
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors text-base">
                Request Blood
              </button>
              {(() => {
                const status = connStatuses[selectedDonor._id] || 'none';
                const isConnected = status === 'accepted';
                return isConnected && selectedDonor.phone ? (
                  <button 
                    onClick={() => window.open(`tel:${selectedDonor.phone}`, '_self')}
                    className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-bold py-4 px-6 rounded-xl transition-colors flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5" />
                    Call
                  </button>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Hospital Dialog ───────────────────────────────────────────────── */}
      {selectedHospital && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedHospital(null)}>
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            style={{ border: '4px solid #10B981' }}
            onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
                    🏥
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedHospital.hospitalName || selectedHospital.name}</h3>
                    {selectedHospital.isVerified && (
                      <span className="inline-flex items-center text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold mt-1">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                  onClick={() => {
                    if (selectedHospital.phone) {
                      window.open(`tel:${selectedHospital.phone}`, '_self');
                    } else {
                      showToast('Phone number not available', 'error');
                    }
                  }}>
                  <PhoneIcon className="w-4 h-4" />
                  Contact
                </button>
              </div>

              {/* Location and Status */}
              <div className="space-y-2 text-sm mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <LocateIcon className="w-4 h-4 text-gray-400" />
                  <span>{selectedHospital.municipality || selectedHospital.district || 'Mahaboudha, Kathmandu'}</span>
                  {selectedHospital.tempLocation && refPos && (
                    <span className="text-red-500 font-semibold">
                      • {getDistanceText(selectedHospital.tempLocation.lat, selectedHospital.tempLocation.lng)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <div className="w-4 h-4 flex items-center justify-center">⏰</div>
                  <span>Open Now</span>
                  <span className="text-gray-400">• 24/7</span>
                </div>
              </div>

              {/* Blood Availability */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 mb-3 tracking-wide">BLOOD AVAILABILITY</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg, idx) => (
                    <div 
                      key={bg} 
                      className={`text-center py-3 rounded-xl font-bold text-sm ${
                        idx === 3 ? 'bg-orange-500 text-white' : 
                        idx === 5 ? 'bg-gray-300 text-gray-600' : 
                        'bg-green-500 text-white'
                      }`}>
                      {bg}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button 
                onClick={() => {
                  if (selectedHospital.tempLocation?.lat && selectedHospital.tempLocation?.lng) {
                    setViewMode('map');
                    setSelectedHospital(null);
                    showToast('Showing directions on map', 'success');
                  } else {
                    showToast('Hospital location not available', 'error');
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base">
                <NavigationIcon className="w-5 h-5" />
                Directions
              </button>
              {selectedHospital.phone && (
                <button 
                  onClick={() => window.open(`tel:${selectedHospital.phone}`, '_self')}
                  className="bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-4 px-6 rounded-xl transition-colors flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5" />
                  <span className="text-sm">{selectedHospital.phone.slice(0, 11) || '01-4221119'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Camp Registration Dialog ──────────────────────────────────────── */}
      {showCampRegistration && selectedCamp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCampRegistration(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Register for Blood Camp</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedCamp.title}</p>
              </div>
              <button onClick={() => setShowCampRegistration(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const token = localStorage.getItem('lf_token');
                const res = await fetch(`${API}/api/camp-registration/${selectedCamp._id}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    fullName: campRegForm.fullName,
                    email: campRegForm.email,
                    phone: campRegForm.phone,
                    age: parseInt(campRegForm.age),
                    weight: parseInt(campRegForm.weight),
                    lastDonationMonth: campRegForm.lastDonationMonth,
                    lastDonationYear: campRegForm.lastDonationYear,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Registration failed');
                
                showToast('Successfully registered for blood camp!', 'success');
                setShowCampRegistration(false);
                setSelectedCamp(null);
                
                // Refresh camps to show updated registration count
                const campsRes = await fetch(`${API}/api/blood-camps/approved`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (campsRes.ok) {
                  const campsData = await campsRes.json();
                  setBloodCamps(campsData || []);
                }
              } catch (err: any) {
                showToast(err.message || 'Registration failed', 'error');
              }
            }} className="space-y-4">
              
              {/* Personal Information */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={campRegForm.fullName}
                  onChange={(e) => setCampRegForm({ ...campRegForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={campRegForm.email}
                  onChange={(e) => setCampRegForm({ ...campRegForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number *</label>
                <input
                  type="tel"
                  required
                  value={campRegForm.phone}
                  onChange={(e) => setCampRegForm({ ...campRegForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="98XXXXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                  <input
                    type="number"
                    required
                    min="18"
                    max="65"
                    value={campRegForm.age}
                    onChange={(e) => setCampRegForm({ ...campRegForm, age: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    min="45"
                    value={campRegForm.weight}
                    onChange={(e) => setCampRegForm({ ...campRegForm, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="60"
                  />
                </div>
              </div>

              {/* Last Donation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Blood Donation</label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={campRegForm.lastDonationMonth}
                    onChange={(e) => setCampRegForm({ ...campRegForm, lastDonationMonth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">Month</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                      <option key={m} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={campRegForm.lastDonationYear}
                    onChange={(e) => setCampRegForm({ ...campRegForm, lastDonationYear: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">Year</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank if this is your first donation</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>Note:</strong> You must be at least 18 years old, weigh at least 45kg, and have waited at least 3 months since your last donation.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCampRegistration(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

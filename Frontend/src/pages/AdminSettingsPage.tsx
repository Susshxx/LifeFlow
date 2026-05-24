import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon, CameraIcon, CheckCircleIcon,
  AlertCircleIcon, SaveIcon, Loader2Icon, MenuIcon,
  SunIcon, MoonIcon, MonitorIcon, PaletteIcon, ShieldCheckIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Sidebar } from '../components/layout/Sidebar';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarBase64, setAvatarBase64] = useState<string>('');
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // ── Theme functions ────────────────────────────────────────────────────────
  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    let effectiveTheme = selectedTheme;
    
    if (selectedTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('lf_theme', newTheme);
    applyTheme(newTheme);
    setSaveSuccess(false);
  };

  // Listen for system theme changes when "system" is selected
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // ── Load user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('lf_user');
    if (!stored) { navigate('/login'); return; }
    const user = JSON.parse(stored);
    
    if (user.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user);
    setAvatarPreview(user.avatar || '');

    // Load theme preference
    const savedTheme = localStorage.getItem('lf_theme') as 'light' | 'dark' | 'system' || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const token = localStorage.getItem('lf_token');
    if (token) {
      console.log('[AdminSettingsPage] Fetching profile from:', `${API}/api/profile`);
      
      fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          console.log('[AdminSettingsPage] Profile response status:', r.status);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(data => {
          console.log('[AdminSettingsPage] Profile data received:', data);
          if (data.id) {
            setAvatarPreview(data.avatar || '');
            const updatedUser = { ...user, ...data };
            setCurrentUser(updatedUser);
            localStorage.setItem('lf_user', JSON.stringify(updatedUser));
          }
        })
        .catch((err) => {
          console.error('[AdminSettingsPage] Failed to fetch data:', err);
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
    if (!file.type.startsWith('image/')) { 
      setSaveError('Please select an image file (JPG, PNG, etc.)'); 
      return; 
    }
    if (file.size > 1.5 * 1024 * 1024) { 
      setSaveError('Photo must be under 1.5MB.'); 
      return; 
    }
    setSaveError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl); 
      setAvatarBase64(dataUrl); 
      setAvatarChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(''); 
    setAvatarBase64(''); 
    setAvatarChanged(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsLoading(true); 
    setSaveError(''); 
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('lf_token');
      if (!token) { navigate('/login'); return; }

      const payload: Record<string, any> = {};
      if (avatarChanged) payload.avatar = avatarBase64;

      console.log('[AdminSettingsPage] Saving profile to:', `${API}/api/profile`);

      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      console.log('[AdminSettingsPage] Save response status:', res.status);
      const data = await res.json();
      console.log('[AdminSettingsPage] Save response data:', data);

      if (!res.ok) { 
        setSaveError(data.error || 'Failed to save changes.'); 
        return; 
      }

      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem('lf_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setAvatarChanged(false);
      setSaveSuccess(true);
      window.dispatchEvent(new Event('lf_user_updated'));
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('[AdminSettingsPage] Save error:', err);
      setSaveError('Could not connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2Icon className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
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
                <h1 className="text-2xl font-heading font-bold text-gray-900">Admin Settings</h1>
                <p className="text-gray-600">Manage your admin account and preferences</p>
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
                  <p className="text-sm font-medium text-gray-700 mb-1">{currentUser?.name}</p>
                  <p className="text-xs text-gray-400 mb-3">JPG or PNG · Max 1.5MB</p>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()} 
                      leftIcon={<CameraIcon className="w-4 h-4" />}
                    >
                      Upload Photo
                    </Button>
                    {avatarPreview && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemovePhoto} 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoSelect} 
                  />
                </div>
              </div>
            </Card>

            {/* ── Admin Info ──────────────────────────────────────────────────── */}
            <Card padding="lg" className="mb-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-primary" /> Admin Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-500">{currentUser?.email}</span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Admin Account</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 rounded-lg border border-primary/20">
                    <ShieldCheckIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">System Administrator</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* ── Status messages ─────────────────────────────────────────────── */}
            {saveSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-700">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" /> Settings updated successfully!
              </div>
            )}
            {saveError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" /> {saveError}
              </div>
            )}

            <Button 
              type="button" 
              onClick={handleSave} 
              isLoading={isLoading} 
              fullWidth 
              size="lg" 
              leftIcon={<SaveIcon className="w-4 h-4" />}
              disabled={!avatarChanged}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

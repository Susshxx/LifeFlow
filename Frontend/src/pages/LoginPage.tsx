import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HeartPulseIcon, UserIcon, BuildingIcon, ShieldIcon, MailIcon, LockIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input }  from '../components/ui/Input';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { Card }   from '../components/ui/Card';

// Add animation styles
const animationStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

type UserType = 'user' | 'hospital' | 'admin';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const userTabs = [
  { id: 'user',     label: 'Donor',    icon: <UserIcon     className="w-4 h-4" /> },
  { id: 'hospital', label: 'Hospital', icon: <BuildingIcon className="w-4 h-4" /> },
  { id: 'admin',    label: 'Admin',    icon: <ShieldIcon   className="w-4 h-4" /> },
];

export function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem('lf_user');
    if (user) navigate('/', { replace: true });
  }, [navigate]);

  // Handle Google OAuth error param
  const params = new URLSearchParams(location.search);
  const googleError = params.get('error');

  const [activeTab,     setActiveTab]     = useState<UserType>('user');
  const [isLoading,     setIsLoading]     = useState(false);
  const [formData,      setFormData]      = useState({ email: '', password: '' });
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [showAdminTab,  setShowAdminTab]  = useState(false);
  
  // Handle different error types from Google OAuth
  const getInitialError = () => {
    if (googleError === 'google_failed') return 'Google sign-in failed. Please try again.';
    if (googleError === 'database_unavailable') return 'Database connection unavailable. Please try again in a moment.';
    if (googleError === 'database_error') return 'Database error occurred. Please try again.';
    return '';
  };
  
  const [loginError,    setLoginError]    = useState(getInitialError());

  // Secret key combination to toggle admin login: Ctrl + Shift + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        
        // Toggle admin tab visibility
        setShowAdminTab(prev => {
          const newState = !prev;
          
          // If hiding admin tab and currently on admin tab, switch to user tab
          if (!newState && activeTab === 'admin') {
            setActiveTab('user');
            setFormData({ email: '', password: '' });
            setErrors({});
            setLoginError('');
          }
          
          // If showing admin tab, switch to it
          if (newState) {
            setActiveTab('admin');
          }
          
          // Show notification
          const notification = document.createElement('div');
          notification.textContent = newState ? '🔓 Admin panel unlocked' : '🔒 Admin panel locked';
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${newState ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
          }, 2000);
          
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as UserType);
    setFormData({ email: '', password: '' });
    setErrors({});
    setLoginError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLoginError('');
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (activeTab === 'admin') {
      // Admin uses email format: admin@lifeflow
      if (!formData.email)    e.email    = 'Email is required';
      if (!formData.password) e.password = 'Password is required';
    } else {
      if (!formData.email)                            e.email    = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email    = 'Please enter a valid email';
      if (!formData.password)                         e.password = 'Password is required';
      else if (formData.password.length < 6)          e.password = 'Password must be at least 6 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setLoginError('');

    try {
      // Admin: authenticate with backend
      if (activeTab === 'admin') {
        const res  = await fetch(`${API}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();

        if (!res.ok) { 
          setLoginError(data.error || data.message || 'Invalid admin credentials.'); 
          return; 
        }

        // Verify it's actually an admin account
        if (data.user.role !== 'admin') {
          setLoginError('Invalid admin credentials. This account is not an admin account.');
          return;
        }

        localStorage.setItem('lf_token', data.token);
        localStorage.setItem('lf_user',  JSON.stringify(data.user));
        navigate('/admin/dashboard');
        return;
      }

      // User / Hospital: MongoDB
      const res  = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await res.json();

      if (!res.ok) { 
        setLoginError(data.error || data.message || 'Invalid credentials.'); 
        return; 
      }

      // Role-based validation: Ensure user logs in through correct portal
      if (activeTab === 'user' && data.user.role !== 'user') {
        setLoginError('This account is not a donor account. Please use the correct login portal.');
        return;
      }

      if (activeTab === 'hospital' && data.user.role !== 'hospital') {
        setLoginError('This account is not a hospital account. Please use the correct login portal.');
        return;
      }

      // Store credentials
      localStorage.setItem('lf_token', data.token);
      localStorage.setItem('lf_user',  JSON.stringify(data.user));
      
      // Redirect based on user role
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'hospital') {
        navigate('/hospital/dashboard');
      } else {
        navigate('/');
      }
    } catch {
      setLoginError('Could not connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <HeartPulseIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-secondary">
              Life<span className="text-primary">Flow</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-gray-600">Sign in to continue to LifeFlow</p>
          </div>

          <Card padding="lg">
            <Tabs 
              tabs={showAdminTab ? userTabs : userTabs.filter(t => t.id !== 'admin')} 
              activeTab={activeTab} 
              onChange={handleTabChange} 
              className="mb-6" 
            />

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {loginError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <TabPanel id="user" activeTab={activeTab}>
                <p className="text-sm text-gray-600 mb-4">Sign in as a blood donor to manage your donations and respond to requests.</p>
              </TabPanel>
              <TabPanel id="hospital" activeTab={activeTab}>
                <p className="text-sm text-gray-600 mb-4">Sign in as a hospital to manage blood requests and donation camps.</p>
              </TabPanel>
              <TabPanel id="admin" activeTab={activeTab}>
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <ShieldIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">Restricted — Admin access only</p>
                </div>
              </TabPanel>

              <Input
                label={activeTab === 'admin' ? 'Email Address' : 'Email Address'}
                type="email"
                name="email"
                placeholder={activeTab === 'admin' ? 'admin@lifeflow' : activeTab === 'hospital' ? 'hospital@example.com' : 'donor@example.com'}
                value={formData.email} onChange={handleChange} error={errors.email}
                leftIcon={activeTab === 'admin' ? <ShieldIcon className="w-5 h-5" /> : <MailIcon className="w-5 h-5" />}
              />
              <Input label="Password" type="password" name="password" placeholder="Enter your password"
                value={formData.password} onChange={handleChange} error={errors.password}
                leftIcon={<LockIcon className="w-5 h-5" />} />

              {activeTab !== 'admin' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</Link>
                </div>
              )}

              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                {activeTab === 'admin' ? 'Access Admin Panel' : 'Sign In'}
              </Button>
            </form>

            {activeTab !== 'admin' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <Button variant="outline" fullWidth className="mb-3" onClick={handleGoogleLogin}>
                  <div className="flex items-center justify-center gap-2">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </div>
                </Button>
              </>
            )}
          </Card>

          {activeTab !== 'admin' && (
            <p className="mt-6 text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Sign Up</Link>
            </p>
          )}
        </div>
      </main>

      <footer className="py-6 px-4 text-center text-sm text-gray-500">
        <p>© 2024 LifeFlow Nepal. All rights reserved.</p>
      </footer>
    </div>
  );
}
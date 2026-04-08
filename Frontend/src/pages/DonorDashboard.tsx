import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropletIcon, CalendarIcon, TrophyIcon, BellIcon, ClockIcon,
  MapPinIcon, ChevronRightIcon, AlertTriangleIcon, HeartIcon,
  ActivityIcon, LogOutIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { StatsCard } from '../components/features/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { NotificationPanel } from '../components/features/NotificationPanel';
import { MessagesPanel } from '../components/features/MessagesPanel';
import { CampCard } from '../components/features/CampCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface EmergencyRequest {
  _id: string;
  name: string;
  phone: string;
  email: string;
  bloodGroup: string;
  isEmergency: boolean;
  location: { lat: number; lng: number; label: string };
  createdAt: string;
  userId?: string | { _id: string };
}

interface DashboardStats {
  bloodGroup: string;
  totalDonations: number;
  lastDonation: string | null;
  tokens: number;
  recentActivity: any[];
  eligibleToDonate: boolean;
  nextEligibleDate: string | null;
}

export function DonorDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [currentEmergencyIdx, setCurrentEmergencyIdx] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; }
  })();
  const isLoggedIn = !!localStorage.getItem('lf_token');
  const welcomeName = storedUser?.name || 'Donor';

  // Placeholder data - TODO: Replace with real data from backend
  const recentActivity: any[] = [];

  const upcomingCamps: any[] = [];

  const notifications: any[] = [];

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) {
        setStatsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/api/users/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Load emergency requests from localStorage (written by SearchPage) or fetch directly
  const loadEmergencies = () => {
    try {
      const cached = localStorage.getItem('lf_emergency_requests');
      if (cached) {
        const data: EmergencyRequest[] = JSON.parse(cached);
        // Filter out own requests
        const myUserId = storedUser?.id || storedUser?._id;
        const filtered = data.filter(r => {
          const requestUserId = typeof r.userId === 'object' ? (r.userId as any)._id : r.userId;
          return requestUserId !== myUserId;
        });
        setEmergencyRequests(filtered);
        
        // Check if we should show the modal based on last shown time
        if (filtered.length > 0) {
          const lastShown = localStorage.getItem('lf_emergency_modal_last_shown');
          const now = Date.now();
          
          if (!lastShown) {
            // First time - show modal
            setShowEmergencyModal(true);
            localStorage.setItem('lf_emergency_modal_last_shown', now.toString());
          } else {
            const lastShownTime = parseInt(lastShown, 10);
            const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
            
            if (now - lastShownTime >= twoHoursInMs) {
              // More than 2 hours passed - show modal
              setShowEmergencyModal(true);
              localStorage.setItem('lf_emergency_modal_last_shown', now.toString());
            }
          }
        }
      }
    } catch { }
  };

  // Also fetch directly from API so dashboard works even if SearchPage wasn't visited
  useEffect(() => {
    const token = localStorage.getItem('lf_token');
    fetch(`${API}/api/blood-requests`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: EmergencyRequest[]) => {
        // Filter for emergency requests that are NOT created by the current user
        const emergencies = data.filter(r => {
          if (!r.isEmergency) return false;
          const requestUserId = typeof r.userId === 'object' ? (r.userId as any)._id : r.userId;
          const myUserId = storedUser?.id || storedUser?._id;
          return requestUserId !== myUserId;
        });
        
        localStorage.setItem('lf_emergency_requests', JSON.stringify(emergencies));
        setEmergencyRequests(emergencies);
        
        // Check if we should show the modal based on last shown time
        if (emergencies.length > 0) {
          const lastShown = localStorage.getItem('lf_emergency_modal_last_shown');
          const now = Date.now();
          
          if (!lastShown) {
            // First time - show modal
            setShowEmergencyModal(true);
            localStorage.setItem('lf_emergency_modal_last_shown', now.toString());
          } else {
            const lastShownTime = parseInt(lastShown, 10);
            const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
            
            if (now - lastShownTime >= twoHoursInMs) {
              // More than 2 hours passed - show modal
              setShowEmergencyModal(true);
              localStorage.setItem('lf_emergency_modal_last_shown', now.toString());
            }
          }
        }
      })
      .catch(loadEmergencies); // fallback to cached
  }, []);

  // Listen for updates from SearchPage
  useEffect(() => {
    const handler = () => loadEmergencies();
    window.addEventListener('lf_emergency_updated', handler);
    return () => window.removeEventListener('lf_emergency_updated', handler);
  }, []);

  const currentReq = emergencyRequests[currentEmergencyIdx] ?? null;

  const handleRespondNow = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!currentReq) return;
    const { lat, lng } = currentReq.location;
    setShowEmergencyModal(false);
    // Don't update timestamp when responding - user took action
    navigate(`/search?lat=${lat}&lng=${lng}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('lf_token');
    localStorage.removeItem('lf_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="user" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Back to home"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {welcomeName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <BellIcon className="w-6 h-6" />
                {emergencyRequests.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
                )}
              </button>
              <Button variant="primary" leftIcon={<DropletIcon className="w-4 h-4" />} onClick={() => navigate('/search')}>
                Donate Now
              </Button>
              <Button variant="outline" size="sm" leftIcon={<LogOutIcon className="w-4 h-4" />}
                onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Emergency banner strip */}
        {emergencyRequests.length > 0 && (
          <div
            style={{ background: '#B91C1C', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
            role="alert"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                {emergencyRequests.length} active emergency blood request{emergencyRequests.length > 1 ? 's' : ''} —&nbsp;
                <button
                  onClick={() => setShowEmergencyModal(true)}
                  style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: 0 }}
                >
                  View details
                </button>
              </span>
            </div>
            <button
              onClick={handleRespondNow}
              style={{ background: '#fff', color: '#B91C1C', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Respond Now
            </button>
          </div>
        )}

        <div className="p-4 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <StatsCard
                  title="Your Blood Group"
                  value={dashboardStats?.bloodGroup || storedUser?.bloodGroup || 'Not Set'}
                  icon={<DropletIcon className="w-6 h-6" />}
                  variant="primary"
                />
                <StatsCard
                  title="Total Donations"
                  value={dashboardStats?.totalDonations.toString() || '0'}
                  subtitle="Lifetime"
                  icon={<HeartIcon className="w-6 h-6" />}
                  variant="success"
                />
                <StatsCard
                  title="Last Donation"
                  value={dashboardStats?.lastDonation ? new Date(dashboardStats.lastDonation).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                  subtitle={dashboardStats?.lastDonation ? new Date(dashboardStats.lastDonation).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No donations yet'}
                  icon={<CalendarIcon className="w-6 h-6" />}
                  variant="secondary"
                />
                <StatsCard
                  title="Token Rewards"
                  value={dashboardStats?.tokens.toString() || '0'}
                  subtitle="Points earned"
                  icon={<TrophyIcon className="w-6 h-6" />}
                  variant="warning"
                />
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Eligibility */}
              <Card>
                <CardHeader><CardTitle>Donation Eligibility</CardTitle></CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : dashboardStats?.eligibleToDonate ? (
                    <div className="flex items-center gap-4 p-4 bg-success/10 rounded-xl">
                      <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                        <ActivityIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-success-dark">You are eligible to donate!</p>
                        <p className="text-sm text-gray-600">
                          {dashboardStats.lastDonation 
                            ? `Your last donation was ${new Date(dashboardStats.lastDonation).toLocaleDateString()}. You can donate again.`
                            : 'You have not donated yet. You can donate now!'}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => navigate('/search')}>Find Donation Center</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-warning/10 rounded-xl">
                      <div className="w-12 h-12 bg-warning rounded-full flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-warning-dark">Not eligible yet</p>
                        <p className="text-sm text-gray-600">
                          {dashboardStats?.nextEligibleDate 
                            ? `You can donate again on ${new Date(dashboardStats.nextEligibleDate).toLocaleDateString()}`
                            : 'Please wait 3 months between donations'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Camps */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Upcoming Blood Camps</CardTitle>
                  <Button variant="ghost" size="sm" rightIcon={<ChevronRightIcon className="w-4 h-4" />} onClick={() => navigate('/dashboard/camps')}>View All</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingCamps.map(camp => <CampCard key={camp.id} {...camp} />)}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={activity.id} className={`flex items-start gap-4 ${index !== recentActivity.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                          ${activity.type === 'donation' ? 'bg-primary/10 text-primary' : ''}
                          ${activity.type === 'reward' ? 'bg-warning/10 text-warning' : ''}
                          ${activity.type === 'camp' ? 'bg-secondary/10 text-secondary' : ''}
                          ${activity.type === 'alert' ? 'bg-emergency/10 text-emergency' : ''}`}>
                          <activity.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <MessagesPanel />
              <NotificationPanel notifications={notifications} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-warning" /> Token Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <p className="text-4xl font-bold text-warning">{dashboardStats?.tokens || 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Points Available</p>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Next reward at</span>
                          <span className="font-semibold">500 points</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-warning rounded-full transition-all" 
                            style={{ width: `${Math.min(((dashboardStats?.tokens || 0) / 500) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                      <Button variant="outline" fullWidth className="mt-4">Redeem Rewards</Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" fullWidth leftIcon={<MapPinIcon className="w-4 h-4" />} onClick={() => navigate('/search')}>Find Nearby Hospitals</Button>
                  <Button variant="outline" fullWidth leftIcon={<CalendarIcon className="w-4 h-4" />} onClick={() => navigate('/dashboard/camps')}>View Blood Camps</Button>
                  <Button variant="outline" fullWidth leftIcon={<ClockIcon className="w-4 h-4" />} onClick={() => navigate('/dashboard/history')}>View Donation History</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Emergency Request Modal */}
      <Modal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} title="Emergency Blood Request" size="md">
        {currentReq ? (
          <div className="space-y-4">
            {/* Multi-request navigation */}
            {emergencyRequests.length > 1 && (
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>{currentEmergencyIdx + 1} of {emergencyRequests.length} emergency requests</span>
                <div className="flex gap-2">
                  <button
                    disabled={currentEmergencyIdx === 0}
                    onClick={() => setCurrentEmergencyIdx(i => i - 1)}
                    className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >←</button>
                  <button
                    disabled={currentEmergencyIdx === emergencyRequests.length - 1}
                    onClick={() => setCurrentEmergencyIdx(i => i + 1)}
                    className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >→</button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-emergency/10 rounded-xl">
              <div className="w-12 h-12 bg-emergency rounded-full flex items-center justify-center emergency-pulse">
                <AlertTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-emergency-dark">Urgent: {currentReq.bloodGroup} Blood Needed</p>
                <p className="text-sm text-gray-600">{currentReq.location?.label || 'Location not specified'}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Blood Group Required</span>
                <Badge variant="primary">{currentReq.bloodGroup}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Requested by</span>
                <span className="font-medium">{currentReq.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contact</span>
                <span className="font-medium">{currentReq.phone}</span>
              </div>
              {currentReq.location?.label && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-right max-w-[60%]">{currentReq.location.label}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEmergencyModal(false)} className="flex-1">Not Now</Button>
              <Button variant="emergency" className="flex-1" onClick={handleRespondNow}>
                Respond Now
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No active emergency requests.</p>
        )}
      </Modal>

      {/* Login Prompt Modal */}
      <Modal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} title="Login Required" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
            <AlertTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              You need to be logged in to respond to a blood request and view the exact location.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowLoginPrompt(false);
                navigate('/login');
              }}
            >
              Go to Login
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowLoginPrompt(false);
                navigate('/signup');
              }}
            >
              Go to Sign Up
            </Button>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="text-sm text-gray-400 hover:text-gray-600 text-center py-1"
            >
              Skip for now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

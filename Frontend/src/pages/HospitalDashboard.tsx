import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropletIcon, UsersIcon, CalendarIcon, AlertTriangleIcon, PlusIcon, TrendingUpIcon, MessageCircleIcon, UserPlusIcon, EditIcon, TrophyIcon, BellIcon } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { StatsCard } from '../components/features/StatsCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { NotificationPanel } from '../components/features/NotificationPanel';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const bloodGroups = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

interface BloodStock {
  units: number;
  capacity: number;
}

interface BloodInventory {
  _id: string;
  hospitalId: string;
  inventory: {
    'A+': BloodStock;
    'A-': BloodStock;
    'B+': BloodStock;
    'B-': BloodStock;
    'AB+': BloodStock;
    'AB-': BloodStock;
    'O+': BloodStock;
    'O-': BloodStock;
  };
  lastUpdated: string;
}

export function HospitalDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectedDonorsCount, setConnectedDonorsCount] = useState(0);
  const [connectedDonors, setConnectedDonors] = useState<any[]>([]);
  const [donorTokens, setDonorTokens] = useState<Record<string, number>>({});
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [bloodRequestsCount, setBloodRequestsCount] = useState(0);
  const [bloodCamps, setBloodCamps] = useState<any[]>([]);
  const [campsLoading, setCampsLoading] = useState(false);
  const [bloodInventory, setBloodInventory] = useState<BloodInventory | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Inventory update form state
  const [inventoryForm, setInventoryForm] = useState<Record<string, { units: string; capacity: string }>>({});

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; }
  })();
  const welcomeName = storedUser?.hospitalName || storedUser?.name || 'Hospital';

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch blood inventory
  useEffect(() => {
    const fetchInventory = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;
      
      setInventoryLoading(true);
      try {
        const res = await fetch(`${API}/api/blood-inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setBloodInventory(data);
          
          // Initialize form with current values
          const formData: Record<string, { units: string; capacity: string }> = {};
          Object.entries(data.inventory).forEach(([group, stock]: [string, any]) => {
            formData[group] = {
              units: stock.units.toString(),
              capacity: stock.capacity.toString(),
            };
          });
          setInventoryForm(formData);
        } else {
          console.error('Failed to fetch inventory');
        }
      } catch (err) {
        console.error('Failed to fetch blood inventory:', err);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Fetch blood camps
  useEffect(() => {
    const fetchCamps = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;
      
      setCampsLoading(true);
      try {
        const res = await fetch(`${API}/api/blood-camps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setBloodCamps(data);
        }
      } catch (err) {
        console.error('Failed to fetch blood camps:', err);
      } finally {
        setCampsLoading(false);
      }
    };

    fetchCamps();
    const interval = setInterval(fetchCamps, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch blood requests count
  useEffect(() => {
    const fetchBloodRequests = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;
      
      try {
        console.log('[HospitalDashboard] Fetching blood requests...');
        const res = await fetch(`${API}/api/blood-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          // Count active requests (isActive = true)
          const activeRequests = data.filter((req: any) => req.isActive === true);
          console.log('[HospitalDashboard] Active blood requests:', activeRequests.length);
          setBloodRequestsCount(activeRequests.length);
        }
      } catch (err) {
        console.error('[HospitalDashboard] Failed to fetch blood requests:', err);
      }
    };

    fetchBloodRequests();
    const interval = setInterval(fetchBloodRequests, 60_000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch connection stats and donor tokens
  useEffect(() => {
    fetchConnectionStats();
    
    // Auto-refresh every 30 seconds to catch token updates
    const interval = setInterval(() => {
      console.log('[HospitalDashboard] Auto-refreshing connection stats...');
      fetchConnectionStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      try {
        const res = await fetch(`${API}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (err) {
        console.error('[HospitalDashboard] Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleNotificationOpen = () => {
    setShowNotifications(true);
  };

  const handleNotificationClose = () => {
    setShowNotifications(false);
    // Refresh unread count when closing
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      try {
        const res = await fetch(`${API}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (err) {
        console.error('[HospitalDashboard] Failed to fetch unread count:', err);
      }
    };
    fetchUnreadCount();
  };

  const fetchConnectionStats = async () => {
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      console.log('[HospitalDashboard] Fetching connection stats...');

      const connectionsRes = await fetch(`${API}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (connectionsRes.ok) {
        const connections = await connectionsRes.json();
        console.log('[HospitalDashboard] Connections fetched:', connections.length);
        setConnectedDonorsCount(connections.length);
        // Store connected donors for display
        const myId = storedUser?.id || storedUser?._id;
        const donors = connections.map((conn: any) => {
          return conn.from._id === myId ? conn.to : conn.from;
        });
        console.log('[HospitalDashboard] Donors to display:', donors.slice(0, 5).map((d: any) => ({ id: d._id, name: d.name })));
        setConnectedDonors(donors.slice(0, 5)); // Show only first 5
        
        // Fetch tokens earned from this hospital for each donor
        const donorIds = donors.map((d: any) => d._id);
        if (donorIds.length > 0) {
          console.log('[HospitalDashboard] Fetching tokens for donors:', donorIds);
          const tokensRes = await fetch(`${API}/api/donation-history/tokens-by-hospital`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ donorIds }),
          });
          
          if (tokensRes.ok) {
            const tokensData = await tokensRes.json();
            console.log('[HospitalDashboard] ✅ Received tokens data:', tokensData);
            setDonorTokens(tokensData);
          } else {
            console.error('[HospitalDashboard] ❌ Failed to fetch tokens:', tokensRes.status);
            const errorText = await tokensRes.text();
            console.error('[HospitalDashboard] Error response:', errorText);
          }
        }
      }

      const requestsRes = await fetch(`${API}/api/connections/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setPendingRequestsCount(requests.length);
      }
    } catch (err) {
      console.error('[HospitalDashboard] Failed to fetch connection stats:', err);
    }
  };

  const getBloodStatus = (units: number, capacity: number): 'good' | 'low' | 'critical' => {
    const percentage = (units / capacity) * 100;
    if (units === 0 || percentage < 20) return 'critical';
    if (percentage < 50) return 'low';
    return 'good';
  };

  const handleInventoryFormChange = (bloodGroup: string, field: 'units' | 'capacity', value: string) => {
    setInventoryForm(prev => ({
      ...prev,
      [bloodGroup]: {
        ...prev[bloodGroup],
        [field]: value,
      },
    }));
  };

  const handleRedeemTokens = async (donorId: string, donorName: string) => {
    const tokensEarned = donorTokens[donorId] || 0;
    
    if (tokensEarned < 10) {
      showToast(`${donorName} doesn't have enough tokens to redeem (needs 10, has ${tokensEarned})`, 'error');
      return;
    }

    const confirmed = window.confirm(
      `Redeem 10 tokens for ${donorName}?\n\nThis will deduct 10 tokens from their account.`
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('lf_token');
    if (!token) {
      showToast('Please log in first', 'error');
      return;
    }

    try {
      console.log('[HospitalDashboard] Redeeming tokens for donor:', donorId);
      const res = await fetch(`${API}/api/users/${donorId}/redeem-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tokensToRedeem: 10 }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[HospitalDashboard] Redemption successful:', data);
        showToast(`Successfully redeemed 10 tokens for ${donorName}!`, 'success');
        
        // Refresh connection stats to get updated token counts
        await fetchConnectionStats();
      } else {
        const error = await res.json();
        console.error('[HospitalDashboard] Redemption failed:', error);
        showToast(error.error || 'Failed to redeem tokens', 'error');
      }
    } catch (err) {
      console.error('[HospitalDashboard] Redeem tokens error:', err);
      showToast('Failed to redeem tokens. Please try again.', 'error');
    }
  };

  const handleUpdateInventory = async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) {
      showToast('Please log in first', 'error');
      return;
    }

    try {
      const updates = Object.entries(inventoryForm).map(([bloodGroup, values]) => ({
        bloodGroup,
        units: parseInt(values.units) || 0,
        capacity: parseInt(values.capacity) || 1,
      }));

      console.log('Sending inventory update:', updates);

      const res = await fetch(`${API}/api/blood-inventory/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      console.log('Update response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Update successful:', data);
        setBloodInventory(data);
        
        // Update form with new values
        const formData: Record<string, { units: string; capacity: string }> = {};
        Object.entries(data.inventory).forEach(([group, stock]: [string, any]) => {
          formData[group] = {
            units: stock.units.toString(),
            capacity: stock.capacity.toString(),
          };
        });
        setInventoryForm(formData);
        
        setShowInventoryModal(false);
        showToast('Blood inventory updated successfully!', 'success');
      } else {
        const error = await res.json();
        console.error('Update failed:', error);
        showToast(error.error || 'Failed to update inventory', 'error');
      }
    } catch (err) {
      console.error('Update inventory error:', err);
      showToast('Failed to update inventory. Please try again.', 'error');
    }
  };

  const criticalBloodGroups = bloodInventory
    ? Object.entries(bloodInventory.inventory)
        .filter(([_, stock]: [string, any]) => getBloodStatus(stock.units, stock.capacity) === 'critical')
        .map(([group]) => group)
    : [];

  const stats = [
    {
      title: 'Blood Requests',
      value: bloodRequestsCount.toString(),
      subtitle: 'Active requests',
      icon: <DropletIcon className="w-6 h-6" />,
      variant: 'primary' as const,
    },
    {
      title: 'Connected Donors',
      value: connectedDonorsCount.toString(),
      subtitle: 'Active donors',
      icon: <UsersIcon className="w-6 h-6" />,
      variant: 'success' as const,
    },
    {
      title: 'Blood Camps',
      value: bloodCamps.filter(c => c.status === 'approved').length.toString(),
      subtitle: 'Approved camps',
      icon: <CalendarIcon className="w-6 h-6" />,
      variant: 'secondary' as const,
    },
    {
      title: 'Critical Stock',
      value: criticalBloodGroups.length.toString(),
      subtitle: 'Blood groups',
      icon: <AlertTriangleIcon className="w-6 h-6" />,
      variant: 'error' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="hospital" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.msg}
        </div>
      )}

      <main className="flex-1 min-w-0 lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">Hospital Dashboard</h1>
                <p className="text-gray-600">{welcomeName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={handleNotificationOpen}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <Button variant="outline" leftIcon={<CalendarIcon className="w-4 h-4" />} onClick={() => navigate('/hospital/camps')}>
                Manage Camps
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Emergency Alert */}
          {criticalBloodGroups.length > 0 && (
            <div className="mb-6 p-4 bg-emergency/10 border border-emergency/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emergency rounded-full flex items-center justify-center emergency-pulse">
                  <AlertTriangleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emergency-dark">Critical Blood Shortage</p>
                  <p className="text-sm text-gray-600">
                    {criticalBloodGroups.join(', ')} blood group{criticalBloodGroups.length > 1 ? 's are' : ' is'} critically low
                  </p>
                </div>
              </div>
              <Button variant="emergency" onClick={() => navigate('/hospital/camps')}>
                Open Donation Camp
              </Button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(stat => <StatsCard key={stat.title} {...stat} />)}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Blood Stock Inventory */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Blood Stock Inventory</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<EditIcon className="w-4 h-4" />}
                    onClick={() => setShowInventoryModal(true)}
                  >
                    Update Stock
                  </Button>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading inventory...</div>
                  ) : bloodInventory ? (
                    <>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                        {Object.entries(bloodInventory.inventory).map(([group, stock]: [string, any]) => {
                          const status = getBloodStatus(stock.units, stock.capacity);
                          const percentage = (stock.units / stock.capacity) * 100;
                          
                          return (
                            <div key={group} className="text-center">
                              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-inner">
                                {/* Liquid wave animation */}
                                <div
                                  className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                                  style={{
                                    height: `${percentage}%`,
                                  }}
                                >
                                  {/* Main liquid fill */}
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      background: status === 'critical' 
                                        ? 'linear-gradient(to top, #dc2626, #ef4444)'
                                        : status === 'low'
                                        ? 'linear-gradient(to top, #d97706, #f59e0b)'
                                        : 'linear-gradient(to top, #16a34a, #22c55e)',
                                    }}
                                  />
                                  
                                  {/* Animated wave effect */}
                                  <svg
                                    className="absolute top-0 left-0 w-full"
                                    style={{
                                      height: '20px',
                                      transform: 'translateY(-10px)',
                                    }}
                                    viewBox="0 0 100 20"
                                    preserveAspectRatio="none"
                                  >
                                    <defs>
                                      <linearGradient id={`gradient-${group}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" style={{ 
                                          stopColor: status === 'critical' ? '#ef4444' : status === 'low' ? '#f59e0b' : '#22c55e',
                                          stopOpacity: 0.8 
                                        }} />
                                        <stop offset="100%" style={{ 
                                          stopColor: status === 'critical' ? '#dc2626' : status === 'low' ? '#d97706' : '#16a34a',
                                          stopOpacity: 1 
                                        }} />
                                      </linearGradient>
                                    </defs>
                                    <path
                                      fill={`url(#gradient-${group})`}
                                      d="M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z"
                                    >
                                      <animate
                                        attributeName="d"
                                        dur="3s"
                                        repeatCount="indefinite"
                                        values="
                                          M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z;
                                          M0,10 Q25,20 50,10 T100,10 L100,20 L0,20 Z;
                                          M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z
                                        "
                                      />
                                    </path>
                                  </svg>
                                  
                                  {/* Second wave for depth */}
                                  <svg
                                    className="absolute top-0 left-0 w-full opacity-50"
                                    style={{
                                      height: '20px',
                                      transform: 'translateY(-5px)',
                                    }}
                                    viewBox="0 0 100 20"
                                    preserveAspectRatio="none"
                                  >
                                    <path
                                      fill={status === 'critical' ? '#fca5a5' : status === 'low' ? '#fbbf24' : '#86efac'}
                                      d="M0,10 Q25,5 50,10 T100,10 L100,20 L0,20 Z"
                                    >
                                      <animate
                                        attributeName="d"
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                        values="
                                          M0,10 Q25,5 50,10 T100,10 L100,20 L0,20 Z;
                                          M0,10 Q25,15 50,10 T100,10 L100,20 L0,20 Z;
                                          M0,10 Q25,5 50,10 T100,10 L100,20 L0,20 Z
                                        "
                                      />
                                    </path>
                                  </svg>
                                  
                                  {/* Bubbles effect */}
                                  {percentage > 10 && (
                                    <>
                                      <div
                                        className="absolute rounded-full bg-white opacity-20"
                                        style={{
                                          width: '6px',
                                          height: '6px',
                                          left: '20%',
                                          bottom: '20%',
                                          animation: 'bubble-rise 4s infinite ease-in',
                                          animationDelay: '0s',
                                        }}
                                      />
                                      <div
                                        className="absolute rounded-full bg-white opacity-20"
                                        style={{
                                          width: '4px',
                                          height: '4px',
                                          left: '60%',
                                          bottom: '10%',
                                          animation: 'bubble-rise 5s infinite ease-in',
                                          animationDelay: '1s',
                                        }}
                                      />
                                      <div
                                        className="absolute rounded-full bg-white opacity-20"
                                        style={{
                                          width: '5px',
                                          height: '5px',
                                          left: '80%',
                                          bottom: '30%',
                                          animation: 'bubble-rise 4.5s infinite ease-in',
                                          animationDelay: '2s',
                                        }}
                                      />
                                    </>
                                  )}
                                </div>
                                
                                {/* Content overlay */}
                                <div className="relative z-10 h-full flex flex-col items-center justify-center">
                                  <span className="text-lg font-bold text-gray-800 drop-shadow-sm">{group}</span>
                                  <span className="text-xs text-gray-700 font-semibold drop-shadow-sm">{stock.units}/{stock.capacity}</span>
                                </div>
                              </div>
                              <div className="mt-1 text-xs font-medium" style={{
                                color: status === 'critical' ? '#dc2626' : status === 'low' ? '#d97706' : '#16a34a'
                              }}>
                                {Math.round(percentage)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Add bubble animation keyframes */}
                      <style>{`
                        @keyframes bubble-rise {
                          0% {
                            transform: translateY(0) scale(1);
                            opacity: 0.2;
                          }
                          50% {
                            opacity: 0.3;
                          }
                          100% {
                            transform: translateY(-100px) scale(0.5);
                            opacity: 0;
                          }
                        }
                      `}</style>
                      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-success rounded" />
                          <span className="text-gray-600">Good (50%+)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-warning rounded" />
                          <span className="text-gray-600">Low (20-49%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-error rounded" />
                          <span className="text-gray-600">Critical (&lt;20%)</span>
                        </div>
                      </div>
                      <div className="mt-3 text-center text-xs text-gray-400">
                        Last updated: {new Date(bloodInventory.lastUpdated).toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">No inventory data</div>
                  )}
                </CardContent>
              </Card>

              {/* Blood Camp Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-purple-500" />
                    My Donation Camps
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<PlusIcon className="w-4 h-4" />}
                    onClick={() => navigate('/hospital/camps')}
                  >
                    Manage
                  </Button>
                </CardHeader>
                <CardContent>
                  {campsLoading ? (
                    <div className="text-center py-6 text-gray-400 text-sm">Loading camps…</div>
                  ) : bloodCamps.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-500 mb-3">No blood camps submitted yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<PlusIcon className="w-4 h-4" />}
                        onClick={() => navigate('/hospital/camps')}
                      >
                        Submit a Blood Camp
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {bloodCamps.slice(0, 5).map((camp: any) => {
                        const statusMeta: Record<string, { color: string; label: string; icon: string }> = {
                          pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Pending', icon: '⏳' },
                          approved: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Approved', icon: '✅' },
                          rejected: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Rejected', icon: '❌' },
                          cancelled: { color: 'bg-gray-100 text-gray-500 border-gray-300', label: 'Cancelled', icon: '🚫' },
                          completed: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Completed', icon: '🏁' },
                        };
                        const meta = statusMeta[camp.status] || statusMeta.pending;
                        const dateStr = camp.startTime
                          ? new Date(camp.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'TBD';
                        
                        return (
                          <div key={camp._id} className={`p-3 rounded-xl border ${meta.color}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm">{camp.title}</p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                                {meta.icon} {meta.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs opacity-75 mt-1">
                              <span>📅 {dateStr}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Connected Donors */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Connected Donors</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge>{connectedDonorsCount}</Badge>
                    <button
                      onClick={() => {
                        console.log('[HospitalDashboard] Manual refresh triggered');
                        fetchConnectionStats();
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Refresh token data"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {connectedDonors.length > 0 ? (
                    <div className="space-y-2">
                      {connectedDonors.map((donor: any) => {
                        const tokensEarned = donorTokens[donor._id] || 0;
                        console.log(`[HospitalDashboard] Rendering donor ${donor.name} (${donor._id}): ${tokensEarned} tokens`);
                        
                        return (
                          <div key={donor._id} className="p-3 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-gray-50 transition-all">
                            <div className="flex items-start gap-3">
                              {donor.avatar ? (
                                <img src={donor.avatar} alt={donor.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm border-2 border-gray-200">
                                  {donor.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{donor.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {donor.bloodGroup && (
                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                      {donor.bloodGroup}
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded flex items-center gap-1">
                                    <TrophyIcon className="w-3 h-3" />
                                    {tokensEarned} tokens
                                  </span>
                                </div>
                                {donor.municipality && (
                                  <p className="text-xs text-gray-500 truncate mt-1">
                                    📍 {donor.municipality}
                                  </p>
                                )}
                                <Button
                                  size="sm"
                                  variant={tokensEarned >= 10 ? "primary" : "outline"}
                                  disabled={tokensEarned < 10}
                                  onClick={() => handleRedeemTokens(donor._id, donor.name)}
                                  className="mt-2 w-full text-xs"
                                  leftIcon={<TrophyIcon className="w-3 h-3" />}
                                >
                                  {tokensEarned >= 10 ? 'Redeem 10 Tokens' : `Need ${10 - tokensEarned} more`}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {connectedDonorsCount > 5 && (
                        <p className="text-xs text-center text-gray-500 pt-2">
                          +{connectedDonorsCount - 5} more donor{connectedDonorsCount - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">
                      No connected donors yet
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button variant="outline" fullWidth onClick={() => navigate('/hospital/donors')}>
                    View All Donors
                  </Button>
                  {pendingRequestsCount > 0 && (
                    <Button
                      variant="primary"
                      fullWidth
                      leftIcon={<UserPlusIcon className="w-4 h-4" />}
                      onClick={() => navigate('/hospital/connection-requests')}
                    >
                      {pendingRequestsCount} Pending Request{pendingRequestsCount !== 1 ? 's' : ''}
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<MessageCircleIcon className="w-4 h-4" />}
                    onClick={() => navigate('/hospital/chat')}
                  >
                    Messages
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<PlusIcon className="w-4 h-4" />}
                    onClick={() => navigate('/hospital/camps')}
                  >
                    Create Donation Camp
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Update Inventory Modal */}
      <Modal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        title="Update Blood Inventory"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Update the current stock and capacity for each blood group. Capacity is the maximum units you can store.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {bloodGroups.map(({ value: group }) => {
              const currentStock = bloodInventory?.inventory[group as keyof typeof bloodInventory.inventory];
              const formValues = inventoryForm[group] || { units: '0', capacity: '50' };
              
              return (
                <div key={group} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-lg mb-3 text-primary">{group}</h4>
                  <div className="space-y-3">
                    <Input
                      label="Current Units"
                      type="number"
                      min="0"
                      max={formValues.capacity}
                      value={formValues.units}
                      onChange={(e) => handleInventoryFormChange(group, 'units', e.target.value)}
                    />
                    <Input
                      label="Max Capacity"
                      type="number"
                      min="1"
                      value={formValues.capacity}
                      onChange={(e) => handleInventoryFormChange(group, 'capacity', e.target.value)}
                    />
                    {currentStock && (
                      <div className="text-xs text-gray-500">
                        Current: {currentStock.units}/{currentStock.capacity} units
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowInventoryModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdateInventory} className="flex-1">
              Update Inventory
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={handleNotificationClose} 
      />
    </div>
  );
}

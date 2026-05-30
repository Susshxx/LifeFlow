import React, { useState, useEffect } from 'react';
import { UsersIcon, BuildingIcon, CalendarIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon, ClockIcon, BarChart3Icon, BellIcon, SearchIcon, FilterIcon, MoreVerticalIcon, TrendingUpIcon, AlertTriangleIcon, MenuIcon } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { StatsCard } from '../components/features/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [pendingCamps, setPendingCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // User/Hospital verification states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showRejectUserModal, setShowRejectUserModal] = useState(false);
  const [userRejectionReason, setUserRejectionReason] = useState('');
  const [verifyingUser, setVerifyingUser] = useState(false);
  
  // Notification states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationRecipients, setNotificationRecipients] = useState<'users' | 'hospitals' | 'all'>('all');
  const [sendingNotification, setSendingNotification] = useState(false);
  
  // Real data states
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalHospitals, setTotalHospitals] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [pendingHospitalsCount, setPendingHospitalsCount] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalBloodRequests, setTotalBloodRequests] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Detailed user and hospital data
  const [usersList, setUsersList] = useState<any[]>([]);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [pendingUsersList, setPendingUsersList] = useState<any[]>([]);
  const [pendingHospitalsList, setPendingHospitalsList] = useState<any[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      setStatsLoading(true);
      try {
        console.log('[AdminDashboard] Fetching dashboard statistics...');

        // Fetch all users
        const usersRes = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersRes.ok) {
          const users = await usersRes.json();
          const usersList = users.filter((u: any) => u.role === 'user');
          const hospitalsList = users.filter((u: any) => u.role === 'hospital');
          
          setTotalUsers(usersList.length);
          setTotalHospitals(hospitalsList.length);
          setUsersList(usersList);
          setHospitalsList(hospitalsList);
          
          // Count pending users/hospitals (if there's a verified field)
          const pendingUsers = usersList.filter((u: any) => u.verified === false || u.verified === undefined);
          const pendingHospitals = hospitalsList.filter((h: any) => h.verified === false || h.verified === undefined);
          
          setPendingUsersCount(pendingUsers.length);
          setPendingHospitalsCount(pendingHospitals.length);
          setPendingUsersList(pendingUsers);
          setPendingHospitalsList(pendingHospitals);
          
          console.log('[AdminDashboard] Users:', usersList.length, 'Hospitals:', hospitalsList.length);
          console.log('[AdminDashboard] Pending Users:', pendingUsers.length, 'Pending Hospitals:', pendingHospitals.length);
        }

        // Fetch blood requests
        const requestsRes = await fetch(`${API}/api/blood-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (requestsRes.ok) {
          const requests = await requestsRes.json();
          setTotalBloodRequests(requests.length);
          console.log('[AdminDashboard] Blood requests:', requests.length);
        }

        // Fetch donation history
        const donationsRes = await fetch(`${API}/api/donation-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (donationsRes.ok) {
          const donations = await donationsRes.json();
          setTotalDonations(donations.length);
          console.log('[AdminDashboard] Total donations:', donations.length);
        }

      } catch (err) {
        console.error('[AdminDashboard] Failed to fetch statistics:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pending blood camps
  useEffect(() => {
    const fetchPendingCamps = async () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      try {
        const res = await fetch(`${API}/api/blood-camps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPendingCamps(data.filter((camp: any) => camp.status === 'pending'));
        }
      } catch (err) {
        console.error('Failed to fetch camps:', err);
      }
    };

    fetchPendingCamps();
    const interval = setInterval(fetchPendingCamps, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveCamp = async (campId: string) => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/blood-camps/${campId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (res.ok) {
        showToast('Blood camp approved successfully!', 'success');
        setPendingCamps(prev => prev.filter(c => c._id !== campId));
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to approve camp', 'error');
      }
    } catch (err) {
      console.error('Approve camp error:', err);
      showToast('Failed to approve camp', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCamp = async () => {
    if (!selectedCamp || !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    const token = localStorage.getItem('lf_token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/blood-camps/${selectedCamp._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (res.ok) {
        showToast('Blood camp rejected', 'success');
        setPendingCamps(prev => prev.filter(c => c._id !== selectedCamp._id));
        setShowRejectModal(false);
        setSelectedCamp(null);
        setRejectionReason('');
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to reject camp', 'error');
      }
    } catch (err) {
      console.error('Reject camp error:', err);
      showToast('Failed to reject camp', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (camp: any) => {
    setSelectedCamp(camp);
    setShowRejectModal(true);
  };

  const openDetailsModal = (camp: any) => {
    setSelectedCamp(camp);
    setShowDetailsModal(true);
  };

  // User/Hospital verification handlers
  const handleVerifyUser = async (userId: string, isHospital: boolean = false) => {
    const confirmed = window.confirm(
      `Are you sure you want to verify this ${isHospital ? 'hospital' : 'user'}? This will grant them full access to the platform.`
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('lf_token');
    if (!token) return;

    setVerifyingUser(true);
    try {
      const res = await fetch(`${API}/api/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verified: true }),
      });

      if (res.ok) {
        showToast(`${isHospital ? 'Hospital' : 'User'} verified successfully!`, 'success');
        
        // Refresh the lists
        if (isHospital) {
          setHospitalsList(prev => prev.map(h => 
            h._id === userId ? { ...h, verified: true } : h
          ));
        } else {
          setUsersList(prev => prev.map(u => 
            u._id === userId ? { ...u, verified: true } : u
          ));
        }
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to verify', 'error');
      }
    } catch (err) {
      console.error('Verify user error:', err);
      showToast('Failed to verify. Please try again.', 'error');
    } finally {
      setVerifyingUser(false);
    }
  };

  const openRejectUserModal = (user: any) => {
    setSelectedUser(user);
    setShowRejectUserModal(true);
  };

  const handleRejectUser = async () => {
    if (!selectedUser || !userRejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    const token = localStorage.getItem('lf_token');
    if (!token) return;

    setVerifyingUser(true);
    try {
      const res = await fetch(`${API}/api/users/${selectedUser._id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verified: false,
          rejectionReason: userRejectionReason.trim(),
        }),
      });

      if (res.ok) {
        const isHospital = selectedUser.role === 'hospital';
        showToast(`${isHospital ? 'Hospital' : 'User'} rejected`, 'success');
        
        // Remove from list or mark as rejected
        if (isHospital) {
          setHospitalsList(prev => prev.filter(h => h._id !== selectedUser._id));
        } else {
          setUsersList(prev => prev.filter(u => u._id !== selectedUser._id));
        }
        
        setShowRejectUserModal(false);
        setSelectedUser(null);
        setUserRejectionReason('');
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to reject', 'error');
      }
    } catch (err) {
      console.error('Reject user error:', err);
      showToast('Failed to reject. Please try again.', 'error');
    } finally {
      setVerifyingUser(false);
    }
  };

  const openUserProfileModal = (user: any) => {
    setSelectedUser(user);
    setShowUserProfileModal(true);
  };

  // ── Notification handlers ──────────────────────────────────────────────────
  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      showToast('Please provide both title and message', 'error');
      return;
    }

    const token = localStorage.getItem('lf_token');
    if (!token) return;

    setSendingNotification(true);
    try {
      const res = await fetch(`${API}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
          recipients: notificationRecipients,
        }),
      });

      if (res.ok) {
        showToast('Notification sent successfully!', 'success');
        setShowNotificationModal(false);
        setNotificationTitle('');
        setNotificationMessage('');
        setNotificationRecipients('all');
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to send notification', 'error');
      }
    } catch (err) {
      console.error('Send notification error:', err);
      showToast('Failed to send notification', 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  const stats = [{
    title: 'Pending Users',
    value: statsLoading ? '...' : pendingUsersCount.toString(),
    subtitle: 'Users',
    icon: <UsersIcon className="w-6 h-6" />,
    variant: 'warning' as const
  }, {
    title: 'Pending Hospitals',
    value: statsLoading ? '...' : pendingHospitalsCount.toString(),
    subtitle: 'Verified Hospitals',
    icon: <BuildingIcon className="w-6 h-6" />,
    variant: 'warning' as const
  }, {
    title: 'Camp Approvals',
    value: pendingCamps.length.toString(),
    subtitle: 'Pending review',
    icon: <CalendarIcon className="w-6 h-6" />,
    variant: 'primary' as const
  }, {
    title: 'Total Users',
    value: statsLoading ? '...' : `${totalUsers + totalHospitals}`,
    subtitle: `${totalUsers} Donors • ${totalHospitals} hospitals`,
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    variant: 'success' as const
  }];

  const analyticsData = [
    {
      label: 'Total Donors',
      value: statsLoading ? '...' : totalUsers.toLocaleString(),
      change: '+0%'
    },
    {
      label: 'Total Hospitals',
      value: statsLoading ? '...' : totalHospitals.toLocaleString(),
      change: '+0%'
    },
    {
      label: 'Blood Donations',
      value: statsLoading ? '...' : totalDonations.toLocaleString(),
      change: '+0%'
    },
    {
      label: 'Active Requests',
      value: statsLoading ? '...' : totalBloodRequests.toLocaleString(),
      change: '+0%'
    },
    {
      label: 'Pending Camps',
      value: pendingCamps.length.toLocaleString(),
      change: '+0%'
    }
  ];

  const tabs = [{
    id: 'users',
    label: 'Users',
    icon: <UsersIcon className="w-4 h-4" />
  }, {
    id: 'hospitals',
    label: 'Hospitals',
    icon: <BuildingIcon className="w-4 h-4" />
  }, {
    id: 'camps',
    label: 'Camps',
    icon: <CalendarIcon className="w-4 h-4" />
  }];
  return <div className="min-h-screen bg-gray-900">
      <Sidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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

      <main className="flex-1 min-w-0 lg:ml-64">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-700 rounded-lg"
                aria-label="Open menu"
              >
                <MenuIcon className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-400">
                  System administration and verification
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="primary" 
                leftIcon={<BellIcon className="w-4 h-4" />}
                onClick={() => setShowNotificationModal(true)}
              >
                Send Notification
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(stat => <div key={stat.title} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">
                      {stat.title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                      {(stat as any).trend && (
                        <span className="text-sm font-medium text-success">
                          +{(stat as any).trend.value}%
                        </span>
                      )}
                    </div>
                    {stat.subtitle && <p className="mt-1 text-sm text-gray-500">
                        {stat.subtitle}
                      </p>}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.variant}/20`}>
                    <span className={`text-${stat.variant}`}>{stat.icon}</span>
                  </div>
                </div>
              </div>)}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - Verification Queue */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-heading font-semibold text-white">
                      Verification Queue
                    </h2>
                    {/* <div className="flex items-center gap-2">
                      <Input placeholder="Search..." size="sm" leftIcon={<SearchIcon className="w-4 h-4" />} className="w-48 bg-gray-700 border-gray-600 text-white" />
                      <Button variant="ghost" size="sm" className="text-gray-400">
                        <FilterIcon className="w-4 h-4" />
                      </Button>
                    </div> */}
                  </div>
                  <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                <div className="p-4">
                  {/* Users Tab */}
                  <TabPanel id="users" activeTab={activeTab}>
                    <div className="space-y-3">
                      {statsLoading ? (
                        <div className="text-center py-8 text-white-400">
                          Loading users...
                        </div>
                      ) : usersList.length === 0 ? (
                        <div className="text-center py-8 text-white-400">
                          No users found
                        </div>
                      ) : (
                        // Sort: unverified first, then verified
                        [...usersList]
                          .sort((a, b) => {
                            const aVerified = a.verified === true;
                            const bVerified = b.verified === true;
                            if (aVerified === bVerified) return 0;
                            return aVerified ? 1 : -1; // Unverified first
                          })
                          .slice(0, 20)
                          .map(user => {
                            const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
                            const isPending = user.verified !== true;
                            
                            return (
                              <div key={user._id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <Avatar name={user.name} size="md" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-white">
                                        {user.name}
                                      </p>
                                      {isPending ? (
                                        <Badge variant="warning" size="sm">
                                          Pending
                                        </Badge>
                                      ) : (
                                        <Badge variant="success" size="sm">
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      {user.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {user.bloodGroup && (
                                        <Badge variant="primary" size="sm">
                                          {user.bloodGroup}
                                        </Badge>
                                      )}
                                      {user.municipality && (
                                        <span className="text-xs text-gray-500">
                                          {user.municipality}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        • Joined {createdDate}
                                      </span>
                                      {user.tokens !== undefined && (
                                        <span className="text-xs text-yellow-400">
                                          • {user.tokens} tokens
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-white hover:text-black hover:bg-error/10"
                                    onClick={() => openUserProfileModal(user)}
                                  >
                                    View Profile
                                  </Button>
                                  {isPending && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:bg-error/10"
                                        onClick={() => openRejectUserModal(user)}
                                        disabled={verifyingUser}
                                        title="Reject user"
                                      >
                                        <XCircleIcon className="w-4 h-4 text-red-500" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-success hover:bg-success/10"
                                        onClick={() => handleVerifyUser(user._id, false)}
                                        disabled={verifyingUser}
                                        title="Verify user"
                                      >
                                        <CheckCircleIcon className="w-4 h-4" />
                                        
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                      {!statsLoading && usersList.length > 20 && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          Showing 20 of {usersList.length} users
                        </div>
                      )}
                    </div>
                  </TabPanel>

                  {/* Hospitals Tab */}
                  <TabPanel id="hospitals" activeTab={activeTab}>
                    <div className="space-y-3">
                      {statsLoading ? (
                        <div className="text-center py-8 text-gray-400">
                          Loading hospitals...
                        </div>
                      ) : hospitalsList.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          No hospitals found
                        </div>
                      ) : (
                        // Sort: unverified first, then verified
                        [...hospitalsList]
                          .sort((a, b) => {
                            const aVerified = a.verified === true;
                            const bVerified = b.verified === true;
                            if (aVerified === bVerified) return 0;
                            return aVerified ? 1 : -1; // Unverified first
                          })
                          .slice(0, 20)
                          .map(hospital => {
                            const createdDate = hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : 'N/A';
                            const isPending = hospital.verified !== true;
                            const hospitalName = hospital.hospitalName || hospital.name;
                            
                            return (
                              <div key={hospital._id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                                    <BuildingIcon className="w-5 h-5 text-gray-300" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-white">
                                        {hospitalName}
                                      </p>
                                      {isPending ? (
                                        <Badge variant="warning" size="sm">
                                          Pending
                                        </Badge>
                                      ) : (
                                        <Badge variant="success" size="sm">
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      {hospital.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {hospital.municipality && (
                                        <span className="text-xs text-gray-500">
                                          {hospital.municipality}
                                        </span>
                                      )}
                                      {hospital.province && (
                                        <span className="text-xs text-gray-500">
                                          • {hospital.province}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        • Joined {createdDate}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-white hover:text-black hover:bg-error/10"
                                    onClick={() => openUserProfileModal(hospital)}
                                  >
                                    View Profile
                                  </Button>
                                  {isPending && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:bg-error/10"
                                        onClick={() => openRejectUserModal(hospital)}
                                        disabled={verifyingUser}
                                        title="Reject hospital"
                                      >
                                        <XCircleIcon className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-success hover:bg-success/10"
                                        onClick={() => handleVerifyUser(hospital._id, true)}
                                        disabled={verifyingUser}
                                        title="Verify hospital"
                                      >
                                        <CheckCircleIcon className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                      {!statsLoading && hospitalsList.length > 20 && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          Showing 20 of {hospitalsList.length} hospitals
                        </div>
                      )}
                    </div>
                  </TabPanel>

                  {/* Camps Tab */}
                  <TabPanel id="camps" activeTab={activeTab}>
                    <div className="space-y-3">
                      {pendingCamps.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          No pending blood camp requests
                        </div>
                      ) : (
                        pendingCamps.map(camp => {
                          const hospitalName = camp.hospitalId?.hospitalName || camp.hospitalId?.name || 'Unknown Hospital';
                          const locationLabel = typeof camp.location === 'object' ? camp.location.label : camp.location || 'Unknown';
                          const startDate = camp.startTime ? new Date(camp.startTime).toLocaleDateString() : 'TBD';
                          
                          return (
                            <div key={camp._id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                                  <CalendarIcon className="w-5 h-5 text-gray-300" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">
                                    {camp.title}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    By: {hospitalName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {startDate}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      • {locationLabel}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      • {camp.expectedDonors} donors expected
                                    </span>
                                  </div>
                                  {camp.description && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {camp.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   className="text-blue-400 hover:bg-blue-500/10"
                                   onClick={() => openDetailsModal(camp)}
                                 >
                                   View Details
                                 </Button>
                                 <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-error hover:bg-error/10"
                                  onClick={() => openRejectModal(camp)}
                                  disabled={loading}
                                >
                                  Reject
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-success hover:bg-success/10"
                                  onClick={() => handleApproveCamp(camp._id)}
                                  disabled={loading}
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabPanel>
                </div>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-8">
              {/* Analytics Summary */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-lg font-heading font-semibold text-white mb-4">
                  System Overview
                </h3>
                <div className="space-y-4">
                  {analyticsData.map(item => <div key={item.label} className="flex items-center justify-between">
                      <span className="text-gray-400">{item.label}</span>
                      <div className="text-right">
                        <p className="font-semibold text-white">{item.value}</p>
                        <p className="text-xs text-success">{item.change}</p>
                      </div>
                    </div>)}
                </div>
                <Button variant="outline" fullWidth className="mt-6 border-gray-600 text-gray-300 hover:bg-gray-700">
                  View Full Report
                </Button>
              </div>

              {/* Recent Alerts */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-lg font-heading font-semibold text-white mb-4">
                  System Alerts
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-error/10 rounded-lg border border-error/20">
                    <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-error">
                        High Traffic Warning
                      </p>
                      <p className="text-xs text-gray-400">
                        Server load at 85%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <ClockIcon className="w-5 h-5 text-warning flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-warning">
                        Backup Pending
                      </p>
                      <p className="text-xs text-gray-400">
                        Scheduled for 2:00 AM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Modal */}
        {showRejectModal && selectedCamp && (
          <Modal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setSelectedCamp(null);
              setRejectionReason('');
            }}
            title="Reject Blood Camp Request"
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Camp: <span className="font-semibold">{selectedCamp.title}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Hospital: <span className="font-semibold">
                    {selectedCamp.hospitalId?.hospitalName || selectedCamp.hospitalId?.name || 'Unknown'}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedCamp(null);
                    setRejectionReason('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleRejectCamp}
                  isLoading={loading}
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Camp Details Modal */}
        {showDetailsModal && selectedCamp && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedCamp(null);
            }}
            title="Blood Camp Verification Details"
            size="lg"
          >
            <div className="space-y-5">
              {/* Camp header */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedCamp.title}</h3>
                <p className="text-sm text-gray-600">{selectedCamp.description || 'No description provided'}</p>
                <div className="mt-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    ⏳ Pending Admin Approval
                  </span>
                </div>
              </div>

              {/* Hospital Info */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Hospital Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Hospital Name</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {selectedCamp.hospitalId?.hospitalName || selectedCamp.hospitalId?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Contact Email</p>
                    <p className="font-semibold text-gray-900 text-sm break-all">
                      {selectedCamp.hospitalId?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Schedule</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Start Date & Time</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {selectedCamp.startTime
                        ? new Date(selectedCamp.startTime).toLocaleString('en-US', {
                            weekday: 'short', year: 'numeric', month: 'short',
                            day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })
                        : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedCamp.duration} hours</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Estimated End Time</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {selectedCamp.startTime
                        ? new Date(new Date(selectedCamp.startTime).getTime() + selectedCamp.duration * 3600000)
                            .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Submitted On</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {selectedCamp.createdAt ? new Date(selectedCamp.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Donor Requirements */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Donor Requirements</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Expected Donors</p>
                    <p className="font-bold text-gray-900 text-xl">{selectedCamp.expectedDonors}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Blood Groups Needed</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {(selectedCamp.bloodGroups || ['All']).map((bg: string) => (
                        <span key={bg} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{bg}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Location</h4>
                <p className="font-semibold text-gray-900 text-sm mb-2">
                  {typeof selectedCamp.location === 'object'
                    ? selectedCamp.location.label
                    : selectedCamp.location || 'Unknown'}
                </p>
                {typeof selectedCamp.location === 'object' && (
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-gray-500 font-mono">
                      {selectedCamp.location.lat?.toFixed(5)}, {selectedCamp.location.lng?.toFixed(5)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${selectedCamp.location.lat},${selectedCamp.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    openRejectModal(selectedCamp);
                  }}
                  disabled={loading}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  Reject Camp
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleApproveCamp(selectedCamp._id);
                  }}
                  disabled={loading}
                  isLoading={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  ✓ Approve Camp
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* User/Hospital Profile Modal */}
        {showUserProfileModal && selectedUser && (
          <Modal
            isOpen={showUserProfileModal}
            onClose={() => {
              setShowUserProfileModal(false);
              setSelectedUser(null);
            }}
            title={`${selectedUser.role === 'hospital' ? 'Hospital' : 'User'} Profile`}
            size="lg"
          >
            <div className="space-y-5">
              {/* Profile Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  {selectedUser.role === 'hospital' ? (
                    <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                      <BuildingIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  ) : (
                    <Avatar name={selectedUser.name} size="lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedUser.role === 'hospital' 
                        ? (selectedUser.hospitalName || selectedUser.name)
                        : selectedUser.name}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    <div className="mt-2">
                      {selectedUser.verified === true ? (
                        <Badge variant="success" size="sm">✓ Verified</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">⏳ Pending Verification</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 text-sm break-all">
                      {selectedUser.email}
                    </p>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Phone</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {selectedUser.phone}
                      </p>
                    </div>
                  )}
                  {selectedUser.bloodGroup && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Blood Group</p>
                      <Badge variant="primary">{selectedUser.bloodGroup}</Badge>
                    </div>
                  )}
                  {selectedUser.tokens !== undefined && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Token Balance</p>
                      <p className="font-semibold text-yellow-600 text-sm">
                        {selectedUser.tokens} tokens
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Location
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedUser.province && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Province</p>
                      <p className="font-semibold text-gray-900 text-sm capitalize">
                        {selectedUser.province}
                      </p>
                    </div>
                  )}
                  {selectedUser.district && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">District</p>
                      <p className="font-semibold text-gray-900 text-sm capitalize">
                        {selectedUser.district}
                      </p>
                    </div>
                  )}
                  {selectedUser.municipality && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Municipality</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {selectedUser.municipality}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Account Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Role</p>
                    <Badge>{selectedUser.role === 'hospital' ? 'Hospital' : 'Donor'}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Joined Date</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {selectedUser.createdAt 
                        ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedUser.verified !== true && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    fullWidth
                    variant="outline"
                    className="border-error text-error hover:bg-error/10"
                    onClick={() => {
                      setShowUserProfileModal(false);
                      openRejectUserModal(selectedUser);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    fullWidth
                    variant="primary"
                    className="bg-success hover:bg-success/90"
                    onClick={() => {
                      setShowUserProfileModal(false);
                      handleVerifyUser(selectedUser._id, selectedUser.role === 'hospital');
                    }}
                  >
                    Verify {selectedUser.role === 'hospital' ? 'Hospital' : 'User'}
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Reject User/Hospital Modal */}
        {showRejectUserModal && selectedUser && (
          <Modal
            isOpen={showRejectUserModal}
            onClose={() => {
              setShowRejectUserModal(false);
              setSelectedUser(null);
              setUserRejectionReason('');
            }}
            title={`Reject ${selectedUser.role === 'hospital' ? 'Hospital' : 'User'}`}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedUser.role === 'hospital' ? 'Hospital' : 'User'}: <span className="font-semibold">
                    {selectedUser.role === 'hospital' 
                      ? (selectedUser.hospitalName || selectedUser.name)
                      : selectedUser.name}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Email: <span className="font-semibold">{selectedUser.email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Please provide a reason for rejection..."
                  value={userRejectionReason}
                  onChange={(e) => setUserRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => {
                    setShowRejectUserModal(false);
                    setSelectedUser(null);
                    setUserRejectionReason('');
                  }}
                  disabled={verifyingUser}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="primary"
                  className="bg-error hover:bg-error/90"
                  onClick={handleRejectUser}
                  isLoading={verifyingUser}
                  disabled={!userRejectionReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Send Notification Modal */}
        {showNotificationModal && (
          <Modal
            isOpen={showNotificationModal}
            onClose={() => {
              setShowNotificationModal(false);
              setNotificationTitle('');
              setNotificationMessage('');
              setNotificationRecipients('all');
            }}
            title="Send Notification"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter notification title..."
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Enter notification message..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Send To <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setNotificationRecipients('users')}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      notificationRecipients === 'users'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Users Only
                  </button>
                  <button
                    onClick={() => setNotificationRecipients('hospitals')}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      notificationRecipients === 'hospitals'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Hospitals Only
                  </button>
                  <button
                    onClick={() => setNotificationRecipients('all')}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      notificationRecipients === 'all'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Everyone
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {notificationRecipients === 'users' && 'Notification will be sent to all blood donors'}
                  {notificationRecipients === 'hospitals' && 'Notification will be sent to all hospitals'}
                  {notificationRecipients === 'all' && 'Notification will be sent to all users and hospitals'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationTitle('');
                    setNotificationMessage('');
                    setNotificationRecipients('all');
                  }}
                  disabled={sendingNotification}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={handleSendNotification}
                  isLoading={sendingNotification}
                  disabled={!notificationTitle.trim() || !notificationMessage.trim()}
                >
                  Send Notification
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>;
}
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

// Dummy data removed - fetch from API instead
const pendingUsers: any[] = [];
const pendingHospitals: any[] = [];
const analyticsData: any[] = [];
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

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  const stats = [{
    title: 'Pending Users',
    value: '12',
    subtitle: 'Awaiting verification',
    icon: <UsersIcon className="w-6 h-6" />,
    variant: 'warning' as const
  }, {
    title: 'Pending Hospitals',
    value: '4',
    subtitle: 'Awaiting verification',
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
    value: '25,432',
    subtitle: '+523 this month',
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    variant: 'success' as const,
    trend: {
      value: 12,
      isPositive: true
    }
  }];

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
  return <div className="min-h-screen bg-gray-900 flex">
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

      <main className="flex-1 min-w-0">
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
              <button
                onClick={() => window.location.href = '/'}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="Back to home"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
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
              <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
                <BellIcon className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>
              <Button variant="primary" leftIcon={<BellIcon className="w-4 h-4" />}>
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
                      {stat.trend && <span className="text-sm font-medium text-success">
                          +{stat.trend.value}%
                        </span>}
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
                    <div className="flex items-center gap-2">
                      <Input placeholder="Search..." size="sm" leftIcon={<SearchIcon className="w-4 h-4" />} className="w-48 bg-gray-700 border-gray-600 text-white" />
                      <Button variant="ghost" size="sm" className="text-gray-400">
                        <FilterIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                <div className="p-4">
                  {/* Users Tab */}
                  <TabPanel id="users" activeTab={activeTab}>
                    <div className="space-y-3">
                      {pendingUsers.map(user => <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar name={user.name} size="md" />
                            <div>
                              <p className="font-medium text-white">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="primary" size="sm">
                                  {user.bloodGroup}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {user.location}
                                </span>
                                <span className="text-xs text-gray-500">
                                  • {user.submittedAt}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-400">
                              View Docs ({user.documents})
                            </Button>
                            <Button variant="ghost" size="sm" className="text-error hover:bg-error/10">
                              <XCircleIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-success hover:bg-success/10">
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                  </TabPanel>

                  {/* Hospitals Tab */}
                  <TabPanel id="hospitals" activeTab={activeTab}>
                    <div className="space-y-3">
                      {pendingHospitals.map(hospital => <div key={hospital.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                              <BuildingIcon className="w-5 h-5 text-gray-300" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {hospital.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                Reg: {hospital.regNumber}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {hospital.location}
                                </span>
                                <span className="text-xs text-gray-500">
                                  • {hospital.submittedAt}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-400">
                              View Docs ({hospital.documents})
                            </Button>
                            <Button variant="ghost" size="sm" className="text-error hover:bg-error/10">
                              <XCircleIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-success hover:bg-success/10">
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>)}
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
      </main>
    </div>;
}
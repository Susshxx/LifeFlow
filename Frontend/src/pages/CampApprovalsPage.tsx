import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MenuIcon, CheckCircleIcon, XCircleIcon, MapPinIcon, UsersIcon, ClockIcon } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function CampApprovalsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCamps, setPendingCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [authError, setAuthError] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('lf_token');
    const userStr = localStorage.getItem('lf_user');
    
    if (!token || !userStr) {
      console.error('❌ No authentication found');
      showToast('Please log in to access this page', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('👤 Current user:', user.email, 'Role:', user.role);
      
      if (user.role !== 'admin') {
        console.error('❌ Access denied - admin role required');
        showToast('Access denied. Admin privileges required.', 'error');
        setTimeout(() => navigate('/'), 1500);
        return;
      }
      
      console.log('✅ Admin access confirmed, fetching camps...');
    } catch (err) {
      console.error('❌ Invalid user data');
      showToast('Invalid session data. Please log in again.', 'error');
      localStorage.removeItem('lf_token');
      localStorage.removeItem('lf_user');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    fetchPendingCamps();
    const interval = setInterval(fetchPendingCamps, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchPendingCamps = async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) {
      console.log('❌ No authentication token found');
      setAuthError(true);
      showToast('Session expired. Please log in again.', 'error');
      setTimeout(() => {
        localStorage.removeItem('lf_token');
        localStorage.removeItem('lf_user');
        navigate('/login');
      }, 2000);
      return;
    }

    console.log('🔑 Token exists, length:', token.length);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');

    try {
      console.log('📡 Fetching blood camps from:', `${API}/api/blood-camps`);
      const res = await fetch(`${API}/api/blood-camps`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('📡 Response status:', res.status);
      
      if (res.status === 401) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ 401 Error details:', errorData);
        console.error('❌ This means your JWT token is invalid or expired');
        console.error('❌ You need to log out and log in again to get a fresh token');
        setAuthError(true);
        showToast('Your session has expired. Redirecting to login...', 'error');
        setTimeout(() => {
          localStorage.removeItem('lf_token');
          localStorage.removeItem('lf_user');
          navigate('/login');
        }, 2000);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Successfully fetched camps from database:', data.length);
        setAuthError(false); // Clear auth error on success
        
        // Extract pending camps with full data
        const pending = data.filter((camp: any) => camp.status === 'pending');
        console.log('📋 Pending camps for verification:', pending.length);
        
        // Log extracted data for verification
        pending.forEach((camp: any, index: number) => {
          console.log(`Camp ${index + 1}:`, {
            id: camp._id,
            title: camp.title,
            hospital: camp.hospitalId?.hospitalName || camp.hospitalId?.name,
            location: camp.location?.label || camp.location,
            expectedDonors: camp.expectedDonors,
            bloodGroups: camp.bloodGroups,
            startTime: camp.startTime,
            duration: camp.duration,
          });
        });
        
        setPendingCamps(pending);
      } else {
        const error = await res.json();
        console.error('❌ Error fetching camps:', error);
        showToast(error.error || 'Failed to fetch blood camps', 'error');
      }
    } catch (err) {
      console.error('❌ Failed to fetch camps:', err);
      showToast('Failed to connect to server', 'error');
    }
  };

  const handleApproveCamp = async (campId: string) => {
    const token = localStorage.getItem('lf_token');
    if (!token) {
      showToast('Authentication required. Please log in again.', 'error');
      return;
    }

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

      if (res.status === 401) {
        showToast('Session expired. Please log out and log in again.', 'error');
        return;
      }

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
    if (!token) {
      showToast('Authentication required. Please log in again.', 'error');
      return;
    }

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

      if (res.status === 401) {
        showToast('Session expired. Please log out and log in again.', 'error');
        return;
      }

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

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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

      <main className="flex-1 min-w-0">
        <header className="bg-gray-800 border-b border-gray-700 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-700 rounded-lg"
              >
                <MenuIcon className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-white">Blood Camp Approvals</h1>
                <p className="text-gray-400">Review and approve blood donation camp requests</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="border-gray-600 text-gray-300">
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {authError && (
            <div className="mb-6 bg-red-900/50 border border-red-600 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-200 font-semibold mb-1">Authentication Error</h3>
                  <p className="text-red-300 text-sm mb-3">
                    Your session has expired or your authentication token is invalid. Please log out and log in again to continue.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        localStorage.removeItem('lf_token');
                        localStorage.removeItem('lf_user');
                        navigate('/login');
                      }}
                      className="border-red-400 text-red-200 hover:bg-red-800"
                    >
                      Go to Login
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAuthError(false)}
                      className="text-red-300 hover:bg-red-800"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Pending Requests ({pendingCamps.length})
              </h2>
            </div>

            {pendingCamps.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending blood camp requests</p>
                <p className="text-gray-500 text-sm mt-2">All requests have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCamps.map(camp => {
                  const hospitalName = camp.hospitalId?.hospitalName || camp.hospitalId?.name || 'Unknown Hospital';
                  const locationLabel = typeof camp.location === 'object' ? camp.location.label : camp.location || 'Unknown';
                  const startDate = camp.startTime ? new Date(camp.startTime).toLocaleDateString() : 'TBD';
                  const startTime = camp.startTime ? new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD';
                  const bloodGroups = camp.bloodGroups || ['All'];

                  return (
                    <div key={camp._id} className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">{camp.title}</h3>
                          <p className="text-gray-400 text-sm mb-3">{camp.description || 'No description provided'}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-gray-300">
                              <UsersIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">Hospital: {hospitalName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <CalendarIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{startDate} at {startTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <MapPinIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{locationLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <ClockIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">Duration: {camp.duration} hours</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <UsersIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">Expected: {camp.expectedDonors} donors</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <span className="text-sm">Blood Groups: </span>
                              <div className="flex gap-1">
                                {bloodGroups.map((bg: string) => (
                                  <Badge key={bg} variant="primary" size="sm">{bg}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-600">
                        <Button
                          variant="ghost"
                          onClick={() => openDetailsModal(camp)}
                          className="text-gray-300 hover:bg-gray-600"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openRejectModal(camp)}
                          disabled={loading}
                          className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10"
                          leftIcon={<XCircleIcon className="w-4 h-4" />}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleApproveCamp(camp._id)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
            <div className="space-y-6">
              {/* Camp Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedCamp.title}</h3>
                <p className="text-gray-700">{selectedCamp.description || 'No description provided'}</p>
              </div>

              {/* Hospital Information - Data extracted from database */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Hospital Information (From Database)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hospital Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedCamp.hospitalId?.hospitalName || selectedCamp.hospitalId?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Contact Email</p>
                    <p className="font-medium text-gray-900 break-all">{selectedCamp.hospitalId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hospital ID</p>
                    <p className="font-medium text-gray-900 font-mono text-xs">{selectedCamp.hospitalId?._id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedCamp.hospitalId?.phone || 'N/A'}</p>
                  </div>
                  {selectedCamp.hospitalId?.tempLocation && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Hospital Address</p>
                      <p className="font-medium text-gray-900">
                        {typeof selectedCamp.hospitalId.tempLocation === 'object' 
                          ? selectedCamp.hospitalId.tempLocation.label 
                          : selectedCamp.hospitalId.tempLocation}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Camp Schedule */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Schedule Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {selectedCamp.startTime ? new Date(selectedCamp.startTime).toLocaleString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                    <p className="font-medium text-gray-900">{selectedCamp.duration} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">End Time (Estimated)</p>
                    <p className="font-medium text-gray-900">
                      {selectedCamp.startTime ? new Date(
                        new Date(selectedCamp.startTime).getTime() + selectedCamp.duration * 60 * 60 * 1000
                      ).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Submitted On</p>
                    <p className="font-medium text-gray-900">
                      {selectedCamp.createdAt ? new Date(selectedCamp.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Donor Requirements */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Donor Requirements</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Expected Donors</p>
                    <p className="font-medium text-gray-900 text-lg">{selectedCamp.expectedDonors} donors</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Blood Groups Needed</p>
                    <div className="flex gap-1 flex-wrap">
                      {(selectedCamp.bloodGroups || ['All']).map((bg: string) => (
                        <Badge key={bg} variant="primary" size="sm">{bg}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Location Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="font-medium text-gray-900">
                      {typeof selectedCamp.location === 'object' 
                        ? selectedCamp.location.label 
                        : selectedCamp.location || 'Unknown'}
                    </p>
                  </div>
                  {typeof selectedCamp.location === 'object' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Latitude</p>
                          <p className="font-medium text-gray-900 font-mono text-sm">
                            {selectedCamp.location.lat?.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Longitude</p>
                          <p className="font-medium text-gray-900 font-mono text-sm">
                            {selectedCamp.location.lng?.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Location Type</p>
                        <Badge variant={selectedCamp.location.type === 'saved' ? 'success' : 'warning'} size="sm">
                          {selectedCamp.location.type === 'saved' ? 'Hospital Location' : 'Custom Location'}
                        </Badge>
                      </div>
                      <div>
                        <a
                          href={`https://www.google.com/maps?q=${selectedCamp.location.lat},${selectedCamp.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Database Information */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Database Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Camp ID</p>
                    <p className="font-medium text-gray-900 font-mono text-xs">{selectedCamp._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created At</p>
                    <p className="font-medium text-gray-900">
                      {selectedCamp.createdAt ? new Date(selectedCamp.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Updated At</p>
                    <p className="font-medium text-gray-900">
                      {selectedCamp.updatedAt ? new Date(selectedCamp.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Status</p>
                    <Badge variant="warning" size="sm">Pending Admin Approval</Badge>
                  </div>
                </div>
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
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  Reject Camp
                </Button>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleApproveCamp(selectedCamp._id);
                  }}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve Camp
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}

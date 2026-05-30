import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon, DropletIcon, PhoneIcon, MapPinIcon, MessageCircleIcon,
  SearchIcon, MenuIcon, TrophyIcon, BellIcon, SendIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ConnectedUser {
  _id: string;
  name: string;
  avatar?: string;
  bloodGroup?: string;
  phone?: string;
  municipality?: string;
  role: 'user' | 'hospital';
  tokens?: number;
}

interface Connection {
  _id: string;
  from: ConnectedUser;
  to: ConnectedUser;
  status: 'accepted';
  createdAt: string;
  updatedAt: string;
}

export function ConnectedDonorsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [donorTokens, setDonorTokens] = useState<Record<string, number>>({});
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);

  const me = (() => { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } })();
  const myId = me?.id || me?._id || '';
  const userRole = me?.role || 'user';

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      const response = await fetch(`${API}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: Connection[] = await response.json();
        setConnections(data);
        
        // Fetch tokens for all connected donors (only for hospitals)
        if (userRole === 'hospital') {
          const donorIds = data.map(conn => {
            const other = conn.from._id === myId ? conn.to : conn.from;
            return other._id;
          });
          
          if (donorIds.length > 0) {
            fetchDonorTokens(donorIds);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorTokens = async (donorIds: string[]) => {
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      console.log('[ConnectedDonors] Fetching tokens for donors:', donorIds);

      const response = await fetch(`${API}/api/donation-history/tokens-by-hospital`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ donorIds }),
      });

      if (response.ok) {
        const tokensData = await response.json();
        console.log('[ConnectedDonors] Received tokens data:', tokensData);
        setDonorTokens(tokensData);
      } else {
        console.error('[ConnectedDonors] Failed to fetch tokens:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch donor tokens:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    if (selectedDonors.length === 0) {
      alert('Please select at least one donor');
      return;
    }

    setSendingNotification(true);
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      // Find connections for selected donors
      const selectedConnections = connections.filter(conn => {
        const other = conn.from._id === myId ? conn.to : conn.from;
        return selectedDonors.includes(other._id);
      });

      console.log('Sending notification to connections:', selectedConnections.length);

      // Send message to each selected donor via their connection
      const promises = selectedConnections.map(conn => {
        console.log('Sending to connection:', conn._id);
        return fetch(`${API}/api/connections/${conn._id}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'text',
            content: `📢 Notification: ${notificationMessage}`,
          }),
        });
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      
      console.log(`Sent ${successCount}/${selectedConnections.length} notifications successfully`);
      
      alert(`Notification sent to ${successCount} donor(s)!`);
      setShowNotificationModal(false);
      setNotificationMessage('');
      setSelectedDonors([]);
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setSendingNotification(false);
    }
  };

  const toggleDonorSelection = (donorId: string) => {
    setSelectedDonors(prev => 
      prev.includes(donorId) 
        ? prev.filter(id => id !== donorId)
        : [...prev, donorId]
    );
  };

  const selectAllDonors = () => {
    const allDonorIds = filteredConnections.map(conn => {
      const other = conn.from._id === myId ? conn.to : conn.from;
      return other._id;
    });
    setSelectedDonors(allDonorIds);
  };

  const deselectAllDonors = () => {
    setSelectedDonors([]);
  };

  const handleMessage = (_userId: string) => {
    if (userRole === 'hospital') {
      navigate('/hospital/chat');
    } else {
      navigate('/dashboard/chat');
    }
  };

  // Filter connections
  const filteredConnections = connections.filter(conn => {
    const other = conn.from._id === myId ? conn.to : conn.from;
    
    const matchesSearch = !searchQuery || 
      other.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      other.municipality?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBloodGroup = !filterBloodGroup || other.bloodGroup === filterBloodGroup;

    return matchesSearch && matchesBloodGroup;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={userRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0 lg:ml-64">
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
                <h1 className="text-2xl font-heading font-bold text-gray-900">Connected Donors</h1>
                <p className="text-gray-600">Manage your donor connections</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userRole === 'hospital' && connections.length > 0 && (
                <Button 
                  variant="primary" 
                  leftIcon={<BellIcon className="w-4 h-4" />}
                  onClick={() => setShowNotificationModal(true)}
                >
                  Send Notification
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(userRole === 'hospital' ? '/hospital/dashboard' : '/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <Card className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <Select
                  options={[
                    { value: '', label: 'All Blood Groups' },
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                  ]}
                  value={filterBloodGroup}
                  onChange={(e) => setFilterBloodGroup(e.target.value)}
                  className="md:w-48"
                />
                {(searchQuery || filterBloodGroup) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterBloodGroup('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Connections</p>
                    <p className="text-2xl font-bold text-gray-900">{connections.length}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <DropletIcon className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Filtered Results</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredConnections.length}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <MessageCircleIcon className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Chats</p>
                    <p className="text-2xl font-bold text-gray-900">{connections.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Connections List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConnections.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {connections.length === 0 ? 'No connections yet' : 'No connections match your filters'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {connections.length === 0 
                      ? 'Connect with donors to start messaging'
                      : 'Try adjusting your search or filters'}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredConnections.map((conn) => {
                  const other = conn.from._id === myId ? conn.to : conn.from;
                  const tokens = donorTokens[other._id] || 0;
                  const isSelected = selectedDonors.includes(other._id);
                  
                  console.log(`[ConnectedDonors] Donor ${other.name} (${other._id}): ${tokens} tokens`);
                  
                  return (
                    <Card key={conn._id} className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                      {userRole === 'hospital' && (
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDonorSelection(other._id)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-600">Select for notification</span>
                          </label>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        {other.avatar ? (
                          <img
                            src={other.avatar}
                            alt={other.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                            {other.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{other.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {other.bloodGroup && (
                              <Badge variant="primary" className="text-xs">
                                <DropletIcon className="w-3 h-3 mr-1" />
                                {other.bloodGroup}
                              </Badge>
                            )}
                            {userRole === 'hospital' && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                <TrophyIcon className="w-3 h-3 mr-1" />
                                {tokens} tokens
                              </Badge>
                            )}
                            {other.role === 'hospital' && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Hospital
                              </Badge>
                            )}
                          </div>
                          {other.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                              <PhoneIcon className="w-3 h-3" />
                              <span>{other.phone}</span>
                            </div>
                          )}
                          {other.municipality && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPinIcon className="w-3 h-3" />
                              <span>{other.municipality}</span>
                            </div>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            className="mt-3"
                            leftIcon={<MessageCircleIcon className="w-4 h-4" />}
                            onClick={() => handleMessage(other._id)}
                          >
                            Message
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notification Modal */}
      <Modal 
        isOpen={showNotificationModal} 
        onClose={() => setShowNotificationModal(false)} 
        title="Send Notification to Donors"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BellIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Broadcast Notification</p>
                <p className="text-xs text-blue-700 mt-1">
                  Send a message to selected donors. They will receive it as a notification in their messages.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Donors: {selectedDonors.length}
            </label>
            <div className="flex gap-2 mb-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllDonors}
                disabled={selectedDonors.length === filteredConnections.length}
              >
                Select All ({filteredConnections.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAllDonors}
                disabled={selectedDonors.length === 0}
              >
                Deselect All
              </Button>
            </div>
            {selectedDonors.length === 0 && (
              <p className="text-sm text-red-600">Please select at least one donor</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Message
            </label>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Enter your message here... (e.g., 'Urgent: We need O+ blood donors today')"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {notificationMessage.length} characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowNotificationModal(false)}
              className="flex-1"
              disabled={sendingNotification}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              leftIcon={sendingNotification ? undefined : <SendIcon className="w-4 h-4" />}
              onClick={handleSendNotification}
              disabled={sendingNotification || !notificationMessage.trim() || selectedDonors.length === 0}
            >
              {sendingNotification ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                `Send to ${selectedDonors.length} Donor${selectedDonors.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

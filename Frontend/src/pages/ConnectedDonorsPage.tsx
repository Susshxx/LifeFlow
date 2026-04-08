import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon, DropletIcon, PhoneIcon, MapPinIcon, MessageCircleIcon,
  SearchIcon, MenuIcon, FilterIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ConnectedUser {
  _id: string;
  name: string;
  avatar?: string;
  bloodGroup?: string;
  phone?: string;
  municipality?: string;
  role: 'user' | 'hospital';
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
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (userId: string) => {
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
                <h1 className="text-2xl font-heading font-bold text-gray-900">Connected Donors</h1>
                <p className="text-gray-600">Manage your donor connections</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(userRole === 'hospital' ? '/hospital/dashboard' : '/dashboard')}>
              Back to Dashboard
            </Button>
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
                  
                  return (
                    <Card key={conn._id} className="hover:shadow-lg transition-shadow">
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
    </div>
  );
}

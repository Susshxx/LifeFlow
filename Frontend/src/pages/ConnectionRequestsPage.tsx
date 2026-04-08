import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlusIcon, DropletIcon, PhoneIcon, MapPinIcon, CheckIcon,
  XIcon, MenuIcon, ClockIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface User {
  _id: string;
  name: string;
  avatar?: string;
  bloodGroup?: string;
  phone?: string;
  role: 'user' | 'hospital';
}

interface ConnectionRequest {
  _id: string;
  from: User;
  to: User;
  status: 'pending';
  createdAt: string;
}

export function ConnectionRequestsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const me = (() => { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } })();
  const userRole = me?.role || 'user';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      const response = await fetch(`${API}/api/connections/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: ConnectionRequest[] = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (connectionId: string, action: 'accepted' | 'declined') => {
    setResponding(connectionId);
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      const response = await fetch(`${API}/api/connections/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ connectionId, action }),
      });

      if (response.ok) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req._id !== connectionId));
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
    } finally {
      setResponding(null);
    }
  };

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
                <h1 className="text-2xl font-heading font-bold text-gray-900">Connection Requests</h1>
                <p className="text-gray-600">Review and respond to connection requests</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(userRole === 'hospital' ? '/hospital/dashboard' : '/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Stats */}
            <Card className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <UserPlusIcon className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </Card>

            {/* Requests List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <UserPlusIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No pending requests</p>
                  <p className="text-sm text-gray-400">
                    Connection requests will appear here
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const sender = request.from;
                  const isResponding = responding === request._id;

                  return (
                    <Card key={request._id} className="hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {sender.avatar ? (
                          <img
                            src={sender.avatar}
                            alt={sender.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                            {sender.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900">{sender.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {sender.bloodGroup && (
                                  <Badge variant="primary" className="text-xs">
                                    <DropletIcon className="w-3 h-3 mr-1" />
                                    {sender.bloodGroup}
                                  </Badge>
                                )}
                                {sender.role === 'hospital' && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    Hospital
                                  </Badge>
                                )}
                              </div>
                              {sender.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                  <PhoneIcon className="w-3 h-3" />
                                  <span>{sender.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                <ClockIcon className="w-3 h-3" />
                                <span>
                                  Requested {new Date(request.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<CheckIcon className="w-4 h-4" />}
                                onClick={() => handleRespond(request._id, 'accepted')}
                                isLoading={isResponding}
                                disabled={isResponding}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<XIcon className="w-4 h-4" />}
                                onClick={() => handleRespond(request._id, 'declined')}
                                disabled={isResponding}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
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

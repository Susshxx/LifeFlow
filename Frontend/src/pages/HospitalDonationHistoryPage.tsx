import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon, DropletIcon, UsersIcon, TentIcon, MenuIcon,
  SearchIcon, FilterIcon, EyeIcon, DownloadIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface DonationRecord {
  _id: string;
  donorId: any;
  hospitalId: any;
  campId: any;
  donorName: string;
  hospitalName: string;
  campTitle: string;
  bloodGroup: string;
  donationDate: string;
  tokensAwarded: number;
  location: string;
  notes: string;
  createdAt: string;
}

interface DonorDetails {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  municipality: string;
  avatar?: string;
  tokens: number;
}

export function HospitalDonationHistoryPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'camps' | 'donors'>('timeline');
  const [selectedDonor, setSelectedDonor] = useState<DonorDetails | null>(null);
  const [showDonorModal, setShowDonorModal] = useState(false);

  const me = (() => { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } })();

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  const fetchDonationHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      const response = await fetch(`${API}/api/donation-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDonations(data);
      }
    } catch (err) {
      console.error('Failed to fetch donation history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorDetails = async (donorId: string) => {
    try {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      const response = await fetch(`${API}/api/users/${donorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const donor = await response.json();
        setSelectedDonor(donor);
        setShowDonorModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch donor details:', err);
    }
  };

  // Calculate statistics
  const totalDonations = donations.length;
  const totalTokensAwarded = donations.reduce((sum, d) => sum + d.tokensAwarded, 0);
  const uniqueDonors = new Set(donations.map(d => d.donorId._id || d.donorId)).size;
  const uniqueCamps = new Set(donations.map(d => d.campId?._id || d.campId)).size;

  // Get unique years for filter
  const years = Array.from(new Set(donations.map(d => new Date(d.donationDate).getFullYear()))).sort((a, b) => b - a);

  // Filter donations
  const filteredDonations = donations.filter(donation => {
    const matchesSearch = !searchQuery || 
      donation.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.campTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBloodGroup = !filterBloodGroup || donation.bloodGroup === filterBloodGroup;
    const matchesYear = !filterYear || new Date(donation.donationDate).getFullYear().toString() === filterYear;

    return matchesSearch && matchesBloodGroup && matchesYear;
  });

  // Group by camps
  const campGroups = filteredDonations.reduce((acc, donation) => {
    const campId = donation.campId?._id || donation.campId || 'unknown';
    if (!acc[campId]) {
      acc[campId] = {
        campTitle: donation.campTitle,
        donations: [],
      };
    }
    acc[campId].donations.push(donation);
    return acc;
  }, {} as Record<string, { campTitle: string; donations: DonationRecord[] }>);

  // Group by donors
  const donorGroups = filteredDonations.reduce((acc, donation) => {
    const donorId = donation.donorId._id || donation.donorId;
    if (!acc[donorId]) {
      acc[donorId] = {
        donorName: donation.donorName,
        bloodGroup: donation.bloodGroup,
        donations: [],
      };
    }
    acc[donorId].donations.push(donation);
    return acc;
  }, {} as Record<string, { donorName: string; bloodGroup: string; donations: DonationRecord[] }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="hospital" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Open menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Donation History</h1>
                <p className="text-gray-600 mt-1">Track all blood donations at your hospital</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/hospital/dashboard')}>
                Back to Dashboard
              </Button>
              <Button variant="primary" leftIcon={<DownloadIcon className="w-4 h-4" />}>
                Export Report
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DropletIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Donations</p>
                    <p className="text-2xl font-bold text-gray-900">{totalDonations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unique Donors</p>
                    <p className="text-2xl font-bold text-gray-900">{uniqueDonors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <TentIcon className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Blood Camps</p>
                    <p className="text-2xl font-bold text-gray-900">{uniqueCamps}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tokens Awarded</p>
                    <p className="text-2xl font-bold text-gray-900">{totalTokensAwarded}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === 'timeline'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline View
            </button>
            <button
              onClick={() => setViewMode('camps')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === 'camps'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              By Camps
            </button>
            <button
              onClick={() => setViewMode('donors')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === 'donors'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              By Donors
            </button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by donor, camp, or location..."
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
                <Select
                  options={[
                    { value: '', label: 'All Years' },
                    ...years.map(year => ({ value: year.toString(), label: year.toString() })),
                  ]}
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="md:w-40"
                />
                {(searchQuery || filterBloodGroup || filterYear) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterBloodGroup('');
                      setFilterYear('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content based on view mode */}
          {viewMode === 'timeline' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Donation Timeline ({filteredDonations.length})
              </h2>
              {filteredDonations.length > 0 ? (
                <div className="space-y-4">
                  {filteredDonations.map(donation => (
                    <Card key={donation._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <DropletIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{donation.donorName}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(donation.donationDate).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="ml-13 space-y-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Camp:</span> {donation.campTitle}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Location:</span> {donation.location || 'N/A'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="primary">{donation.bloodGroup}</Badge>
                                <Badge className="bg-yellow-100 text-yellow-700">
                                  +{donation.tokensAwarded} tokens
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<EyeIcon className="w-4 h-4" />}
                            onClick={() => fetchDonorDetails(donation.donorId._id || donation.donorId)}
                          >
                            View Donor
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <DropletIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No donations found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {viewMode === 'camps' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Donations by Camp ({Object.keys(campGroups).length} camps)
              </h2>
              <div className="space-y-4">
                {Object.entries(campGroups).map(([campId, group]) => (
                  <Card key={campId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <TentIcon className="w-5 h-5 text-secondary" />
                          {group.campTitle}
                        </CardTitle>
                        <Badge>{group.donations.length} donations</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.donations.map(donation => (
                          <div key={donation._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <DropletIcon className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-gray-900">{donation.donorName}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(donation.donationDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="primary" className="text-xs">{donation.bloodGroup}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fetchDonorDetails(donation.donorId._id || donation.donorId)}
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'donors' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Donations by Donor ({Object.keys(donorGroups).length} donors)
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(donorGroups).map(([donorId, group]) => (
                  <Card key={donorId} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {group.donorName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{group.donorName}</p>
                            <Badge variant="primary" className="text-xs mt-1">{group.bloodGroup}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Donations</span>
                          <span className="font-semibold">{group.donations.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tokens Earned</span>
                          <span className="font-semibold text-warning">
                            {group.donations.reduce((sum, d) => sum + d.tokensAwarded, 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Last Donation</span>
                          <span className="font-semibold">
                            {new Date(group.donations[0].donationDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        leftIcon={<EyeIcon className="w-4 h-4" />}
                        onClick={() => fetchDonorDetails(donorId)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Donor Details Modal */}
      <Modal
        isOpen={showDonorModal}
        onClose={() => setShowDonorModal(false)}
        title="Donor Details"
        size="md"
      >
        {selectedDonor && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedDonor.avatar ? (
                <img
                  src={selectedDonor.avatar}
                  alt={selectedDonor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedDonor.name[0]}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedDonor.name}</h3>
                <Badge variant="primary">{selectedDonor.bloodGroup}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900">{selectedDonor.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Phone</span>
                <span className="text-sm font-medium text-gray-900">{selectedDonor.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Location</span>
                <span className="text-sm font-medium text-gray-900">{selectedDonor.municipality || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Tokens</span>
                <span className="text-sm font-medium text-warning">{selectedDonor.tokens || 0}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" fullWidth onClick={() => setShowDonorModal(false)}>
                Close
              </Button>
              <Button variant="primary" fullWidth onClick={() => navigate('/hospital/chat')}>
                Send Message
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

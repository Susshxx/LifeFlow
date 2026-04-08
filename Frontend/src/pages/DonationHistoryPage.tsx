import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon, DropletIcon, MapPinIcon, AwardIcon, TrendingUpIcon,
  DownloadIcon, SearchIcon, MenuIcon,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';

interface DonationRecord {
  id: string;
  date: string;
  bloodGroup: string;
  location: string;
  hospital: string;
  units: number;
  status: 'completed' | 'verified' | 'pending';
  certificateUrl?: string;
  notes?: string;
}

// TODO: Fetch from API when backend endpoint is ready
const sampleDonations: DonationRecord[] = [];

function DonationCard({ donation }: { donation: DonationRecord }) {
  const statusColors = {
    completed: 'bg-blue-100 text-blue-700',
    verified: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };

  const statusLabels = {
    completed: 'Completed',
    verified: 'Verified',
    pending: 'Pending Verification',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <DropletIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{donation.hospital}</p>
            <p className="text-sm text-gray-500">{new Date(donation.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <Badge className={statusColors[donation.status]}>
          {statusLabels[donation.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <DropletIcon className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{donation.bloodGroup}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span>{donation.location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <AwardIcon className="w-4 h-4 flex-shrink-0" />
          <span>{donation.units} unit{donation.units > 1 ? 's' : ''}</span>
        </div>
      </div>

      {donation.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{donation.notes}</p>
        </div>
      )}

      {donation.status === 'verified' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button variant="outline" size="sm" fullWidth leftIcon={<DownloadIcon className="w-3 h-3" />}>
            Download Certificate
          </Button>
        </div>
      )}
    </Card>
  );
}

function StatsCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export function DonationHistoryPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const me = (() => { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } })();
  const userRole = me?.role || 'user';
  const [donations] = useState<DonationRecord[]>(sampleDonations);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Calculate statistics
  const totalDonations = donations.length;
  const verifiedDonations = donations.filter(d => d.status === 'verified').length;
  const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);
  const lastDonation = donations.length > 0 ? donations[0].date : null;

  // Get unique years for filter
  const years = Array.from(new Set(donations.map(d => new Date(d.date).getFullYear()))).sort((a, b) => b - a);

  // Filter donations
  const filteredDonations = donations.filter(donation => {
    const matchesSearch = !searchTerm || 
      donation.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !filterYear || new Date(donation.date).getFullYear().toString() === filterYear;
    const matchesStatus = !filterStatus || donation.status === filterStatus;

    return matchesSearch && matchesYear && matchesStatus;
  });

  // Calculate days since last donation
  const daysSinceLastDonation = lastDonation 
    ? Math.floor((new Date().getTime() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={userRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
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
              <p className="text-gray-600 mt-1">Track your blood donation journey</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(userRole === 'hospital' ? '/hospital/dashboard' : '/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="primary" leftIcon={<DownloadIcon className="w-4 h-4" />}>
              Export History
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Donations"
            value={totalDonations.toString()}
            subtitle="Lifetime"
            icon={<DropletIcon className="w-6 h-6 text-white" />}
            color="bg-primary"
          />
          <StatsCard
            title="Verified Donations"
            value={verifiedDonations.toString()}
            subtitle={`${Math.round((verifiedDonations / totalDonations) * 100)}% verified`}
            icon={<AwardIcon className="w-6 h-6 text-white" />}
            color="bg-success"
          />
          <StatsCard
            title="Total Units"
            value={totalUnits.toString()}
            subtitle="Blood units donated"
            icon={<TrendingUpIcon className="w-6 h-6 text-white" />}
            color="bg-secondary"
          />
          <StatsCard
            title="Last Donation"
            value={daysSinceLastDonation ? `${daysSinceLastDonation}d` : 'N/A'}
            subtitle={lastDonation ? new Date(lastDonation).toLocaleDateString() : 'No donations yet'}
            icon={<CalendarIcon className="w-6 h-6 text-white" />}
            color="bg-warning"
          />
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by hospital, location, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Select
              options={[
                { value: '', label: 'All Years' },
                ...years.map(year => ({ value: year.toString(), label: year.toString() })),
              ]}
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="md:w-40"
            />
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'verified', label: 'Verified' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="md:w-40"
            />
            {(searchTerm || filterYear || filterStatus) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterYear('');
                  setFilterStatus('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Donation Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Donation Timeline ({filteredDonations.length})
            </h2>
          </div>

          {filteredDonations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDonations.map(donation => (
                <DonationCard key={donation.id} donation={donation} />
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <DropletIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No donations found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || filterYear || filterStatus
                    ? 'Try adjusting your filters'
                    : 'Your donation history will appear here'}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Eligibility Notice */}
        {daysSinceLastDonation !== null && daysSinceLastDonation < 90 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-1">Donation Eligibility</p>
                <p className="text-sm text-blue-700">
                  You can donate again in <span className="font-semibold">{90 - daysSinceLastDonation} days</span>.
                  The recommended waiting period between donations is 90 days (3 months).
                </p>
              </div>
            </div>
          </Card>
        )}

        {daysSinceLastDonation !== null && daysSinceLastDonation >= 90 && (
          <Card className="mt-6 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <DropletIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-1">You're Eligible to Donate!</p>
                <p className="text-sm text-green-700 mb-3">
                  It's been {daysSinceLastDonation} days since your last donation. You can donate blood again.
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/search')}>
                  Find Donation Centers
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
    </div>
  );
}

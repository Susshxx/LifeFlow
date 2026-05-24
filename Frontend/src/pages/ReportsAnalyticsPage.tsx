import React, { useState, useEffect } from 'react';
import { 
  BarChart3Icon, PieChartIcon, TrendingUpIcon, UsersIcon, 
  BuildingIcon, DropletIcon, CalendarIcon, MenuIcon, 
  DownloadIcon, RefreshCwIcon, Loader2Icon 
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ReportsAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalHospitals, setTotalHospitals] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalBloodRequests, setTotalBloodRequests] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);
  const [verifiedHospitals, setVerifiedHospitals] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingHospitals, setPendingHospitals] = useState(0);

  // Blood group distribution
  const [bloodGroupData, setBloodGroupData] = useState<{ group: string; count: number }[]>([]);

  // Monthly data for bar chart
  const [monthlyData, setMonthlyData] = useState<{ month: string; users: number; hospitals: number }[]>([]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;

    try {
      console.log('[ReportsAnalytics] Fetching analytics data...');

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
        
        // Count verified/pending
        const verifiedUsersCount = usersList.filter((u: any) => u.verified === true).length;
        const verifiedHospitalsCount = hospitalsList.filter((h: any) => h.verified === true).length;
        const pendingUsersCount = usersList.filter((u: any) => u.verified !== true).length;
        const pendingHospitalsCount = hospitalsList.filter((h: any) => h.verified !== true).length;
        
        setVerifiedUsers(verifiedUsersCount);
        setVerifiedHospitals(verifiedHospitalsCount);
        setPendingUsers(pendingUsersCount);
        setPendingHospitals(pendingHospitalsCount);

        // Calculate blood group distribution
        const bloodGroups: Record<string, number> = {};
        usersList.forEach((user: any) => {
          if (user.bloodGroup) {
            bloodGroups[user.bloodGroup] = (bloodGroups[user.bloodGroup] || 0) + 1;
          }
        });
        
        const bloodGroupArray = Object.entries(bloodGroups).map(([group, count]) => ({
          group,
          count: count as number,
        }));
        setBloodGroupData(bloodGroupArray);

        // Calculate monthly registration data (last 6 months)
        const monthlyStats: Record<string, { users: number; hospitals: number }> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        users.forEach((user: any) => {
          if (user.createdAt) {
            const date = new Date(user.createdAt);
            const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
            
            if (!monthlyStats[monthKey]) {
              monthlyStats[monthKey] = { users: 0, hospitals: 0 };
            }
            
            if (user.role === 'user') {
              monthlyStats[monthKey].users++;
            } else if (user.role === 'hospital') {
              monthlyStats[monthKey].hospitals++;
            }
          }
        });
        
        const monthlyArray = Object.entries(monthlyStats)
          .map(([month, data]) => ({ month, ...data }))
          .slice(-6); // Last 6 months
        
        setMonthlyData(monthlyArray);
      }

      // Fetch blood requests
      const requestsRes = await fetch(`${API}/api/blood-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setTotalBloodRequests(requests.length);
      }

      // Fetch donation history
      const donationsRes = await fetch(`${API}/api/donation-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (donationsRes.ok) {
        const donations = await donationsRes.json();
        setTotalDonations(donations.length);
      }

    } catch (err) {
      console.error('[ReportsAnalytics] Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ['LifeFlow Analytics Report', ''],
      ['Generated on', new Date().toLocaleString()],
      ['', ''],
      ['Metric', 'Value'],
      ['Total Users', totalUsers.toString()],
      ['Total Hospitals', totalHospitals.toString()],
      ['Verified Users', verifiedUsers.toString()],
      ['Verified Hospitals', verifiedHospitals.toString()],
      ['Pending Users', pendingUsers.toString()],
      ['Pending Hospitals', pendingHospitals.toString()],
      ['Total Donations', totalDonations.toString()],
      ['Total Blood Requests', totalBloodRequests.toString()],
      ['', ''],
      ['Blood Group Distribution', ''],
      ['Blood Group', 'Count'],
      ...bloodGroupData.map(bg => [bg.group, bg.count.toString()]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeflow-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2Icon className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate max value for bar chart scaling
  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.users, d.hospitals)),
    1
  );

  // Colors for pie chart
  const pieColors = [
    '#D90429', '#FF1744', '#A60321', '#FF5C6B', 
    '#003049', '#004D6D', '#3387AF', '#66A5C3'
  ];

  // Calculate pie chart segments
  const totalBloodGroupCount = bloodGroupData.reduce((sum, bg) => sum + bg.count, 0);
  let currentAngle = 0;
  const pieSegments = bloodGroupData.map((bg, index) => {
    const percentage = (bg.count / totalBloodGroupCount) * 100;
    const angle = (percentage / 100) * 360;
    const segment = {
      ...bg,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: pieColors[index % pieColors.length],
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        {/* Header */}
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
                <h1 className="text-2xl font-heading font-bold text-gray-900">
                  Reports & Analytics
                </h1>
                <p className="text-gray-600">
                  System statistics and data visualization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                leftIcon={<RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                leftIcon={<DownloadIcon className="w-4 h-4" />}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card padding="lg" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900">{totalUsers}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {verifiedUsers} verified • {pendingUsers} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card padding="lg" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Total Hospitals</p>
                  <p className="text-3xl font-bold text-purple-900">{totalHospitals}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {verifiedHospitals} verified • {pendingHospitals} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <BuildingIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card padding="lg" className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Total Donations</p>
                  <p className="text-3xl font-bold text-red-900">{totalDonations}</p>
                  <p className="text-xs text-red-600 mt-1">Blood donations recorded</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <DropletIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card padding="lg" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Blood Requests</p>
                  <p className="text-3xl font-bold text-green-900">{totalBloodRequests}</p>
                  <p className="text-xs text-green-600 mt-1">Total requests made</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Bar Chart - User vs Hospital Registration */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-heading font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3Icon className="w-5 h-5 text-primary" />
                    Registration Trends
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Users vs Hospitals (Last 6 months)</p>
                </div>
              </div>

              {monthlyData.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No registration data available
                </div>
              ) : (
                <div className="space-y-6">
                  {monthlyData.map((data, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{data.month}</span>
                        <span className="text-xs text-gray-500">
                          {data.users + data.hospitals} total
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {/* Users bar */}
                        <div className="flex-1">
                          <div className="h-8 bg-blue-100 rounded-lg overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${(data.users / maxValue) * 100}%` }}
                            >
                              {data.users > 0 && (
                                <span className="text-xs font-semibold text-white">
                                  {data.users}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Users</p>
                        </div>

                        {/* Hospitals bar */}
                        <div className="flex-1">
                          <div className="h-8 bg-purple-100 rounded-lg overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${(data.hospitals / maxValue) * 100}%` }}
                            >
                              {data.hospitals > 0 && (
                                <span className="text-xs font-semibold text-white">
                                  {data.hospitals}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Hospitals</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
                  <span className="text-sm text-gray-600">Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded"></div>
                  <span className="text-sm text-gray-600">Hospitals</span>
                </div>
              </div>
            </Card>

            {/* Pie Chart - Blood Group Distribution */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-heading font-semibold text-gray-900 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Blood Group Distribution
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Donor blood types breakdown</p>
                </div>
              </div>

              {bloodGroupData.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No blood group data available
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* SVG Pie Chart */}
                  <svg width="240" height="240" viewBox="0 0 240 240" className="mb-6">
                    <g transform="translate(120, 120)">
                      {pieSegments.map((segment, index) => {
                        const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
                        const endAngle = (segment.endAngle - 90) * (Math.PI / 180);
                        const radius = 100;
                        
                        const x1 = radius * Math.cos(startAngle);
                        const y1 = radius * Math.sin(startAngle);
                        const x2 = radius * Math.cos(endAngle);
                        const y2 = radius * Math.sin(endAngle);
                        
                        const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M 0 0`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                          `Z`
                        ].join(' ');

                        return (
                          <g key={index}>
                            <path
                              d={pathData}
                              fill={segment.color}
                              stroke="white"
                              strokeWidth="2"
                              className="transition-all duration-300 hover:opacity-80"
                            />
                          </g>
                        );
                      })}
                      {/* Center circle */}
                      <circle cx="0" cy="0" r="40" fill="white" />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-2xl font-bold fill-gray-900"
                      >
                        {totalUsers}
                      </text>
                      <text
                        x="0"
                        y="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-gray-500"
                      >
                        Donors
                      </text>
                    </g>
                  </svg>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {pieSegments.map((segment, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: segment.color }}
                        ></div>
                        <span className="text-sm text-gray-700 font-medium">
                          {segment.group}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {segment.count} ({segment.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUpIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verification Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalUsers + totalHospitals > 0
                      ? (((verifiedUsers + verifiedHospitals) / (totalUsers + totalHospitals)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {verifiedUsers + verifiedHospitals} of {totalUsers + totalHospitals} accounts verified
              </p>
            </Card>

            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">User to Hospital Ratio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalHospitals > 0 ? (totalUsers / totalHospitals).toFixed(1) : 0}:1
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Average donors per hospital
              </p>
            </Card>

            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <DropletIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Donations per User</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalUsers > 0 ? (totalDonations / totalUsers).toFixed(2) : 0}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Total donations divided by users
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, HeartIcon, UsersIcon, ShieldCheckIcon, ArrowRightIcon, DropletIcon, MapPinIcon, CalendarIcon, TrendingUpIcon, AwardIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/features/SearchBar';
import { EmergencyBanner } from '../components/features/EmergencyBanner';
import { CampCard } from '../components/features/CampCard';
import { TestimonialCard } from '../components/features/TestimonialCard';
import { MapView } from '../components/features/MapView';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const stats = [{
  value: '50,000+',
  label: 'Lives Saved',
  icon: HeartIcon
}, {
  value: '25,000+',
  label: 'Active Donors',
  icon: UsersIcon
}, {
  value: '500+',
  label: 'Partner Hospitals',
  icon: ShieldCheckIcon
}, {
  value: '77',
  label: 'Districts Covered',
  icon: MapPinIcon
}];
const steps = [{
  step: 1,
  title: 'Register',
  description: 'Create your account and complete your donor profile with blood group verification.',
  icon: UsersIcon
}, {
  step: 2,
  title: 'Match',
  description: 'Get matched with nearby hospitals and patients who need your blood type.',
  icon: SearchIcon
}, {
  step: 3,
  title: 'Donate',
  description: 'Visit a donation center or camp and save lives with your contribution.',
  icon: HeartIcon
}];

// Dummy data for non-logged-in users
const dummyCamps = [{
  id: '1',
  title: 'World Blood Donor Day Camp',
  organizer: 'Nepal Red Cross Society',
  date: 'June 14, 2024',
  time: '9:00 AM - 5:00 PM',
  location: 'Ratna Park, Kathmandu',
  address: 'Near Ratna Park Bus Station',
  registeredCount: 145,
  maxCapacity: 200,
  status: 'upcoming' as const
}, {
  id: '2',
  title: 'Community Blood Drive',
  organizer: 'Bir Hospital',
  date: 'June 20, 2024',
  time: '10:00 AM - 4:00 PM',
  location: 'Bir Hospital Campus',
  address: 'Mahaboudha, Kathmandu',
  registeredCount: 78,
  maxCapacity: 100,
  status: 'upcoming' as const
}, {
  id: '3',
  title: 'Youth Blood Donation Camp',
  organizer: 'Tribhuvan University',
  date: 'June 25, 2024',
  time: '8:00 AM - 2:00 PM',
  location: 'TU Central Campus',
  address: 'Kirtipur, Kathmandu',
  registeredCount: 200,
  maxCapacity: 200,
  status: 'upcoming' as const
}];
const testimonials = [{
  name: 'Ram Bahadur Thapa',
  role: 'donor' as const,
  location: 'Kathmandu',
  content: 'Donating blood through LifeFlow was incredibly easy. The platform connected me with a hospital just 2km away, and I was able to help save a life within hours of registering.',
  rating: 5
}, {
  name: 'Sita Sharma',
  role: 'recipient' as const,
  location: 'Pokhara',
  content: 'When my father needed emergency blood transfusion, LifeFlow helped us find 3 compatible donors within 30 minutes. This platform truly saves lives.',
  rating: 5
}, {
  name: 'Dr. Prakash Adhikari',
  role: 'donor' as const,
  location: 'Lalitpur',
  content: 'As a healthcare professional, I appreciate how LifeFlow has streamlined the blood donation process. The verification system ensures safety for both donors and recipients.',
  rating: 5
}];
export function HomePage() {
  const navigate = useNavigate();
  const [camps, setCamps] = useState<any[]>([]);
  const [loadingCamps, setLoadingCamps] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Redirect hospitals to their dashboard - they shouldn't access home page
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('lf_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'hospital') {
          navigate('/hospital/dashboard', { replace: true });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }, [navigate]);

  // Fetch upcoming blood camps - show real data only for logged-in users
  useEffect(() => {
    const fetchCamps = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('lf_token');
        
        if (!token) {
          // Not logged in - show dummy data immediately
          console.log('❌ No token found - showing dummy data');
          setDebugInfo('No token - showing dummy data');
          setLoadingCamps(false);
          setCamps(dummyCamps);
          return;
        }

        // Logged in - fetch real data from backend
        console.log('✅ Token found - fetching real camps data');
        console.log('🔑 Token:', token.substring(0, 20) + '...');
        console.log('🌐 API URL:', `${API}/api/blood-camps/approved`);
        setDebugInfo('Fetching real data...');
        setLoadingCamps(true);
        
        const res = await fetch(`${API}/api/blood-camps/approved`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Response status:', res.status);
        console.log('📡 Response ok:', res.ok);
        
        if (res.ok) {
          const data = await res.json();
          console.log('📦 Fetched camps data:', data);
          console.log('📊 Number of camps:', data.length);
          setDebugInfo(`Fetched ${data.length} camps from API`);
          
          // Filter for upcoming camps only (not completed)
          const now = new Date();
          const upcomingOnly = data.filter((camp: any) => {
            if (camp.status !== 'approved') return false;
            
            const startTime = new Date(camp.startTime);
            const endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + (camp.duration || 0));
            
            // Only show camps that haven't ended yet
            return now <= endTime;
          });
          
          console.log('✅ Filtered upcoming camps:', upcomingOnly);
          console.log('📊 Upcoming camps count:', upcomingOnly.length);
          
          // Sort by start time (earliest first) and take first 3
          const sorted = upcomingOnly.sort((a: any, b: any) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          
          const topThree = sorted.slice(0, 3);
          console.log('🎯 Top 3 camps to display:', topThree);
          
          // For logged-in users, show real data even if empty
          setCamps(topThree);
          if (topThree.length > 0) {
            setDebugInfo(`Showing ${topThree.length} real camps`);
          } else {
            setDebugInfo('No upcoming camps in database');
          }
        } else {
          const errorText = await res.text();
          console.error('❌ API failed with status:', res.status);
          console.error('❌ Error response:', errorText);
          setDebugInfo(`API Error ${res.status}: ${errorText.substring(0, 50)}`);
          // API failed - show empty for logged-in users
          setCamps([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch camps:', error);
        setDebugInfo(`Error: ${error}`);
        // Error - show empty for logged-in users
        setCamps([]);
      } finally {
        setLoadingCamps(false);
      }
    };

    fetchCamps();
  }, []); // Only run once on mount - removed isLoggedIn dependency to prevent glitching

  const handleSearch = (filters: any) => {
    // Build query params from filters
    const params = new URLSearchParams();
    if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
    if (filters.distance) params.append('distance', filters.distance);
    if (filters.contentType) params.append('contentType', filters.contentType);
    
    // Navigate to search page with filters
    navigate(`/search?${params.toString()}`);
  };
  return <div className="min-h-screen">
      {/* Emergency Banner */}
      <EmergencyBanner />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary to-secondary-dark overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span>Over 500 emergency requests fulfilled this month</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
                Donate Blood.
                <br />
                <span className="text-primary-light">Save Lives.</span>
                <br />
                Strengthen Nepal.
              </h1>

              <p className="text-lg text-gray-300 max-w-xl">
                Join Nepal's largest blood donation network. Connect with
                hospitals, find donors, and be part of a life-saving community.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/search">
                  <Button size="lg" leftIcon={<SearchIcon className="w-5 h-5" />}>
                    Find Blood
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-secondary">
                    Become a Donor
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {stats.map(stat => <div key={stat.label} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>)}
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="hidden lg:block relative">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Decorative circles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 border-2 border-white/10 rounded-full animate-pulse" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white/20 rounded-full" />
                </div>

                {/* Central blood drop */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center shadow-2xl animate-bounce-subtle">
                    <DropletIcon className="w-20 h-20 text-white" />
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute top-10 right-0 bg-white rounded-xl p-4 shadow-xl animate-slide-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                      <TrendingUpIcon className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        +23%
                      </p>
                      <p className="text-xs text-gray-500">Donors this month</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-10 left-0 bg-white rounded-xl p-4 shadow-xl animate-slide-in stagger-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <AwardIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Verified
                      </p>
                      <p className="text-xs text-gray-500">NRCS Partner</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative -mt-8 z-10 px-4">
        <div className="max-w-4xl mx-auto">
          <SearchBar variant="homepage" onSearch={handleSearch} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              How LifeFlow Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to save a life or find the blood you need
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => <div key={step.step} className={`relative text-center p-8 rounded-2xl bg-gray-50 animate-fade-in stagger-${index + 1}`}>
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>

                {/* Connector line */}
                {index < steps.length - 1 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-gray-300" />}
              </div>)}
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
                Find Donors & Hospitals Near You
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Our interactive map helps you locate verified blood donors and
                hospitals in your area. Filter by blood group, distance, and
                availability.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  Real-time donor availability
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                  </div>
                  Verified hospital blood banks
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full" />
                  </div>
                  Emergency mode for urgent requests
                </li>
              </ul>
              <div className="mt-8">
                <Link to="/search">
                  <Button rightIcon={<ArrowRightIcon className="w-4 h-4" />}>
                    Explore Full Map
                  </Button>
                </Link>
              </div>
            </div>
            <div className="h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <MapView className="h-full" showControls={false} showPins={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Camps */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
                Upcoming Blood Donation Camps
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Join a camp near you and make a difference
              </p>
              {/* Debug Info */}
              {debugInfo && (
                <p className="mt-2 text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  Debug: {debugInfo}
                </p>
              )}
              {localStorage.getItem('lf_token') && camps.length > 0 && camps[0]._id && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Showing real-time data from database
                </p>
              )}
              {!localStorage.getItem('lf_token') && (
                <p className="mt-2 text-sm text-gray-500">
                  Login to see real blood camps in your area
                </p>
              )}
            </div>
            <Link to="/dashboard/camps" className="hidden md:block">
              <Button variant="outline" rightIcon={<ArrowRightIcon className="w-4 h-4" />}>
                View All Camps
              </Button>
            </Link>
          </div>

          {loadingCamps ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : camps.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {camps.map(camp => {
                // Handle both real data and dummy data formats
                const isRealData = camp._id; // Real data has _id, dummy has id
                const locationLabel = isRealData 
                  ? (typeof camp.location === 'object' ? camp.location.label : camp.location)
                  : camp.location;
                const organizer = isRealData
                  ? (camp.hospitalId?.hospitalName || camp.hospitalId?.name || 'Hospital')
                  : camp.organizer;
                const registered = isRealData
                  ? (camp.registeredDonors?.length || 0)
                  : camp.registeredCount;
                const capacity = isRealData
                  ? (camp.expectedDonors || 100)
                  : camp.maxCapacity;
                const date = isRealData
                  ? new Date(camp.startTime).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : camp.date;
                const time = isRealData
                  ? new Date(camp.startTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : camp.time;
                
                // Determine status - ensure it's one of the valid values
                let campStatus: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
                if (isRealData && camp.startTime) {
                  const now = new Date();
                  const startTime = new Date(camp.startTime);
                  const endTime = new Date(startTime);
                  endTime.setHours(endTime.getHours() + (camp.duration || 0));
                  
                  if (now >= startTime && now <= endTime) {
                    campStatus = 'ongoing';
                  } else if (now > endTime) {
                    campStatus = 'completed';
                  } else {
                    campStatus = 'upcoming';
                  }
                } else if (camp.status) {
                  // Use provided status if valid
                  campStatus = camp.status as 'upcoming' | 'ongoing' | 'completed';
                }
                
                return (
                  <CampCard 
                    key={camp._id || camp.id}
                    id={camp._id || camp.id}
                    title={camp.title}
                    organizer={organizer}
                    date={date}
                    time={time}
                    location={locationLabel}
                    address={camp.address || locationLabel}
                    registeredCount={registered}
                    maxCapacity={capacity}
                    status={campStatus}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">No upcoming blood camps at the moment</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new donation opportunities</p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link to="/camps">
              <Button variant="outline" rightIcon={<ArrowRightIcon className="w-4 h-4" />}>
                View All Camps
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
              Stories That Inspire
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Real stories from donors and recipients across Nepal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => <TestimonialCard key={index} {...testimonial} />)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            Ready to Save a Life?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Join thousands of donors across Nepal. Your single donation can save
            up to 3 lives.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" variant="outline" className=" border-white text-white hover:bg-blue-30">
                Register as Donor
              </Button>
            </Link>
            <Link to="/search">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Find Blood Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>;
}
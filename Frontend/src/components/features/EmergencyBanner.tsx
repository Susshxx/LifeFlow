import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangleIcon, ChevronRightIcon, XIcon } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface EmergencyRequest {
  _id: string;
  name: string;
  phone: string;
  email: string;
  bloodGroup: string;
  isEmergency: boolean;
  location: { lat: number; lng: number; label: string };
  createdAt: string;
  userId?: any;
}

interface EmergencyBannerProps {
  className?: string;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function EmergencyBanner({ className = '' }: EmergencyBannerProps) {
  const navigate = useNavigate();
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Get current user ID
  const myId = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('lf_user') || 'null');
      return user?.id || user?._id || null;
    } catch {
      return null;
    }
  })();

  // Fetch emergency requests from API
  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const token = localStorage.getItem('lf_token');
        const res = await fetch(`${API}/api/blood-requests`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data: EmergencyRequest[] = await res.json();
        
        // Filter for emergency requests that are NOT created by the current user
        const emergencies = data.filter(r => {
          if (!r.isEmergency) return false;
          const requestUserId = typeof r.userId === 'object' ? (r.userId as any)._id : r.userId;
          return requestUserId !== myId;
        });
        
        setEmergencyRequests(emergencies);
        
        // Store in localStorage for DonorDashboard
        localStorage.setItem('lf_emergency_requests', JSON.stringify(emergencies));
        window.dispatchEvent(new Event('lf_emergency_updated'));
      } catch (err) {
        console.error('Failed to fetch emergency requests:', err);
      }
    };

    fetchEmergencies();
    // Poll every 30 seconds
    const interval = setInterval(fetchEmergencies, 30_000);
    return () => clearInterval(interval);
  }, [myId]);

  // Auto-rotate through requests
  useEffect(() => {
    if (emergencyRequests.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % emergencyRequests.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [emergencyRequests.length]);

  if (!isVisible || emergencyRequests.length === 0) return null;

  const currentRequest = emergencyRequests[currentIndex];

  const handleRespondNow = () => {
    const { lat, lng } = currentRequest.location;
    navigate(`/search?lat=${lat}&lng=${lng}`);
  };

  return (
    <div className={`bg-emergency text-white relative overflow-hidden ${className}`} role="alert" aria-live="polite">
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-emergency via-emergency-light to-emergency animate-pulse opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-bounce-subtle">
              <AlertTriangleIcon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-lg">{currentRequest.bloodGroup}</span>
                <span className="text-white/80">blood needed urgently</span>
                <span className="text-white/80">at</span>
                <span className="font-semibold">
                  {currentRequest.location?.label || 'Unknown location'}
                </span>
                <span className="text-white/60 text-sm">• {getTimeAgo(currentRequest.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleRespondNow}
              className="hidden sm:flex items-center gap-1 px-4 py-1.5 bg-white text-emergency font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              Respond Now
              <ChevronRightIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss emergency banner"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress dots - only show if multiple requests */}
        {emergencyRequests.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {emergencyRequests.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-4' : 'bg-white/40'
                }`}
                aria-label={`Go to emergency request ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

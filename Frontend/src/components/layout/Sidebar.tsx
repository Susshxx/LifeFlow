import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboardIcon, HistoryIcon, CalendarIcon, BellIcon, SettingsIcon, MessageCircleIcon, UsersIcon, BuildingIcon, FileTextIcon, ShieldCheckIcon, BarChart3Icon, HeartPulseIcon, XIcon, ChevronLeftIcon, LogOutIcon } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type UserRole = 'user' | 'hospital' | 'admin';
interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}
const userNavItems: NavItem[] = [{
  href: '/dashboard',
  label: 'Dashboard',
  icon: <LayoutDashboardIcon className="w-5 h-5" />
}, {
  href: '/dashboard/history',
  label: 'Donation History',
  icon: <HistoryIcon className="w-5 h-5" />
}, {
  href: '/dashboard/camps',
  label: 'Blood Camps',
  icon: <CalendarIcon className="w-5 h-5" />
}, {
  href: '/dashboard/requests',
  label: 'Blood Requests',
  icon: <BellIcon className="w-5 h-5" />
}, {
  href: '/dashboard/chat',
  label: 'Messages',
  icon: <MessageCircleIcon className="w-5 h-5" />
}, {
  href: '/dashboard/settings',
  label: 'Settings',
  icon: <SettingsIcon className="w-5 h-5" />
}];
const hospitalNavItems: NavItem[] = [{
  href: '/hospital/dashboard',
  label: 'Dashboard',
  icon: <LayoutDashboardIcon className="w-5 h-5" />
}, {
  href: '/hospital/requests',
  label: 'Blood Requests',
  icon: <HeartPulseIcon className="w-5 h-5" />,
  badge: 5
}, {
  href: '/hospital/donors',
  label: 'Connected Donors',
  icon: <UsersIcon className="w-5 h-5" />
}, {
  href: '/hospital/connection-requests',
  label: 'Connection Requests',
  icon: <BellIcon className="w-5 h-5" />
}, {
  href: '/hospital/chat',
  label: 'Messages',
  icon: <MessageCircleIcon className="w-5 h-5" />
}, {
  href: '/hospital/camps',
  label: 'Donation Camps',
  icon: <CalendarIcon className="w-5 h-5" />
}, {
  href: '/hospital/records',
  label: 'Donation Records',
  icon: <FileTextIcon className="w-5 h-5" />
}, {
  href: '/hospital/settings',
  label: 'Settings',
  icon: <SettingsIcon className="w-5 h-5" />
}];
const adminNavItems: NavItem[] = [{
  href: '/admin/dashboard',
  label: 'Dashboard',
  icon: <LayoutDashboardIcon className="w-5 h-5" />
}, {
  href: '/admin/users',
  label: 'User Verification',
  icon: <UsersIcon className="w-5 h-5" />,
  badge: 12
}, {
  href: '/admin/hospitals',
  label: 'Hospital Verification',
  icon: <BuildingIcon className="w-5 h-5" />,
  badge: 4
}, {
  href: '/admin/camps',
  label: 'Camp Approvals',
  icon: <CalendarIcon className="w-5 h-5" />,
  badge: 7
}, {
  href: '/admin/notifications',
  label: 'Notifications',
  icon: <BellIcon className="w-5 h-5" />
}, {
  href: '/admin/reports',
  label: 'Reports & Analytics',
  icon: <BarChart3Icon className="w-5 h-5" />
}, {
  href: '/admin/roles',
  label: 'Role Management',
  icon: <ShieldCheckIcon className="w-5 h-5" />
}, {
  href: '/admin/settings',
  label: 'Settings',
  icon: <SettingsIcon className="w-5 h-5" />
}];
const navItemsByRole: Record<UserRole, NavItem[]> = {
  user: userNavItems,
  hospital: hospitalNavItems,
  admin: adminNavItems
};
export function Sidebar({
  role,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadMessageUsers, setUnreadMessageUsers] = useState(0);
  
  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('lf_token');
        if (!token) return;
        
        const response = await fetch(`${API}/api/connections`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Silently fail on 401 - user might not have access or token expired
        if (!response.ok) return;
        
        const connections = await response.json();
        
        // Fetch previews for each connection to count users with unread messages
        const previewPromises = connections.map(async (conn: any) => {
          try {
            const r = await fetch(`${API}/api/connections/${conn._id}/preview`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (r.ok) {
              const data = await r.json();
              return data.unreadCount > 0 ? 1 : 0;
            }
          } catch {}
          return 0;
        });
        
        const results = await Promise.all(previewPromises);
        const count = results.reduce((sum, val) => sum + val, 0);
        setUnreadMessageUsers(count);
      } catch (err) {
        // Silently fail - this is a non-critical feature
        console.debug('Failed to fetch unread count:', err);
      }
    };
    
    fetchUnreadCount();
    // Poll every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const navItems = navItemsByRole[role];
  
  const handleLogout = () => {
    localStorage.removeItem('lf_token');
    localStorage.removeItem('lf_user');
    navigate('/');
  };
  
  return <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />}

      {/* Sidebar */}
      <aside className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64 flex flex-col
        `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
          {!isCollapsed && <Link 
              to={role === 'user' ? '/dashboard' : role === 'hospital' ? '/hospital/dashboard' : '/admin/dashboard'} 
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HeartPulseIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-secondary">
                Life<span className="text-primary">Flow</span>
              </span>
            </Link>}
          {isCollapsed && <Link 
              to={role === 'user' ? '/dashboard' : role === 'hospital' ? '/hospital/dashboard' : '/admin/dashboard'}
              className="w-full flex justify-center"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HeartPulseIcon className="w-5 h-5 text-white" />
              </div>
            </Link>}
          <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close sidebar">
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto" aria-label="Sidebar navigation">
          {navItems.map(item => {
          const isActive = location.pathname === item.href;
          // Use dynamic unread count for Messages (both user and hospital)
          const badge = (item.href === '/dashboard/chat' || item.href === '/hospital/chat') 
            ? unreadMessageUsers 
            : item.badge;
          return <Link key={item.href} to={item.href} className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-200
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  ${isCollapsed ? 'justify-center' : ''}
                `} onClick={onClose} title={isCollapsed ? item.label : undefined}>
                <span className={isActive ? 'text-primary' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {!isCollapsed && <>
                    <span className="flex-1 font-medium text-sm">
                      {item.label}
                    </span>
                    {badge && badge > 0 && <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full">
                        {badge}
                      </span>}
                  </>}
                {isCollapsed && badge && badge > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />}
              </Link>;
        })}
        </nav>

        {/* Sign Out Button (for all roles) */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-red-600 hover:bg-red-50 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOutIcon className="w-5 h-5" />
            {!isCollapsed && <span className="flex-1 font-medium text-sm text-left">Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        {onToggleCollapse && <button onClick={onToggleCollapse} className="hidden lg:flex absolute -right-3 bottom-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 transition-colors shadow-sm" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <ChevronLeftIcon className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>}
      </aside>
    </>;
}
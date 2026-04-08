import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('user' | 'hospital' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem('lf_token');
  
  // If not logged in, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Get user from localStorage
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('lf_user') || 'null');
  } catch {
    return <Navigate to="/login" replace />;
  }

  // If no user data, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  const userRole = user.role || 'user';
  
  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'hospital') {
      return <Navigate to="/hospital/dashboard" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User has correct role, render the component
  return <>{children}</>;
}

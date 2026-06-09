import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirects hospitals and admins away from public pages to their respective dashboards
 * This ensures admins and hospitals stay within their designated areas
 */
export function useRoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('lf_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        if (user.role === 'hospital') {
          navigate('/hospital/dashboard', { replace: true });
          return;
        }
        
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }, [navigate]);
}

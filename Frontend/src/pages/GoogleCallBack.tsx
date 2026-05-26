// import { useEffect, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';

// const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// export function GoogleCallback() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [status, setStatus] = useState('Completing sign-in…');

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const code   = params.get('code');
//     const error  = params.get('error');

//     // Handle errors
//     if (error) {
//       if (error === 'database_unavailable' || error === 'database_error') {
//         navigate('/login?error=database_unavailable', { replace: true });
//       } else {
//         navigate('/login?error=google_failed', { replace: true });
//       }
//       return;
//     }

//     // No code provided
//     if (!code) {
//       navigate('/login?error=google_failed', { replace: true });
//       return;
//     }

//     // Exchange code for token
//     const exchangeCode = async () => {
//       try {
//         const res = await fetch(`${API}/api/auth/google/exchange?code=${code}`);
        
//         if (!res.ok) {
//           const body = await res.json().catch(() => ({}));
//           throw new Error(body.error || `Exchange failed (${res.status})`);
//         }
        
//         const { token, user } = await res.json();
        
//         if (!token || !user) {
//           throw new Error('Invalid exchange response');
//         }

//         setStatus('Signed in! Redirecting…');

//         // Check if user needs to complete profile
//         const needsProfileCompletion = !user.isVerified || !user.bloodGroup || !user.phone || !user.province;

//         if (needsProfileCompletion) {
//           // Store in sessionStorage for SignUpPage
//           sessionStorage.setItem('google_pending', JSON.stringify({ token, user }));
//           setTimeout(() => navigate('/signup', { replace: true }), 500);
//         } else {
//           // Fully registered - log them in
//           localStorage.setItem('lf_token', token);
//           localStorage.setItem('lf_user', JSON.stringify(user));
//           setTimeout(() => navigate('/', { replace: true }), 500);
//         }
//       } catch (err: any) {
//         console.error('Google exchange error:', err.message);
//         // navigate('/login?error=google_failed', { replace: true });
//       }
//     };

//     exchangeCode();
//   }, [location, navigate]);

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="text-center">
//         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//         <p className="text-gray-600">{status}</p>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Completing sign-in…');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code   = params.get('code');
    const error  = params.get('error');

    if (error) {
      if (error === 'database_unavailable' || error === 'database_error') {
        navigate('/login?error=database_unavailable', { replace: true });
      } else {
        navigate('/login?error=google_failed', { replace: true });
      }
      return;
    }

    if (!code) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    const exchangeCode = async () => {
      try {
        setStatus('Verifying Google account…');

        const res = await fetch(
          `${API}/api/auth/google/exchange?code=${encodeURIComponent(code)}`
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || `Exchange failed (${res.status})`);
        }

        const { token, user } = data;

        if (!token || !user) {
          throw new Error('Invalid server response');
        }

        setStatus('Signed in! Redirecting…');

        const needsProfileCompletion =
          !user.isVerified || !user.bloodGroup || !user.phone || !user.province;

        if (needsProfileCompletion) {
          sessionStorage.setItem('google_pending', JSON.stringify({ token, user }));
          navigate('/signup', { replace: true });
        } else {
          localStorage.setItem('lf_token', token);
          localStorage.setItem('lf_user', JSON.stringify(user));
          navigate('/', { replace: true });
        }
      } catch (err: any) {
        console.error('Google exchange error:', err.message);
        setStatus('Sign-in failed. Redirecting…');
        setTimeout(() => navigate('/login?error=google_failed', { replace: true }), 800);
      }
    };

    exchangeCode();
  }, [location.search, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid #e53e3e',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#718096', fontSize: 16 }}>{status}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
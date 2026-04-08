// // import { useEffect } from 'react';
// // import { useNavigate, useLocation } from 'react-router-dom';

// // /**
// //  * This page handles the redirect from Google OAuth.
// //  * The backend redirects to /auth/google/callback?token=...&user=...
// //  * We read the params, store them, then redirect to /signup so the
// //  * user can complete OCR verification.
// //  */
// // export function GoogleCallback() {
// //   const navigate  = useNavigate();
// //   const location  = useLocation();

// //   useEffect(() => {
// //     const params = new URLSearchParams(location.search);
// //     const token  = params.get('token');
// //     const userParam = params.get('user');
// //     const error  = params.get('error');

// //     if (error || !token || !userParam) {
// //       navigate('/login?error=google_failed', { replace: true });
// //       return;
// //     }

// //     try {
// //       const user = JSON.parse(decodeURIComponent(userParam));

// //       // Check if user already has verified data (returning Google user)
// //       if (user.isVerified && user.province) {
// //         // Fully registered — just log them in
// //         localStorage.setItem('lf_token', token);
// //         localStorage.setItem('lf_user', JSON.stringify(user));
// //         navigate('/', { replace: true });
// //       } else {
// //         // New Google user — send to signup to complete OCR + details
// //         // Pass params in URL so SignUpPage can pick them up
// //         navigate(`/signup?token=${token}&user=${encodeURIComponent(userParam)}`, { replace: true });
// //       }
// //     } catch {
// //       navigate('/login?error=google_failed', { replace: true });
// //     }
// //   }, [location, navigate]);

// //   return (
// //     <div className="min-h-screen flex items-center justify-center">
// //       <div className="text-center">
// //         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
// //         <p className="text-gray-600">Completing sign-in…</p>
// //       </div>
// //     </div>
// //   );
// // }

// import { useEffect, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';

// const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// /**
//  * Handles the redirect from Google OAuth.
//  *
//  * OLD flow: backend put token+user in URL params → broke because JWT is too long
//  * NEW flow: backend stores result under a short temp code, redirects here with
//  *           just ?code=<32-byte-hex>, we fetch /api/auth/google/exchange?code=...
//  *           to get the real token + user object.
//  */
// export function GoogleCallback() {
//   const navigate  = useNavigate();
//   const location  = useLocation();
//   const [status, setStatus] = useState('Completing sign-in…');

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const code   = params.get('code');
//     const error  = params.get('error');

//     if (error || !code) {
//       navigate('/login?error=google_failed', { replace: true });
//       return;
//     }

//     // Exchange the short temp code for the real JWT + user
//     fetch(`${API}/api/auth/google/exchange?code=${code}`)
//       .then(async (res) => {
//         if (!res.ok) {
//           const body = await res.json().catch(() => ({}));
//           throw new Error(body.error || `Exchange failed (${res.status})`);
//         }
//         return res.json();
//       })
//       .then(({ token, user }) => {
//         if (!token || !user) throw new Error('Invalid exchange response');

//         localStorage.setItem('lf_token', token);
//         localStorage.setItem('lf_user', JSON.stringify(user));

//         setStatus('Signed in! Redirecting…');

//         // Already registered with all details → go home
//         if (user.isVerified && user.province) {
//           navigate('/', { replace: true });
//         } else {
//           // New Google user → complete profile (OCR + details)
//           navigate('/signup', { replace: true });
//         }
//       })
//       .catch((err) => {
//         console.error('Google exchange error:', err.message);
//         navigate('/login?error=google_failed', { replace: true });
//       });
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Handle errors
    if (error) {
      if (error === 'database_unavailable' || error === 'database_error') {
        navigate('/login?error=database_unavailable', { replace: true });
      } else {
        navigate('/login?error=google_failed', { replace: true });
      }
      return;
    }

    // No code provided
    if (!code) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    // Exchange code for token
    const exchangeCode = async () => {
      try {
        const res = await fetch(`${API}/api/auth/google/exchange?code=${code}`);
        
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Exchange failed (${res.status})`);
        }
        
        const { token, user } = await res.json();
        
        if (!token || !user) {
          throw new Error('Invalid exchange response');
        }

        setStatus('Signed in! Redirecting…');

        // Check if user needs to complete profile
        const needsProfileCompletion = !user.isVerified || !user.bloodGroup || !user.phone || !user.province;

        if (needsProfileCompletion) {
          // Store in sessionStorage for SignUpPage
          sessionStorage.setItem('google_pending', JSON.stringify({ token, user }));
          setTimeout(() => navigate('/signup', { replace: true }), 500);
        } else {
          // Fully registered - log them in
          localStorage.setItem('lf_token', token);
          localStorage.setItem('lf_user', JSON.stringify(user));
          setTimeout(() => navigate('/', { replace: true }), 500);
        }
      } catch (err: any) {
        console.error('Google exchange error:', err.message);
        navigate('/login?error=google_failed', { replace: true });
      }
    };

    exchangeCode();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
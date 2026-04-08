import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Chatbot } from './components/features/Chatbot';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { GoogleCallback } from './pages/GoogleCallBack';
import { DonorDashboard } from './pages/DonorDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ErrorPage } from './pages/ErrorPage';
import { DonatePage } from './pages/DonatePage';
import { DonationSuccessPage } from './pages/DonationSuccessPage';
import { DonationFailurePage } from './pages/DonationFailurePage';
import { SettingsPage } from './pages/SettingsPage';
import { MessagesPage } from './pages/MessagesPage';
import { BloodRequestsPage } from './pages/BloodRequestsPage';
import { BloodCampsPage } from './pages/BloodCampsPage';
import { DonationHistoryPage } from './pages/DonationHistoryPage';
import { ConnectedDonorsPage } from './pages/ConnectedDonorsPage';
import { ConnectionRequestsPage } from './pages/ConnectionRequestsPage';
import { HospitalMessagesPage } from './pages/HospitalMessagesPage';
import { CampApprovalsPage } from './pages/CampApprovalsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import 'leaflet/dist/leaflet.css';

// Pages that should NOT show the Navbar/Footer
const AUTH_PAGES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/auth/google/callback',
];

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isDashboard = location.pathname.includes('/dashboard') || 
                      location.pathname.includes('/hospital/') || 
                      location.pathname.includes('/admin/');
  const isErrorPage = location.pathname === '/404';
  const isAuthPage = AUTH_PAGES.includes(location.pathname);

  // Show Navbar + Footer only on public pages (not dashboard, error, or auth pages)
  const showLayout = !isDashboard && !isErrorPage && !isAuthPage;
  
  // Show Chatbot only on public pages (not dashboard, error, or auth pages)
  const showChatbot = !isDashboard && !isErrorPage && !isAuthPage;

  return (
    <div className="flex flex-col min-h-screen">
      {showLayout && <Navbar />}
      <main className={`flex-1 ${showLayout ? 'pt-[88px]' : ''}`}>{children}</main>
      {showLayout && <Footer />}
      {showChatbot && <Chatbot />}
    </div>
  );
}

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/donation/success" element={<DonationSuccessPage />} />
          <Route path="/donation/failure" element={<DonationFailurePage />} />

          {/* Google OAuth callback — no Navbar/Footer (handled in AUTH_PAGES) */}
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          {/* Dashboards — no Navbar/Footer */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><DonorDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/chat" element={<ProtectedRoute allowedRoles={['user']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute allowedRoles={['user']}><SettingsPage /></ProtectedRoute>} />
          <Route path="/dashboard/requests" element={<ProtectedRoute allowedRoles={['user']}><BloodRequestsPage /></ProtectedRoute>} />
          <Route path="/dashboard/camps" element={<ProtectedRoute allowedRoles={['user']}><BloodCampsPage /></ProtectedRoute>} />
          <Route path="/dashboard/history" element={<ProtectedRoute allowedRoles={['user']}><DonationHistoryPage /></ProtectedRoute>} />
          
          <Route path="/hospital/dashboard/*" element={<ProtectedRoute allowedRoles={['hospital']}><HospitalDashboard /></ProtectedRoute>} />
          <Route path="/hospital/donors" element={<ProtectedRoute allowedRoles={['hospital']}><ConnectedDonorsPage /></ProtectedRoute>} />
          <Route path="/hospital/connection-requests" element={<ProtectedRoute allowedRoles={['hospital']}><ConnectionRequestsPage /></ProtectedRoute>} />
          <Route path="/hospital/chat" element={<ProtectedRoute allowedRoles={['hospital']}><HospitalMessagesPage /></ProtectedRoute>} />
          <Route path="/hospital/requests" element={<ProtectedRoute allowedRoles={['hospital']}><BloodRequestsPage /></ProtectedRoute>} />
          <Route path="/hospital/camps" element={<ProtectedRoute allowedRoles={['hospital']}><BloodCampsPage /></ProtectedRoute>} />
          <Route path="/hospital/records" element={<ProtectedRoute allowedRoles={['hospital']}><DonationHistoryPage /></ProtectedRoute>} />
          <Route path="/hospital/settings" element={<ProtectedRoute allowedRoles={['hospital']}><SettingsPage /></ProtectedRoute>} />
          
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/camps" element={<ProtectedRoute allowedRoles={['admin']}><CampApprovalsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />

          {/* Error Routes */}
          <Route path="/404" element={<ErrorPage />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CertificatesPage from './pages/CertificatesPage';
import AttendancePage from './pages/AttendancePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import QrPage from './pages/QrPage';
import './index.css';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public landing */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PublicRoute><PageTransition><LoginPage /></PageTransition></PublicRoute>} />

        {/* Protected dashboard routes */}
        <Route path="/home" element={<ProtectedRoute><PageTransition><HomePage /></PageTransition></ProtectedRoute>} />
        <Route path="/qr" element={<ProtectedRoute><PageTransition><QrPage /></PageTransition></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><PageTransition><EventsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><PageTransition><EventDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><PageTransition><CertificatesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><PageTransition><AttendancePage /></PageTransition></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><PageTransition><HistoryPage /></PageTransition></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><PageTransition><NotificationsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/mlynq">
      <AuthProvider>
        <ToastProvider>
          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

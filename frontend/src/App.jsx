import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import UserDashboard from './pages/dashboard/UserDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

function ProtectedRoute({ children, adminOnly = false, redirectAdminTo = null }) {
  const { user, userProfile, loading } = useAuth();

  if (loading || (user && !userProfile)) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" replace />;
  if (adminOnly && userProfile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (redirectAdminTo && userProfile?.role === 'admin') return <Navigate to={redirectAdminTo} replace />;

  return children;
}

function App() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/admin';

  return (
    <div className="app">
      {!isDashboard && <Navbar />}
      <main>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth Pages */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Pages — No Navbar/Footer */}
          <Route path="/dashboard" element={
            <ProtectedRoute redirectAdminTo="/admin"><UserDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import authApi from '../services/authApi';
import Modal from './Modal';

/**
 * SessionExpiryHandler component
 * 
 * Monitors authentication state and handles session expiry by:
 * - Checking session validity on mount and periodically
 * - Detecting 401 errors from API calls
 * - Showing a re-authentication prompt
 * - Redirecting to login when session expires
 */
export default function SessionExpiryHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, refreshAuth } = useAuthStore();
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  // Check session validity on mount and when authentication state changes
  useEffect(() => {
    const checkSession = async () => {
      // Skip check on login and callback pages
      if (location.pathname === '/login' || location.pathname === '/auth/callback') {
        return;
      }

      // Only check if user thinks they're authenticated
      if (isAuthenticated) {
        try {
          await refreshAuth();
        } catch (error) {
          // Session is invalid, show expiry modal
          setShowExpiryModal(true);
        }
      }
    };

    checkSession();
  }, [location.pathname]);

  // Set up axios interceptor to catch 401 errors
  useEffect(() => {
    const interceptor = authApi.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check if it's a 401 Unauthorized error
        if (error.response?.status === 401) {
          // Skip showing modal on login and callback pages
          if (location.pathname !== '/login' && location.pathname !== '/auth/callback') {
            setShowExpiryModal(true);
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      authApi.interceptors.response.eject(interceptor);
    };
  }, [location.pathname]);

  // Periodic session check (every 5 minutes)
  useEffect(() => {
    // Skip periodic check on login and callback pages
    if (location.pathname === '/login' || location.pathname === '/auth/callback') {
      return;
    }

    const interval = setInterval(async () => {
      if (isAuthenticated) {
        try {
          await refreshAuth();
        } catch (error) {
          setShowExpiryModal(true);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname, refreshAuth]);

  const handleReauthenticate = () => {
    setShowExpiryModal(false);
    // Redirect to login with return URL
    navigate('/login', { state: { from: location.pathname } });
  };

  return (
    <Modal
      isOpen={showExpiryModal}
      onClose={handleReauthenticate}
      title="Session Expired"
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏱️</div>
        <p style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '1.6' }}>
          Your session has expired for security reasons.
        </p>
        <p style={{ marginBottom: '30px', color: '#999', fontSize: '14px' }}>
          Please sign in again to continue using the deck builder.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleReauthenticate}
          style={{ padding: '12px 32px', fontSize: '16px' }}
        >
          Sign In Again
        </button>
      </div>
    </Modal>
  );
}

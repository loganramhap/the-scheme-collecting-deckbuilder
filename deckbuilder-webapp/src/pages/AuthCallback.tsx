import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import * as authApi from '../services/authApi';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refreshAuth = useAuthStore((state) => state.refreshAuth);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Handle OAuth errors (e.g., user denied authorization)
    if (errorParam) {
      setStatus('error');
      if (errorParam === 'access_denied') {
        setError('You need to authorize the application to continue');
      } else {
        setError(errorDescription || 'Authorization failed. Please try again.');
      }
      return;
    }

    // Validate required parameters
    if (!code) {
      setStatus('error');
      setError('No authorization code received');
      return;
    }

    if (!state) {
      setStatus('error');
      setError('Invalid request: missing state parameter');
      return;
    }

    const handleOAuthCallback = async () => {
      try {
        // Send code and state to backend callback endpoint
        await authApi.handleCallback(code, state);
        
        // Refresh auth state to load user data
        await refreshAuth();
        
        setStatus('success');
        
        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          navigate('/');
        }, 500);
      } catch (err: any) {
        setStatus('error');
        
        // Handle specific error cases
        if (err.response?.status === 400) {
          setError('Invalid authorization code or state. Please try again.');
        } else if (err.response?.status === 401) {
          setError('Authentication failed. Please try again.');
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Something went wrong. Please try again.');
        }
        
        console.error('OAuth callback error:', err);
      }
    };

    handleOAuthCallback();
  }, [searchParams, refreshAuth, navigate]);

  // Error state
  if (status === 'error') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ marginBottom: '15px' }}>Authentication Error</h2>
          <p style={{ color: '#f44336', marginBottom: '25px' }}>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/login')} 
            style={{ width: '100%' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
          <h2 style={{ marginBottom: '10px', color: '#4caf50' }}>Success!</h2>
          <p style={{ color: '#999', fontSize: '14px' }}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Processing state (default)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          <div className="spinner" style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #333',
            borderTop: '4px solid #0066cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <h2 style={{ marginBottom: '10px' }}>Authenticating...</h2>
        <p style={{ color: '#999', fontSize: '14px' }}>Please wait while we sign you in</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

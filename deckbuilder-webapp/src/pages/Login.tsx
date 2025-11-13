import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Check for OAuth error in URL params
    const oauthError = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (oauthError) {
      if (oauthError === 'access_denied') {
        setError('You need to authorize the application to continue');
      } else if (errorDescription) {
        setError(errorDescription);
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handleRiotSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await login();
      // login() will redirect to Riot's authorization page
    } catch (err: any) {
      console.error('Failed to initiate OAuth flow:', err);
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        setError('Cannot connect to server. Please check your connection and try again.');
      } else {
        setError('Failed to start sign-in process. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    handleRiotSignIn();
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🃏</div>
          <h1 style={{ marginBottom: '10px', fontSize: '32px' }}>Zaunite Workshop</h1>
          <p style={{ color: '#999', fontSize: '16px' }}>
            Version-controlled deck management for Riot Games
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '20px', 
            background: '#f443361a', 
            border: '1px solid #f44336',
            borderRadius: '6px',
            color: '#f44336',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '10px' }}>{error}</div>
            <button
              onClick={handleRetry}
              disabled={loading}
              style={{
                background: 'none',
                border: '1px solid #f44336',
                color: '#f44336',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        <button 
          onClick={handleRiotSignIn}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '16px',
            fontSize: '16px',
            fontWeight: '600',
            background: '#D13639',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#B8292C';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#D13639';
          }}
        >
          {loading ? (
            <>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                border: '3px solid rgba(255,255,255,0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Redirecting to Riot Games...</span>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              <span>Sign in with Riot Games</span>
            </>
          )}
        </button>

        <div style={{ 
          marginTop: '25px', 
          padding: '15px',
          background: '#2d2d2d',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#999',
          lineHeight: '1.6'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
            🎮 Riot Games Account Required
          </div>
          <div>
            Sign in with your Riot Games account to access deck building features. 
            Your decks are automatically backed up with full version history.
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '11px', color: '#666', textAlign: 'center' }}>
          By signing in, you agree to share your Riot Games account information with this application.
        </p>
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

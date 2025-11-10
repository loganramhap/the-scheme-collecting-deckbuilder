import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const GITEA_URL = import.meta.env.VITE_GITEA_URL || 'http://localhost:3000';
const CLIENT_ID = import.meta.env.VITE_GITEA_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/auth/callback';

export default function Login() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    if (!CLIENT_ID) {
      alert('OAuth Client ID is not configured. Please check your .env file and rebuild.');
      console.error('Missing VITE_GITEA_CLIENT_ID in environment variables');
      return;
    }
    
    // Add prompt=login to force re-authentication and show authorization screen
    const authUrl = `${GITEA_URL}/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=random_state&prompt=login`;
    window.location.href = authUrl;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <div className="card" style={{ maxWidth: '450px', textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🃏</div>
        <h1 style={{ marginBottom: '10px', fontSize: '32px' }}>DeckBuilder</h1>
        <p style={{ marginBottom: '30px', color: '#999', fontSize: '16px' }}>
          Git-powered deck management for MTG and Riftbound
        </p>
        <button 
          className="btn btn-primary" 
          onClick={handleLogin} 
          style={{ 
            width: '100%', 
            padding: '15px',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <span>🔐</span>
          Sign in with Gitea
        </button>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          Secure authentication via your Gitea account
        </p>
      </div>
    </div>
  );
}

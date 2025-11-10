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
    
    const authUrl = `${GITEA_URL}/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=random_state`;
    console.log('OAuth URL:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>DeckBuilder</h1>
        <p style={{ marginBottom: '30px', color: '#999' }}>
          Git-powered deck management for MTG and Riftbound
        </p>
        <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%' }}>
          Sign in with Gitea
        </button>
      </div>
    </div>
  );
}

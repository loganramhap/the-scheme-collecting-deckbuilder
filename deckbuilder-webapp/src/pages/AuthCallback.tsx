import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import axios from 'axios';

const GITEA_URL = import.meta.env.VITE_GITEA_URL || 'http://localhost:3000';
const CLIENT_ID = import.meta.env.VITE_GITEA_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GITEA_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/auth/callback';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError('No authorization code received');
      return;
    }

    const exchangeToken = async () => {
      try {
        const { data } = await axios.post(`${GITEA_URL}/login/oauth/access_token`, {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        });

        await login(data.access_token);
        navigate('/');
      } catch (err) {
        setError('Failed to authenticate with Gitea');
        console.error(err);
      }
    };

    exchangeToken();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="card">
          <h2>Authentication Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="card">
        <h2>Authenticating...</h2>
      </div>
    </div>
  );
}

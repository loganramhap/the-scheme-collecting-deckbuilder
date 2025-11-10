import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import axios from 'axios';

const GITEA_URL = import.meta.env.VITE_GITEA_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, token, login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated && token) {
      navigate('/');
    }
  }, [isAuthenticated, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up - create account via backend API
        await axios.post(`${API_URL}/provision/user`, {
          username,
          email,
          password,
        });

        // Wait a moment for Gitea to fully create the account
        await new Promise(resolve => setTimeout(resolve, 1000));

        // After successful signup, automatically log in
        const { data } = await axios.post(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
          name: `deckbuilder-${Date.now()}`,
        }, {
          auth: {
            username,
            password,
          },
        });

        await login(data.sha1);
        navigate('/');
      } else {
        // Login
        const { data } = await axios.post(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
          name: `deckbuilder-${Date.now()}`,
        }, {
          auth: {
            username,
            password,
          },
        });

        await login(data.sha1);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth failed:', err);
      
      // Use the specific error message from the backend if available
      const backendError = err.response?.data?.error;
      
      if (backendError) {
        setError(backendError);
      } else if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.status === 409) {
        setError('Username already taken');
      } else if (err.response?.status === 400) {
        setError('Invalid username, email, or password format');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please try again later.');
      } else {
        setError(isSignUp ? 'Sign up failed. Please try again.' : 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🃏</div>
          <h1 style={{ marginBottom: '10px', fontSize: '32px' }}>DeckBuilder</h1>
          <p style={{ color: '#999', fontSize: '16px' }}>
            Version-controlled deck management
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            />
            {isSignUp && (
              <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Letters, numbers, underscores, and hyphens only
              </p>
            )}
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "Choose a strong password" : "Enter your password"}
              required
              disabled={loading}
              minLength={isSignUp ? 6 : undefined}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            />
            {isSignUp && (
              <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                At least 6 characters
              </p>
            )}
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
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '15px',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#0066cc',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

        <p style={{ marginTop: '25px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          🔒 Your decks are automatically backed up with full version history
        </p>
      </div>
    </div>
  );
}

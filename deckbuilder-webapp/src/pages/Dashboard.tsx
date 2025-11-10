import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { giteaService } from '../services/gitea';
import type { GiteaRepo } from '../types/gitea';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [repos, setRepos] = useState<GiteaRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRepos = async () => {
      if (user) {
        try {
          const userRepos = await giteaService.getUserRepos(user.username);
          setRepos(userRepos);
        } catch (error) {
          console.error('Failed to load repos:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadRepos();
  }, [user]);

  const createDeckRepo = async () => {
    try {
      await giteaService.createRepo('decks', false);
      if (user) {
        const userRepos = await giteaService.getUserRepos(user.username);
        setRepos(userRepos);
      }
    } catch (error) {
      console.error('Failed to create repo:', error);
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>DeckBuilder</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Welcome, {user?.username}</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Your Repositories</h2>
          <button className="btn btn-primary" onClick={createDeckRepo}>
            Create Deck Repo
          </button>
        </div>

        {loading ? (
          <p>Loading repositories...</p>
        ) : repos.length === 0 ? (
          <p>No repositories found. Create one to get started!</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {repos.map((repo) => (
              <div key={repo.id} className="card" style={{ padding: '15px' }}>
                <h3>{repo.name}</h3>
                <p style={{ color: '#999', fontSize: '14px', marginTop: '5px' }}>
                  {repo.full_name}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <Link to={`/decks?repo=${repo.full_name}`}>
                    <button className="btn btn-primary">View Decks</button>
                  </Link>
                  <Link to={`/pulls/${repo.owner.username}/${repo.name}`}>
                    <button className="btn btn-secondary">Pull Requests</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

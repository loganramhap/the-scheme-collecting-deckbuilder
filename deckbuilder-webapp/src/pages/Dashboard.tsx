import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { giteaService } from '../services/gitea';
import type { GiteaRepo } from '../types/gitea';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [decks, setDecks] = useState<GiteaRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadDecks = async () => {
      if (user) {
        try {
          const userRepos = await giteaService.getUserRepos(user.username);
          // Filter to only show deck repos (exclude system repos)
          const deckRepos = userRepos.filter(repo => !repo.name.startsWith('.'));
          setDecks(deckRepos);
        } catch (error) {
          console.error('Failed to load decks:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDecks();
  }, [user]);

  const createNewDeck = async () => {
    const deckName = prompt('Enter deck name:');
    if (!deckName) return;

    const game = prompt('Game type (mtg or riftbound):', 'mtg');
    if (!game || !['mtg', 'riftbound'].includes(game)) {
      alert('Invalid game type. Must be "mtg" or "riftbound"');
      return;
    }

    const format = prompt('Format (e.g., commander, modern, standard):', 'commander');
    if (!format) return;

    setCreating(true);

    try {
      // Create a repo for this deck (1 repo = 1 deck)
      const repoName = deckName.toLowerCase().replace(/\s+/g, '-');
      await giteaService.createRepo(repoName, false);

      // Create the deck file
      const newDeck = {
        game,
        format,
        name: deckName,
        cards: [],
        sideboard: [],
        metadata: {
          author: user?.username || 'unknown',
          created: new Date().toISOString().split('T')[0],
          description: '',
        },
      };

      const content = JSON.stringify(newDeck, null, 2);
      
      await giteaService.createOrUpdateFile(
        user!.username,
        repoName,
        'deck.json',
        content,
        'Initial deck creation',
        'main'
      );

      // Reload decks
      if (user) {
        const userRepos = await giteaService.getUserRepos(user.username);
        const deckRepos = userRepos.filter(repo => !repo.name.startsWith('.'));
        setDecks(deckRepos);
      }

      alert('Deck created successfully!');
    } catch (error) {
      console.error('Failed to create deck:', error);
      alert('Failed to create deck');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>🃏 My Decks</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ color: '#999' }}>Welcome, <strong>{user?.username}</strong></span>
          <button className="btn btn-secondary" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ marginBottom: '5px' }}>Your Deck Collection</h2>
            <p style={{ color: '#999', fontSize: '14px' }}>Each deck has full version history and variants</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={createNewDeck}
            disabled={creating}
            style={{ background: '#4caf50', padding: '12px 24px', fontSize: '16px' }}
          >
            {creating ? 'Creating...' : '+ New Deck'}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading your decks...</p>
          </div>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎴</div>
            <h3 style={{ marginBottom: '10px' }}>No decks yet!</h3>
            <p style={{ color: '#999', marginBottom: '30px' }}>
              Create your first deck to get started building and tracking your collection
            </p>
            <button 
              className="btn btn-primary" 
              onClick={createNewDeck}
              style={{ background: '#4caf50', padding: '15px 30px', fontSize: '16px' }}
            >
              Create Your First Deck
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {decks.map((deck) => (
              <div key={deck.id} className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>{deck.name}</h3>
                  <span style={{ fontSize: '24px' }}>🎴</span>
                </div>
                <p style={{ color: '#999', fontSize: '13px', marginBottom: '15px' }}>
                  Deck collection
                </p>
                <Link to={`/deck/${deck.owner.username}/${deck.name}/deck.json`} style={{ textDecoration: 'none' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    Open Deck
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

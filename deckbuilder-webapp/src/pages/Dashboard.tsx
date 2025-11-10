import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { giteaService } from '../services/gitea';
import type { GiteaRepo } from '../types/gitea';
import Modal from '../components/Modal';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [decks, setDecks] = useState<GiteaRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckGame, setNewDeckGame] = useState('mtg');
  const [newDeckFormat, setNewDeckFormat] = useState('commander');
  const [activeTab, setActiveTab] = useState<'all' | 'mtg' | 'riftbound'>('all');
  const [deckMetadata, setDeckMetadata] = useState<Record<string, { game: string; format: string }>>({});

  useEffect(() => {
    const loadDecks = async () => {
      if (user) {
        try {
          const userRepos = await giteaService.getUserRepos(user.username);
          // Filter to only show deck repos (exclude system repos)
          const deckRepos = userRepos.filter(repo => !repo.name.startsWith('.'));
          setDecks(deckRepos);

          // Load metadata for each deck to determine game type
          const metadata: Record<string, { game: string; format: string }> = {};
          for (const repo of deckRepos) {
            try {
              const fileContent = await giteaService.getFileContent(user.username, repo.name, 'deck.json');
              const content = atob(fileContent.content);
              const deck = JSON.parse(content);
              metadata[repo.name] = {
                game: deck.game || 'mtg',
                format: deck.format || 'unknown',
              };
            } catch (error) {
              // If can't read deck file, assume MTG
              metadata[repo.name] = { game: 'mtg', format: 'unknown' };
            }
          }
          setDeckMetadata(metadata);
        } catch (error) {
          console.error('Failed to load decks:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDecks();
  }, [user]);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    setCreating(true);

    try {
      // Create a repo for this deck (1 repo = 1 deck)
      const repoName = newDeckName.toLowerCase().replace(/\s+/g, '-');
      await giteaService.createRepo(repoName, false);

      // Create the deck file
      const newDeck = {
        game: newDeckGame,
        format: newDeckFormat,
        name: newDeckName,
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

      // Reset form and close modal
      setShowCreateModal(false);
      setNewDeckName('');
      setNewDeckGame('mtg');
      setNewDeckFormat('commander');
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
            onClick={() => setShowCreateModal(true)}
            style={{ background: '#4caf50', padding: '12px 24px', fontSize: '16px' }}
          >
            + New Deck
          </button>
        </div>

        {/* Game filter tabs */}
        {decks.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'all' ? '#0066cc' : '#999',
                fontSize: '16px',
                fontWeight: activeTab === 'all' ? '600' : '400',
                cursor: 'pointer',
                padding: '8px 16px',
                borderBottom: activeTab === 'all' ? '2px solid #0066cc' : 'none',
                marginBottom: '-12px',
              }}
            >
              All Decks ({decks.length})
            </button>
            <button
              onClick={() => setActiveTab('mtg')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'mtg' ? '#0066cc' : '#999',
                fontSize: '16px',
                fontWeight: activeTab === 'mtg' ? '600' : '400',
                cursor: 'pointer',
                padding: '8px 16px',
                borderBottom: activeTab === 'mtg' ? '2px solid #0066cc' : 'none',
                marginBottom: '-12px',
              }}
            >
              🃏 MTG ({decks.filter(d => deckMetadata[d.name]?.game === 'mtg').length})
            </button>
            <button
              onClick={() => setActiveTab('riftbound')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'riftbound' ? '#0066cc' : '#999',
                fontSize: '16px',
                fontWeight: activeTab === 'riftbound' ? '600' : '400',
                cursor: 'pointer',
                padding: '8px 16px',
                borderBottom: activeTab === 'riftbound' ? '2px solid #0066cc' : 'none',
                marginBottom: '-12px',
              }}
            >
              ⚔️ Riftbound ({decks.filter(d => deckMetadata[d.name]?.game === 'riftbound').length})
            </button>
          </div>
        )}

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
              onClick={() => setShowCreateModal(true)}
              style={{ background: '#4caf50', padding: '15px 30px', fontSize: '16px' }}
            >
              Create Your First Deck
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {decks
              .filter(deck => {
                if (activeTab === 'all') return true;
                return deckMetadata[deck.name]?.game === activeTab;
              })
              .map((deck) => {
                const meta = deckMetadata[deck.name];
                const gameIcon = meta?.game === 'riftbound' ? '⚔️' : '🃏';
                
                return (
                  <div key={deck.id} className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                      <div>
                        <h3 style={{ margin: 0, marginBottom: '5px' }}>{deck.name}</h3>
                        <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                          {meta?.format || 'Unknown'}
                        </span>
                      </div>
                      <span style={{ fontSize: '24px' }}>{gameIcon}</span>
                    </div>
                    <p style={{ color: '#999', fontSize: '13px', marginBottom: '15px' }}>
                      {meta?.game === 'riftbound' ? 'Riftbound' : 'Magic: The Gathering'}
                    </p>
                    <Link to={`/deck/${deck.owner.username}/${deck.name}/deck.json`} style={{ textDecoration: 'none' }}>
                      <button className="btn btn-primary" style={{ width: '100%' }}>
                        Open Deck
                      </button>
                    </Link>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Deck"
      >
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Deck Name
          </label>
          <input
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="e.g., Najeela Warriors"
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Game
          </label>
          <select
            value={newDeckGame}
            onChange={(e) => setNewDeckGame(e.target.value)}
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          >
            <option value="mtg">Magic: The Gathering</option>
            <option value="riftbound">Riftbound</option>
          </select>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Format
          </label>
          {newDeckGame === 'mtg' ? (
            <select
              value={newDeckFormat}
              onChange={(e) => setNewDeckFormat(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            >
              <option value="commander">Commander</option>
              <option value="modern">Modern</option>
              <option value="standard">Standard</option>
              <option value="legacy">Legacy</option>
              <option value="vintage">Vintage</option>
              <option value="pauper">Pauper</option>
            </select>
          ) : (
            <select
              value={newDeckFormat}
              onChange={(e) => setNewDeckFormat(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
            >
              <option value="ranked">Ranked</option>
              <option value="casual">Casual</option>
              <option value="draft">Draft</option>
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowCreateModal(false)}
            disabled={creating}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreateDeck}
            disabled={creating || !newDeckName.trim()}
            style={{ flex: 1, background: '#4caf50' }}
          >
            {creating ? 'Creating...' : 'Create Deck'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

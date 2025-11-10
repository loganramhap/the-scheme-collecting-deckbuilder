import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { giteaService } from '../services/gitea';

interface DeckFile {
  name: string;
  path: string;
}

export default function DeckList() {
  const [searchParams] = useSearchParams();
  const repo = searchParams.get('repo');
  const [decks, setDecks] = useState<DeckFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDecks = async () => {
      if (!repo) return;
      
      const [owner, repoName] = repo.split('/');
      
      try {
        const contents = await giteaService.getFileContent(owner, repoName, 'decks');
        
        if (Array.isArray(contents)) {
          const deckFiles = contents.filter((file: any) => 
            file.name.endsWith('.deck.json')
          );
          setDecks(deckFiles);
        }
      } catch (error) {
        console.error('Failed to load decks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDecks();
  }, [repo]);

  if (!repo) {
    return <div className="container"><p>No repository specified</p></div>;
  }

  const [owner, repoName] = repo.split('/');

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

    const newDeck = {
      game,
      format,
      name: deckName,
      cards: [],
      sideboard: [],
      metadata: {
        author: 'user',
        created: new Date().toISOString().split('T')[0],
        description: '',
      },
    };

    try {
      const fileName = `decks/${deckName.toLowerCase().replace(/\s+/g, '-')}.deck.json`;
      const content = JSON.stringify(newDeck, null, 2);
      
      await giteaService.createOrUpdateFile(
        owner,
        repoName,
        fileName,
        content,
        `Create new deck: ${deckName}`,
        'main'
      );

      alert('Deck created successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Failed to create deck:', error);
      alert('Failed to create deck');
    }
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '30px' }}>
        <Link to="/" style={{ color: '#0066cc', textDecoration: 'none' }}>← Back to Dashboard</Link>
        <h1 style={{ marginTop: '10px' }}>Decks in {repo}</h1>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Your Decks</h2>
          <button 
            className="btn btn-primary" 
            onClick={createNewDeck}
            style={{ background: '#4caf50' }}
          >
            + Create New Deck
          </button>
        </div>
        {loading ? (
          <p>Loading decks...</p>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🃏</div>
            <p style={{ marginBottom: '20px', color: '#999' }}>No decks found in this repository.</p>
            <p style={{ color: '#666', fontSize: '14px' }}>Click "Create New Deck" above to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {decks.map((deck) => (
              <div key={deck.path} className="card" style={{ padding: '15px' }}>
                <h3>{deck.name.replace('.deck.json', '')}</h3>
                <Link to={`/deck/${owner}/${repoName}/${deck.path}`}>
                  <button className="btn btn-primary" style={{ marginTop: '10px' }}>
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

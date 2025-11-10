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

  return (
    <div className="container">
      <header style={{ marginBottom: '30px' }}>
        <Link to="/" style={{ color: '#0066cc', textDecoration: 'none' }}>← Back to Dashboard</Link>
        <h1 style={{ marginTop: '10px' }}>Decks in {repo}</h1>
      </header>

      <div className="card">
        {loading ? (
          <p>Loading decks...</p>
        ) : decks.length === 0 ? (
          <p>No decks found in this repository.</p>
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

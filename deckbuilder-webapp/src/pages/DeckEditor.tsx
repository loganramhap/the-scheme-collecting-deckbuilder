import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { giteaService } from '../services/gitea';
import { cardService } from '../services/cards';
import { validationService } from '../services/validation';
import { useDeckStore } from '../store/deck';
import type { Deck, ValidationResult } from '../types/deck';
import type { MTGCard } from '../types/card';

export default function DeckEditor() {
  const { owner, repo, path } = useParams<{ owner: string; repo: string; path: string }>();
  const { currentDeck, setDeck, addCard, removeCard, updateCardCount, isDirty, markClean } = useDeckStore();
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MTGCard[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadDeck = async () => {
      if (!owner || !repo || !path) return;

      try {
        const fileContent = await giteaService.getFileContent(owner, repo, path);
        const content = atob(fileContent.content);
        const deck: Deck = JSON.parse(content);
        setDeck(deck);
      } catch (error) {
        console.error('Failed to load deck:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeck();
  }, [owner, repo, path, setDeck]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await cardService.searchMTGCards(searchQuery);
      setSearchResults(results.slice(0, 10));
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddCard = (card: MTGCard) => {
    addCard({
      id: card.id,
      count: 1,
      name: card.name,
      image_url: card.image_uris?.normal,
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleValidate = async () => {
    if (!currentDeck) return;

    const result = currentDeck.game === 'mtg'
      ? await validationService.validateMTGDeck(currentDeck)
      : validationService.validateRiftboundDeck(currentDeck);

    setValidation(result);
  };

  const handleSave = async () => {
    if (!owner || !repo || !path || !currentDeck || !commitMessage.trim()) return;

    setSaving(true);
    try {
      const content = JSON.stringify(currentDeck, null, 2);
      await giteaService.createOrUpdateFile(owner, repo, path, content, commitMessage);
      markClean();
      setCommitMessage('');
      alert('Deck saved successfully!');
    } catch (error) {
      console.error('Failed to save deck:', error);
      alert('Failed to save deck');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container"><p>Loading deck...</p></div>;
  }

  if (!currentDeck) {
    return <div className="container"><p>Deck not found</p></div>;
  }

  const totalCards = currentDeck.cards.reduce((sum, card) => sum + card.count, 0);

  return (
    <div className="container">
      <header style={{ marginBottom: '30px' }}>
        <Link to={`/decks?repo=${owner}/${repo}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
          ← Back to Decks
        </Link>
        <h1 style={{ marginTop: '10px' }}>{currentDeck.name}</h1>
        <p style={{ color: '#999' }}>
          {currentDeck.game.toUpperCase()} • {currentDeck.format} • {totalCards} cards
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className="card">
            <h2>Card Search</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <input
                type="text"
                placeholder="Search for cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleSearch}>
                Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                {searchResults.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      padding: '10px',
                      background: '#333',
                      marginBottom: '10px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{card.name}</strong>
                      <p style={{ fontSize: '12px', color: '#999' }}>{card.type_line}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleAddCard(card)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Validation</h2>
            <button className="btn btn-primary" onClick={handleValidate} style={{ marginTop: '10px' }}>
              Validate Deck
            </button>

            {validation && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ color: validation.valid ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                  {validation.valid ? '✓ Deck is valid' : '✗ Deck has errors'}
                </p>
                {validation.errors.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Errors:</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      {validation.errors.map((error, i) => (
                        <li key={i} style={{ color: '#f44336' }}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Warnings:</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      {validation.warnings.map((warning, i) => (
                        <li key={i} style={{ color: '#ff9800' }}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h2>Decklist ({totalCards} cards)</h2>
            <div style={{ marginTop: '15px', maxHeight: '400px', overflowY: 'auto' }}>
              {currentDeck.cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    padding: '10px',
                    background: '#333',
                    marginBottom: '10px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {card.count}x {card.name || card.id}
                  </span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => updateCardCount(card.id, card.count - 1)}
                      style={{ padding: '5px 10px' }}
                    >
                      -
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => updateCardCount(card.id, card.count + 1)}
                      style={{ padding: '5px 10px' }}
                    >
                      +
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => removeCard(card.id)}
                      style={{ padding: '5px 10px', background: '#d32f2f' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isDirty && (
            <div className="card">
              <h2>Save Changes</h2>
              <input
                type="text"
                placeholder="Commit message..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                style={{ width: '100%', marginTop: '10px' }}
              />
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !commitMessage.trim()}
                style={{ marginTop: '10px', width: '100%' }}
              >
                {saving ? 'Saving...' : 'Commit Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

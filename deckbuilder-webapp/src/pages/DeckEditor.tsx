import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { giteaService } from '../services/gitea';
import { useDeckStore } from '../store/deck';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import SaveStatusIndicator from '../components/deckbuilder/SaveStatusIndicator';
import ManualSaveButton from '../components/deckbuilder/ManualSaveButton';
import { RiftboundBuilder } from '../components/deckbuilder/RiftboundBuilder';
import { MTGCommanderBuilder } from '../components/deckbuilder/MTGCommanderBuilder';
import { DeckStatistics } from '../components/deckbuilder/DeckStatistics';
import { KeyboardShortcutsHelp } from '../components/deckbuilder/KeyboardShortcutsHelp';
import { loadRiftboundCards } from '../services/riftboundCards';
import type { Deck } from '../types/deck';
import type { MTGCard, RiftboundCard } from '../types/card';

export default function DeckEditor() {
  const { owner, repo, path } = useParams<{ owner: string; repo: string; path: string }>();
  const { currentDeck, setDeck, isDirty, markClean } = useDeckStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCards, setAvailableCards] = useState<(MTGCard | RiftboundCard)[]>([]);

  // Auto-save hook
  const { status: autoSaveStatus, triggerSave } = useAutoSave(
    currentDeck,
    isDirty,
    owner,
    repo,
    path,
    {
      enabled: true,
      debounceMs: 30000, // 30 seconds
      onSaveSuccess: () => {
        markClean();
      },
      onSaveError: (error) => {
        console.error('Auto-save failed:', error);
      },
    }
  );

  const loadDeck = async () => {
    if (!owner || !repo || !path) return;

    setLoading(true);
    setError(null);

    try {
      const fileContent = await giteaService.getFileContent(owner, repo, path);
      const content = atob(fileContent.content);
      const deck: Deck = JSON.parse(content);
      setDeck(deck);
      
      // Load available cards based on game type
      if (deck.game === 'mtg') {
        // For MTG, we'll load cards on-demand through search
        // For now, set empty array - cards will be loaded via search
        setAvailableCards([]);
      } else if (deck.game === 'riftbound') {
        // Load Riftbound cards from JSON file
        const riftboundCards = await loadRiftboundCards();
        console.log(`Loaded ${riftboundCards.length} Riftbound cards`);
        setAvailableCards(riftboundCards);
      }
    } catch (err) {
      console.error('Failed to load deck:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deck');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeck();
  }, [owner, repo, path, setDeck]);

  const manualSaveButtonRef = useRef<HTMLButtonElement>(null);

  const handleManualSave = async (message: string) => {
    await triggerSave(message);
  };

  const handleDeckUpdate = (updatedDeck: Deck) => {
    setDeck(updatedDeck);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      description: 'Save deck',
      handler: (e) => {
        e.preventDefault();
        if (isDirty && manualSaveButtonRef.current) {
          manualSaveButtonRef.current.click();
        }
      },
    },
  ]);

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #333',
            borderTop: '4px solid #0066cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading deck...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: '#2a1a1a',
          borderRadius: '8px',
          border: '1px solid #ff4444'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ff4444', marginBottom: '10px' }}>Failed to Load Deck</h2>
          <p style={{ color: '#999', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={loadDeck}
            style={{
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentDeck) {
    return <div className="container"><p>Deck not found</p></div>;
  }

  const totalCards = currentDeck.cards.reduce((sum, card) => sum + card.count, 0);

  return (
    <div className="container">
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Link to={`/decks?repo=${owner}/${repo}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
              ← Back to Decks
            </Link>
            <h1 style={{ marginTop: '10px' }}>{currentDeck.name}</h1>
            <p style={{ color: '#999' }}>
              {currentDeck.game.toUpperCase()}
              {currentDeck.game !== 'riftbound' && ` • ${currentDeck.format}`}
              {' • '}{totalCards} cards
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <SaveStatusIndicator status={autoSaveStatus} isDirty={isDirty} />
            <ManualSaveButton
              ref={manualSaveButtonRef}
              onSave={handleManualSave}
              disabled={!isDirty}
              isSaving={autoSaveStatus.isSaving}
            />
          </div>
        </div>
      </header>

      {/* Riftbound uses full-width layout */}
      {currentDeck.game === 'riftbound' && (
        <RiftboundBuilder
          deck={currentDeck}
          onDeckUpdate={handleDeckUpdate}
          availableCards={availableCards as RiftboundCard[]}
        />
      )}

      {/* MTG uses grid layout with sidebar */}
      {currentDeck.game === 'mtg' && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
          {/* Game-specific visual builder */}
          <div>
            {currentDeck.format === 'commander' && (
              <MTGCommanderBuilder
                deck={currentDeck}
                onDeckUpdate={handleDeckUpdate}
                availableCards={availableCards as MTGCard[]}
              />
            )}
            
            {currentDeck.format !== 'commander' && (
              <div className="card">
                <h2>Visual Builder</h2>
                <p style={{ color: '#999', marginTop: '10px' }}>
                  Visual deck builder is currently only available for Commander format.
                  Standard MTG formats coming soon!
                </p>
              </div>
            )}
          </div>

          {/* Deck statistics sidebar */}
          <div>
            <DeckStatistics deck={currentDeck} />
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help button */}
      <KeyboardShortcutsHelp />
    </div>
  );
}

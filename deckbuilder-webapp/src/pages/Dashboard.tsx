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
  const [deckMetadata, setDeckMetadata] = useState<Record<string, { game: string; format: string; tags?: string[]; commanderImage?: string }>>({});
  const [deletingDeck, setDeletingDeck] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [tagFeedback, setTagFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadDecks = async () => {
      if (user) {
        try {
          const userRepos = await giteaService.getUserRepos(user.username);
          // Filter to only show deck repos (exclude system repos)
          const deckRepos = userRepos.filter(repo => !repo.name.startsWith('.'));
          setDecks(deckRepos);

          // Load metadata for each deck to determine game type
          const metadata: Record<string, { game: string; format: string; tags?: string[]; commanderImage?: string }> = {};
          for (const repo of deckRepos) {
            try {
              const fileContent = await giteaService.getFileContent(user.username, repo.name, 'deck.json');
              const content = atob(fileContent.content);
              const deck = JSON.parse(content);
              
              console.log(`Loaded deck ${repo.name}:`, { game: deck.game, format: deck.format });
              
              // Get commander/featured card image
              let commanderImage = undefined;
              if (deck.commander?.image_url) {
                commanderImage = deck.commander.image_url;
              } else if (deck.featured_card?.image_url) {
                commanderImage = deck.featured_card.image_url;
              } else if (deck.commander?.id && deck.game === 'mtg') {
                // Try to get from Scryfall if we have an ID
                commanderImage = `https://api.scryfall.com/cards/${deck.commander.id}?format=image&version=art_crop`;
              }
              
              metadata[repo.name] = {
                game: deck.game || 'mtg',
                format: deck.format || 'unknown',
                tags: deck.metadata?.tags || [],
                commanderImage,
              };
            } catch (error) {
              console.error(`Failed to load deck ${repo.name}:`, error);
              // If can't read deck file, mark as unknown
              metadata[repo.name] = { game: 'unknown', format: 'unknown', tags: [] };
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
        format: newDeckGame === 'riftbound' ? 'standard' : newDeckFormat,
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

  const handleDeleteDeck = async (deckName: string) => {
    if (!confirm(`Are you sure you want to delete "${deckName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingDeck(deckName);

    try {
      await giteaService.deleteRepo(user!.username, deckName);
      
      // Remove from local state
      setDecks(decks.filter(d => d.name !== deckName));
      const newMetadata = { ...deckMetadata };
      delete newMetadata[deckName];
      setDeckMetadata(newMetadata);
    } catch (error) {
      console.error('Failed to delete deck:', error);
      alert('Failed to delete deck');
    } finally {
      setDeletingDeck(null);
    }
  };

  const handleAddTag = async (deckName: string, tag: string) => {
    if (!tag.trim()) return;

    try {
      // Load current deck
      const deck = await giteaService.getDeck(user!.username, deckName);

      // Add tag (prevent duplicates)
      if (!deck.metadata.tags) {
        deck.metadata.tags = [];
      }
      
      const trimmedTag = tag.trim();
      if (deck.metadata.tags.includes(trimmedTag)) {
        setTagFeedback({ message: `Tag "${trimmedTag}" already exists`, type: 'error' });
        setTimeout(() => setTagFeedback(null), 3000);
        return;
      }
      
      deck.metadata.tags.push(trimmedTag);

      // Save with commit message
      await giteaService.updateDeck(
        user!.username,
        deckName,
        deck,
        `Add tag: ${trimmedTag}`
      );

      // Update local state
      setDeckMetadata({
        ...deckMetadata,
        [deckName]: {
          ...deckMetadata[deckName],
          tags: deck.metadata.tags,
        },
      });

      setNewTag('');
      
      // Show success feedback
      setTagFeedback({ message: `Tag "${trimmedTag}" added!`, type: 'success' });
      setTimeout(() => setTagFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to add tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add tag';
      setTagFeedback({ message: errorMessage, type: 'error' });
      setTimeout(() => setTagFeedback(null), 3000);
    }
  };

  const handleRemoveTag = async (deckName: string, tagToRemove: string) => {
    try {
      // Load current deck
      const deck = await giteaService.getDeck(user!.username, deckName);

      // Remove tag
      if (deck.metadata.tags) {
        deck.metadata.tags = deck.metadata.tags.filter((t: string) => t !== tagToRemove);
      }

      // Save with commit message
      await giteaService.updateDeck(
        user!.username,
        deckName,
        deck,
        `Remove tag: ${tagToRemove}`
      );

      // Update local state after removal
      setDeckMetadata({
        ...deckMetadata,
        [deckName]: {
          ...deckMetadata[deckName],
          tags: deck.metadata.tags,
        },
      });

      // Show success feedback when tag is removed
      setTagFeedback({ message: `Tag "${tagToRemove}" removed!`, type: 'success' });
      setTimeout(() => setTagFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to remove tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove tag';
      setTagFeedback({ message: errorMessage, type: 'error' });
      setTimeout(() => setTagFeedback(null), 3000);
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
                  <div key={deck.id} className="card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
                    <button
                      onClick={() => handleDeleteDeck(deck.name)}
                      disabled={deletingDeck === deck.name}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#d32f2f',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        opacity: 0.9,
                        transition: 'opacity 0.2s',
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                      title="Delete deck"
                    >
                      {deletingDeck === deck.name ? '...' : '🗑️'}
                    </button>

                    {/* Commander/Featured Card Image */}
                    {meta?.commanderImage && (
                      <div style={{ 
                        width: '100%', 
                        height: '200px', 
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(26,26,26,0.9)), url(${meta.commanderImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      }}>
                        <div style={{ 
                          position: 'absolute', 
                          bottom: '15px', 
                          left: '20px', 
                          right: '20px',
                        }}>
                          <h3 style={{ margin: 0, marginBottom: '5px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {deck.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {meta?.game !== 'riftbound' && (
                              <span style={{ fontSize: '12px', color: '#ddd', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                {meta?.format || 'Unknown'}
                              </span>
                            )}
                            <span style={{ fontSize: '20px' }}>{gameIcon}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ padding: meta?.commanderImage ? '15px 20px 20px' : '20px' }}>
                      {!meta?.commanderImage && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px', paddingRight: '40px' }}>
                          <div>
                            <h3 style={{ margin: 0, marginBottom: '5px' }}>{deck.name}</h3>
                            {meta?.game !== 'riftbound' && (
                              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                                {meta?.format || 'Unknown'}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '24px' }}>{gameIcon}</span>
                        </div>
                      )}

                    <div style={{ marginBottom: '12px', minHeight: '28px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {meta?.tags && meta.tags.length > 0 && meta.tags.map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '12px',
                              padding: '4px 10px',
                              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                              border: '1px solid #444',
                              borderRadius: '14px',
                              color: '#4a9eff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #333 0%, #2a2a2a 100%)';
                              e.currentTarget.style.borderColor = '#555';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)';
                              e.currentTarget.style.borderColor = '#444';
                            }}
                          >
                            {tag}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveTag(deck.name, tag);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '16px',
                                lineHeight: '1',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s ease',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ff4444'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                              title="Remove tag"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingTags(deck.name);
                          }}
                          style={{
                            background: 'none',
                            border: '1px dashed #555',
                            color: '#888',
                            borderRadius: '14px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s ease',
                            fontWeight: '500',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#0066cc';
                            e.currentTarget.style.color = '#0066cc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#555';
                            e.currentTarget.style.color = '#888';
                          }}
                          title="Add tag"
                        >
                          + tag
                        </button>
                      </div>
                    </div>

                      {!meta?.commanderImage && (
                        <p style={{ color: '#999', fontSize: '13px', marginBottom: '15px' }}>
                          {meta?.game === 'riftbound' ? 'Riftbound' : 'Magic: The Gathering'}
                        </p>
                      )}
                      <Link to={`/deck/${deck.owner.username}/${deck.name}/deck.json`} style={{ textDecoration: 'none' }}>
                        <button className="btn btn-primary" style={{ width: '100%' }}>
                          Open Deck
                        </button>
                      </Link>
                    </div>
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

        {newDeckGame === 'mtg' && (
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Format
            </label>
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
          </div>
        )}

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

      <Modal
        isOpen={editingTags !== null}
        onClose={() => {
          setEditingTags(null);
          setNewTag('');
          setTagFeedback(null);
        }}
        title="Add Tag"
      >
        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
          Add tags to organize and categorize your decks
        </p>

        {tagFeedback && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              background: tagFeedback.type === 'success' ? '#1a4d2e' : '#4d1a1a',
              border: `1px solid ${tagFeedback.type === 'success' ? '#2d7a4f' : '#7a2d2d'}`,
              color: tagFeedback.type === 'success' ? '#4ade80' : '#ff6b6b',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{tagFeedback.type === 'success' ? '✓' : '⚠'}</span>
            <span>{tagFeedback.message}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingTags && newTag.trim()) {
              handleAddTag(editingTags, newTag);
            }
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name..."
              style={{ 
                width: '100%', 
                padding: '14px', 
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#1a1a1a',
                color: '#fff',
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingTags(null);
                setNewTag('');
                setTagFeedback(null);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newTag.trim()}
              style={{ flex: 1, background: '#0066cc' }}
            >
              Add Tag
            </button>
          </div>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #333' }}>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px', fontWeight: '500' }}>
            Quick Add:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'competitive', icon: '🏆' },
              { label: 'casual', icon: '🎮' },
              { label: 'budget', icon: '💰' },
              { label: 'tested', icon: '✓' },
              { label: 'wip', icon: '🔨' },
              { label: 'tournament', icon: '🎯' },
              { label: 'combo', icon: '⚡' },
              { label: 'aggro', icon: '⚔️' },
              { label: 'control', icon: '🛡️' },
              { label: 'midrange', icon: '⚖️' },
            ].map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => {
                  if (editingTags) {
                    handleAddTag(editingTags, label);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                  border: '1px solid #444',
                  color: '#4a9eff',
                  borderRadius: '14px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)';
                  e.currentTarget.style.color = '#4a9eff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

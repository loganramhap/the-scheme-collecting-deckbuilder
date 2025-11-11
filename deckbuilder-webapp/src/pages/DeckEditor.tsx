import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { giteaService } from '../services/gitea';
import { versionControlService } from '../services/versionControl';
import { useDeckStore } from '../store/deck';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useToast } from '../hooks/useToast';
import { useCommitHistory } from '../hooks/useCommitHistory';
import SaveStatusIndicator from '../components/deckbuilder/SaveStatusIndicator';
import ManualSaveButton from '../components/deckbuilder/ManualSaveButton';
import { RiftboundBuilder } from '../components/deckbuilder/RiftboundBuilder';
import { MTGCommanderBuilder } from '../components/deckbuilder/MTGCommanderBuilder';
import { KeyboardShortcutsHelp } from '../components/deckbuilder/KeyboardShortcutsHelp';
import { HistoryPanel } from '../components/versioning/HistoryPanel';
import { BranchSelector } from '../components/versioning/BranchSelector';
import { loadRiftboundCards } from '../services/riftboundCards';
import { migrateRiftboundDeck, needsMigration } from '../utils/deckMigration';
import type { Deck } from '../types/deck';
import type { MTGCard, RiftboundCard } from '../types/card';

export default function DeckEditor() {
  const { owner, repo, path } = useParams<{ owner: string; repo: string; path: string }>();
  const navigate = useNavigate();
  const { currentDeck, setDeck, setRestoredDeck, isDirty, markClean } = useDeckStore();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading deck...');
  const [error, setError] = useState<string | null>(null);
  const [availableCards, setAvailableCards] = useState<(MTGCard | RiftboundCard)[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState('main');
  const { showToast, ToastContainer } = useToast();

  // Fetch commit history to get commit count
  const { commits } = useCommitHistory({
    owner: owner || '',
    repo: repo || '',
    branch: currentBranch,
    perPage: 20,
    enabled: !!owner && !!repo,
  });

  // Auto-save hook
  const { status: autoSaveStatus, triggerSave } = useAutoSave(
    currentDeck,
    isDirty,
    owner,
    repo,
    path,
    currentBranch,
    {
      enabled: true,
      debounceMs: 30000, // 30 seconds
      onSaveSuccess: () => {
        markClean();
      },
      onSaveError: (error) => {
        console.error('Auto-save failed:', error);
        showToast('Auto-save failed: ' + error.message, 'error');
      },
    }
  );

  const loadDeck = async (forceRefreshCards = false) => {
    if (!owner || !repo || !path) return;

    setLoading(true);
    setLoadingMessage('Loading deck...');
    setError(null);

    try {
      // Get branch from URL query params, default to 'main'
      const searchParams = new URLSearchParams(window.location.search);
      const branch = searchParams.get('branch') || 'main';
      setCurrentBranch(branch);

      const fileContent = await giteaService.getFileContent(owner, repo, path, branch);
      const content = atob(fileContent.content);
      let deck: Deck = JSON.parse(content);
      
      // Load available cards based on game type
      if (deck.game === 'mtg') {
        // For MTG, we'll load cards on-demand through search
        // For now, set empty array - cards will be loaded via search
        setAvailableCards([]);
        setDeck(deck);
        markClean(); // Mark as clean since we just loaded from the branch
      } else if (deck.game === 'riftbound') {
        // Load Riftbound cards (from API or JSON file with automatic fallback)
        setLoadingMessage(forceRefreshCards ? 'Refreshing card data...' : 'Loading card database...');
        const riftboundCards = await loadRiftboundCards(
          forceRefreshCards,
          (message) => setLoadingMessage(message)
        );
        console.log(`Loaded ${riftboundCards.length} Riftbound cards`);
        setAvailableCards(riftboundCards);
        
        // Detect old deck format and apply migration if needed
        if (needsMigration(deck)) {
          console.log('Old deck format detected, applying migration...');
          const migrationResult = migrateRiftboundDeck(deck, riftboundCards);
          
          if (migrationResult.migrated) {
            console.log('Deck migration completed:', migrationResult.changes);
            deck = migrationResult.deck;
            
            // Save migrated deck in new format
            try {
              const deckJson = JSON.stringify(deck, null, 2);
              await giteaService.createOrUpdateFile(
                owner,
                repo,
                path,
                deckJson,
                'Auto-migration: Updated deck to new format with separate rune deck and battlefields',
                branch,
                fileContent.sha
              );
              console.log('Migrated deck saved successfully');
              showToast('Deck migrated to new format', 'success');
            } catch (saveError) {
              console.error('Failed to save migrated deck:', saveError);
              showToast('Deck migrated but failed to save. Changes will be saved on next manual save.', 'info');
            }
          }
        }
        
        setDeck(deck);
        markClean(); // Mark as clean since we just loaded from the branch
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
  }, [owner, repo, path]);

  const manualSaveButtonRef = useRef<HTMLButtonElement>(null);

  const handleManualSave = async (message: string) => {
    try {
      const commitSha = await triggerSave(message);
      
      if (commitSha) {
        const shortSha = commitSha.substring(0, 7);
        showToast(`Saved successfully! Commit: ${shortSha}`, 'success');
      } else {
        showToast('Saved successfully!', 'success');
      }
    } catch (error) {
      showToast('Save failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      throw error; // Re-throw so the modal can handle it
    }
  };

  const handleDeckUpdate = (updatedDeck: Deck) => {
    setDeck(updatedDeck);
  };

  const handleBranchSwitch = async (branchName: string) => {
    if (!owner || !repo || !path) {
      throw new Error('Missing repository information');
    }

    try {
      // Switch to the branch and load its deck state
      const deck = await versionControlService.switchBranch(owner, repo, branchName, path);
      
      // Update the deck in the store
      setDeck(deck);
      markClean(); // Mark as clean since we just loaded from the branch
      
      // Update current branch
      setCurrentBranch(branchName);
      
      // Update URL to reflect the branch
      navigate(`/deck/${owner}/${repo}/${path}?branch=${branchName}`, { replace: true });
      
      // Show success notification
      showToast(`Switched to branch: ${branchName}`, 'success');
    } catch (error) {
      console.error('Failed to switch branch:', error);
      throw error; // Re-throw so BranchSelector can handle it
    }
  };

  const handleCreateBranch = () => {
    // TODO: Implement branch creation modal (Task 19)
    showToast('Branch creation coming soon!', 'info');
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
    {
      key: 'h',
      ctrl: true,
      description: 'Open history panel',
      handler: (e) => {
        e.preventDefault();
        setIsHistoryPanelOpen((prev) => !prev);
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
          <p>{loadingMessage}</p>
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
            onClick={() => loadDeck()}
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
      <ToastContainer />
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Link to={`/decks?repo=${owner}/${repo}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
              ← Back to Decks
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <h1 style={{ margin: 0 }}>{currentDeck.name}</h1>
              {/* Branch indicator badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: currentBranch === 'main' || currentBranch === 'master' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 3.25C5 2.56 5.56 2 6.25 2C6.94 2 7.5 2.56 7.5 3.25C7.5 3.69 7.29 4.08 6.96 4.32V5.5C6.96 6.33 7.63 7 8.46 7H9.54C10.37 7 11.04 6.33 11.04 5.5V4.32C10.71 4.08 10.5 3.69 10.5 3.25C10.5 2.56 11.06 2 11.75 2C12.44 2 13 2.56 13 3.25C13 3.94 12.44 4.5 11.75 4.5H11.54V5.5C11.54 6.61 10.65 7.5 9.54 7.5H8.46C7.35 7.5 6.46 6.61 6.46 5.5V4.5H6.25C5.56 4.5 5 3.94 5 3.25ZM3.25 9C2.56 9 2 9.56 2 10.25C2 10.94 2.56 11.5 3.25 11.5C3.94 11.5 4.5 10.94 4.5 10.25C4.5 9.56 3.94 9 3.25 9ZM11.75 9C11.06 9 10.5 9.56 10.5 10.25C10.5 10.94 11.06 11.5 11.75 11.5C12.44 11.5 13 10.94 13 10.25C13 9.56 12.44 9 11.75 9Z"
                    fill="currentColor"
                  />
                </svg>
                {currentBranch}
              </span>
            </div>
            <p style={{ color: '#999', marginTop: '8px' }}>
              {currentDeck.game.toUpperCase()}
              {currentDeck.game !== 'riftbound' && ` • ${currentDeck.format}`}
              {' • '}{totalCards} cards
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <SaveStatusIndicator status={autoSaveStatus} isDirty={isDirty} />
            {owner && repo && (
              <BranchSelector
                owner={owner}
                repo={repo}
                currentBranch={currentBranch}
                onSwitch={handleBranchSwitch}
                onCreateBranch={handleCreateBranch}
                onMergeComplete={handleBranchSwitch}
                hasUnsavedChanges={isDirty}
                showToast={showToast}
              />
            )}
            <button
              onClick={() => setIsHistoryPanelOpen(true)}
              style={{
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#374151';
                e.currentTarget.style.borderColor = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1f2937';
                e.currentTarget.style.borderColor = '#374151';
              }}
              title="View commit history (Ctrl+H)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 2C4.686 2 2 4.686 2 8C2 11.314 4.686 14 8 14C11.314 14 14 11.314 14 8C14 4.686 11.314 2 8 2ZM8 12.8C5.348 12.8 3.2 10.652 3.2 8C3.2 5.348 5.348 3.2 8 3.2C10.652 3.2 12.8 5.348 12.8 8C12.8 10.652 10.652 12.8 8 12.8Z"
                  fill="currentColor"
                />
                <path
                  d="M8.6 5.2H7.4V8.6L10.2 10.2L10.8 9.2L8.6 7.96V5.2Z"
                  fill="currentColor"
                />
              </svg>
              History
              {commits.length > 0 && (
                <span
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {commits.length}
                </span>
              )}
            </button>
            <ManualSaveButton
              ref={manualSaveButtonRef}
              onSave={handleManualSave}
              disabled={!isDirty}
              isSaving={autoSaveStatus.isSaving}
              owner={owner}
              repo={repo}
              path={path}
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

      {/* MTG uses full-width layout */}
      {currentDeck.game === 'mtg' && (
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
      )}

      {/* Keyboard shortcuts help button */}
      <KeyboardShortcutsHelp />

      {/* History Panel */}
      {owner && repo && (
        <HistoryPanel
          isOpen={isHistoryPanelOpen}
          onClose={() => setIsHistoryPanelOpen(false)}
          owner={owner}
          repo={repo}
          branch={currentBranch}
          currentDeck={currentDeck}
          onCompare={(sha1, sha2) => {
            console.log('Compare commits:', sha1, sha2);
          }}
          onRestore={(restoredDeck, commit) => {
            // Load the historical deck state into the editor and mark as dirty
            // Store the commit info so we can generate a restoration message
            setRestoredDeck(restoredDeck, commit);
            
            // User will need to save to commit the restoration
            const shortSha = commit.sha.substring(0, 7);
            showToast(
              `Restored to version ${shortSha}. Save to commit the restoration.`,
              'success'
            );
            
            // Close the history panel
            setIsHistoryPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}

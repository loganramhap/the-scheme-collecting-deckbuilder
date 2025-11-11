import { useState, forwardRef, useEffect } from 'react';
import { CommitMessageModal } from '../versioning/CommitMessageModal';
import { giteaService } from '../../services/gitea';
import { deckDiffService } from '../../services/deckDiff';
import { useDeckStore } from '../../store/deck';
import type { Deck } from '../../types/deck';
import type { DeckDiff, CardChangeAnnotation } from '../../types/versioning';

interface ManualSaveButtonProps {
  onSave: (message: string, annotations?: CardChangeAnnotation[]) => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
  owner?: string;
  repo?: string;
  path?: string;
}

const ManualSaveButton = forwardRef<HTMLButtonElement, ManualSaveButtonProps>(
  ({ onSave, disabled, isSaving, owner, repo, path }, ref) => {
  const [showModal, setShowModal] = useState(false);
  const [diff, setDiff] = useState<DeckDiff | undefined>();
  const [suggestedMessage, setSuggestedMessage] = useState<string>('');
  const [isCalculatingDiff, setIsCalculatingDiff] = useState(false);
  const [recentMessages, setRecentMessages] = useState<string[]>([]);
  const { currentDeck, restoredFromCommit } = useDeckStore();

  // Load recent messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentCommitMessages');
    if (stored) {
      try {
        const messages = JSON.parse(stored);
        if (Array.isArray(messages)) {
          setRecentMessages(messages.slice(0, 5)); // Keep only last 5
        }
      } catch (error) {
        console.error('Failed to load recent messages:', error);
      }
    }
  }, []);

  // Calculate diff and generate suggested message when modal opens
  const handleOpenModal = async () => {
    setShowModal(true);
    
    if (!currentDeck || !owner || !repo || !path) {
      return;
    }

    setIsCalculatingDiff(true);
    
    try {
      // Check if this is a restoration
      if (restoredFromCommit) {
        // Generate restoration commit message
        const shortSha = restoredFromCommit.sha.substring(0, 7);
        const restorationMessage = `Restore version from ${shortSha}: ${restoredFromCommit.message}`;
        setSuggestedMessage(restorationMessage);
        
        // Still calculate diff for preview
        const fileContent = await giteaService.getFileContent(owner, repo, path);
        const savedDeckJson = atob(fileContent.content);
        const savedDeck: Deck = JSON.parse(savedDeckJson);
        const calculatedDiff = deckDiffService.calculateDiff(savedDeck, currentDeck);
        setDiff(calculatedDiff);
      } else {
        // Normal save - fetch the saved deck from Gitea
        const fileContent = await giteaService.getFileContent(owner, repo, path);
        const savedDeckJson = atob(fileContent.content);
        const savedDeck: Deck = JSON.parse(savedDeckJson);

        // Calculate diff between saved and current deck
        const calculatedDiff = deckDiffService.calculateDiff(savedDeck, currentDeck);
        setDiff(calculatedDiff);

        // Generate suggested commit message from diff
        const summary = deckDiffService.summarizeChanges(calculatedDiff);
        setSuggestedMessage(summary !== 'No changes' ? summary : 'Updated deck');
      }
    } catch (error) {
      console.error('Failed to calculate diff:', error);
      // Set a generic message if diff calculation fails
      setSuggestedMessage('Updated deck');
    } finally {
      setIsCalculatingDiff(false);
    }
  };

  const handleCommit = async (message: string, annotations?: CardChangeAnnotation[]) => {
    try {
      await onSave(message, annotations);
      
      // Save to recent messages
      const updatedMessages = [message, ...recentMessages.filter(m => m !== message)].slice(0, 5);
      setRecentMessages(updatedMessages);
      localStorage.setItem('recentCommitMessages', JSON.stringify(updatedMessages));
      
      setShowModal(false);
      setDiff(undefined);
      setSuggestedMessage('');
    } catch (error) {
      // Error will be handled by parent component
      throw error;
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setDiff(undefined);
    setSuggestedMessage('');
  };

  return (
    <>
      <button
        ref={ref}
        className="btn btn-primary"
        onClick={handleOpenModal}
        disabled={disabled || isSaving}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>💾</span>
        <span>Save Now</span>
      </button>

      <CommitMessageModal
        isOpen={showModal}
        onClose={handleClose}
        onCommit={handleCommit}
        suggestedMessage={isCalculatingDiff ? 'Calculating changes...' : suggestedMessage}
        diff={diff}
        recentMessages={recentMessages}
      />
    </>
  );
});

ManualSaveButton.displayName = 'ManualSaveButton';

export default ManualSaveButton;

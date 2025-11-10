import { useState, forwardRef } from 'react';
import Modal from '../Modal';

interface ManualSaveButtonProps {
  onSave: (message: string) => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
}

const ManualSaveButton = forwardRef<HTMLButtonElement, ManualSaveButtonProps>(
  ({ onSave, disabled, isSaving }, ref) => {
  const [showModal, setShowModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!commitMessage.trim()) return;

    setSaving(true);
    try {
      await onSave(commitMessage);
      setCommitMessage('');
      setShowModal(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      setShowModal(false);
      setCommitMessage('');
    }
  };

  return (
    <>
      <button
        ref={ref}
        className="btn btn-primary"
        onClick={() => setShowModal(true)}
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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCommitMessage('');
        }}
        title="Save Deck"
      >
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="commit-message"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
            }}
          >
            Commit Message
          </label>
          <textarea
            id="commit-message"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your changes..."
            autoFocus
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
            Tip: Press Ctrl+Enter to save quickly
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowModal(false);
              setCommitMessage('');
            }}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!commitMessage.trim() || saving}
          >
            {saving ? 'Saving...' : 'Commit Changes'}
          </button>
        </div>
      </Modal>
    </>
  );
});

ManualSaveButton.displayName = 'ManualSaveButton';

export default ManualSaveButton;

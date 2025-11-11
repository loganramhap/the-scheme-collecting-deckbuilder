import React from 'react';

interface RecentMessagesProps {
  messages: string[];
  onSelectMessage: (message: string) => void;
}

/**
 * Component to display recent commit messages as quick-select buttons
 * Based on Requirement 9.5
 */
export const RecentMessages: React.FC<RecentMessagesProps> = ({
  messages,
  onSelectMessage,
}) => {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="recent-messages">
      <label className="recent-messages-label">
        Recent Messages
      </label>
      
      <div className="recent-messages-list">
        {messages.map((message, index) => (
          <button
            key={`${message}-${index}`}
            type="button"
            className="recent-message-button"
            onClick={() => onSelectMessage(message)}
            title={message}
          >
            <span className="recent-message-icon">🕒</span>
            <span className="recent-message-text">{message}</span>
          </button>
        ))}
      </div>

      <style>{`
        .recent-messages {
          margin-bottom: 1rem;
        }

        .recent-messages-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .recent-messages-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .recent-message-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background-color: white;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .recent-message-button:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        .recent-message-button:active {
          transform: scale(0.98);
        }

        .recent-message-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .recent-message-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

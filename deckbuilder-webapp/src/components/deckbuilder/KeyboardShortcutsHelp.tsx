import React, { useState } from 'react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import Modal from '../Modal';

export const KeyboardShortcutsHelp: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  // Show help with ? key
  useKeyboardShortcuts([
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      handler: () => setShowHelp(true),
    },
  ]);

  const shortcuts = [
    { keys: 'Ctrl + S', description: 'Save deck manually' },
    { keys: '← →', description: 'Navigate cards left/right' },
    { keys: '↑ ↓', description: 'Navigate cards up/down' },
    { keys: 'Enter', description: 'Add selected card to deck' },
    { keys: 'Escape', description: 'Clear card selection' },
    { keys: 'Tab', description: 'Navigate through filters' },
    { keys: 'Shift + ?', description: 'Show this help' },
  ];

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#444',
          color: '#fff',
          border: '1px solid #666',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#555';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#444';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Keyboard shortcuts (Shift + ?)"
      >
        ?
      </button>

      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Keyboard Shortcuts"
      >
        <div style={{ maxWidth: '500px' }}>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Use these keyboard shortcuts to navigate and interact with the deck builder more efficiently.
          </p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #444' }}>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '10px', 
                  color: '#fff',
                  fontWeight: 600 
                }}>
                  Keys
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '10px', 
                  color: '#fff',
                  fontWeight: 600 
                }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr 
                  key={index}
                  style={{ 
                    borderBottom: '1px solid #333',
                  }}
                >
                  <td style={{ 
                    padding: '12px 10px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#0066cc',
                    fontWeight: 500,
                  }}>
                    {shortcut.keys}
                  </td>
                  <td style={{ 
                    padding: '12px 10px',
                    color: '#ccc',
                    fontSize: '14px',
                  }}>
                    {shortcut.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            background: '#2a2a2a',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#999',
          }}>
            <strong style={{ color: '#fff' }}>Tip:</strong> Most shortcuts work when you're not typing in an input field.
          </div>
        </div>
      </Modal>
    </>
  );
};

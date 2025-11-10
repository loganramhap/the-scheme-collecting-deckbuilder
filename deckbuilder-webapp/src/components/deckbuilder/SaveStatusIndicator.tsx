import type { AutoSaveStatus } from '../../hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: AutoSaveStatus;
  isDirty: boolean;
}

export default function SaveStatusIndicator({ status, isDirty }: SaveStatusIndicatorProps) {
  const { isSaving, lastSaved, error } = status;

  // Determine status text and color
  let statusText: string;
  let statusColor: string;
  let icon: string;

  if (error) {
    statusText = 'Save failed';
    statusColor = '#f44336';
    icon = '⚠';
  } else if (isSaving) {
    statusText = 'Saving...';
    statusColor = '#ff9800';
    icon = '⟳';
  } else if (isDirty) {
    statusText = 'Unsaved changes';
    statusColor = '#ff9800';
    icon = '●';
  } else {
    statusText = 'Saved';
    statusColor = '#4caf50';
    icon = '✓';
  }

  // Format last saved time
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#2a2a2a',
        borderRadius: '4px',
        fontSize: '14px',
      }}
    >
      <span
        style={{
          color: statusColor,
          fontSize: '16px',
          animation: isSaving ? 'spin 1s linear infinite' : 'none',
        }}
      >
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ color: statusColor, fontWeight: 500 }}>
          {statusText}
        </span>
        {lastSaved && !isDirty && !error && (
          <span style={{ fontSize: '12px', color: '#999' }}>
            Last saved {formatLastSaved(lastSaved)}
          </span>
        )}
        {error && (
          <span style={{ fontSize: '12px', color: '#f44336' }}>
            {error}
          </span>
        )}
      </div>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

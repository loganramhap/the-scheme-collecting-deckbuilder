import React from 'react';

interface AutoSaveIndicatorProps {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isDirty: _isDirty,
  isSaving: _isSaving,
  lastSaved: _lastSaved,
}) => {
  // TODO: Implement auto-save status indicator
  return (
    <div className="auto-save-indicator">
      <p>Auto Save Indicator - To be implemented</p>
    </div>
  );
};

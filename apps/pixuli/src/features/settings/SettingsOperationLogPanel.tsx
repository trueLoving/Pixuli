import React from 'react';
import OperationLogModal from '@/features/operation-log/OperationLogModal';

export const SettingsOperationLogPanel: React.FC = () => {
  return (
    <div className="settings-operation-log-panel flex min-h-0 flex-1 flex-col">
      <OperationLogModal isOpen embedded onClose={() => undefined} />
    </div>
  );
};

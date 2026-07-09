import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { useEscapeKey } from '@pixuli/ui';
import { useI18n } from '@/i18n/useI18n';
import { WorkspaceManagePanel } from '@/features/workspace/WorkspaceManagePanel';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  useEscapeKey(() => {
    if (isOpen) onClose();
  }, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2
              id="workspace-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t('workspace.manageTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label={t('settings.close')}
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[min(90vh,720px)] overflow-y-auto px-6 py-5">
          <WorkspaceManagePanel />
        </div>
      </div>
    </div>
  );
};

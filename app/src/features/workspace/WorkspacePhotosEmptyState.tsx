import { FolderOpen } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/useI18n';
import { ROUTES } from '@/router/routes';

export const WorkspacePhotosEmptyState: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 px-8 py-10 text-center">
        <FolderOpen className="mx-auto mb-4 text-gray-400" size={40} />
        <h2 className="text-lg font-semibold text-gray-900">
          {t('workspace.setupTitle')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('settings.workspacePhotosEmptyHint')}
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.WORKSPACE)}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('workspace.openWorkspacePage')}
        </button>
      </div>
    </div>
  );
};

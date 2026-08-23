import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import { useI18n } from '@/i18n/useI18n';
import { ROUTES } from '@/router/routes';

export const WorkspacePhotosEmptyState: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-xl border border-dashed border-[var(--pix-lilac,#c4b5fd)] bg-[var(--pix-surface,#faf8ff)] px-8 py-10 text-center">
        <div className="mb-4 flex justify-center">
          <BrandPixelMark variant="welcome" size={96} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {t('workspace.setupTitle')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('settings.workspacePhotosEmptyHint')}
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.WORKSPACE)}
          className="mt-6 inline-flex items-center justify-center pix-btn-primary px-4 py-2 text-sm"
        >
          {t('workspace.openWorkspacePage')}
        </button>
      </div>
    </div>
  );
};

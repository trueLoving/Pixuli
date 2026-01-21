import React from 'react';
import { useI18n } from '@/i18n/useI18n';

export const EditPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-gray-600 mb-2">{t('sidebar.comingSoon')}</p>
        <p className="text-sm text-gray-400">{t('sidebar.imageEdit')}</p>
      </div>
    </div>
  );
};

export default EditPage;

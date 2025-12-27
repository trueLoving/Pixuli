import { FileImage } from 'lucide-react';
import React from 'react';
import { useI18n } from '../../i18n/useI18n';
import './index.css';

export const ConvertPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="convert-page">
      <div className="convert-page-container">
        <div className="convert-page-placeholder">
          <FileImage size={64} className="convert-page-placeholder-icon" />
          <p className="convert-page-placeholder-text">
            {t('utilityTools.convertComingSoon') || '图片转换功能开发中'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConvertPage;

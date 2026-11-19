import React from 'react';
import { useTranslation } from 'react-i18next';
import { TransferImportModal } from './TransferImportModal';
import { useTransferImportDeepLink } from './useTransferImportDeepLink';

/** 全局挂载：导入弹窗 + 深链监听（Desktop / Capacitor） */
export const TransferImportHost: React.FC = () => {
  const { t } = useTranslation();
  useTransferImportDeepLink(t);
  return <TransferImportModal t={t} />;
};

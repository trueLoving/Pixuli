// TODO: 只对图片的信息进行分析（标签和描述），不进行额外的操作
import { Toaster } from '@packages/ui/src';
import React, { useEffect, useState } from 'react';
import { AIAnalysisModal } from '../../features';
import { useI18n } from '../../i18n/useI18n';

export const AIAnalysisWindowPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useI18n();

  const handleClose = () => {
    setIsOpen(false);
    // 关闭窗口
    const ipcRenderer = (window as any).ipcRenderer;
    if (ipcRenderer && ipcRenderer.invoke) {
      ipcRenderer.invoke('close-ai-analysis-window');
    }
  };

  // 监听窗口关闭
  useEffect(() => {
    const handleBeforeUnload = () => {
      handleClose();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <>
      <AIAnalysisModal isOpen={isOpen} onClose={handleClose} t={t} />
      <Toaster />
    </>
  );
};

export default AIAnalysisWindowPage;

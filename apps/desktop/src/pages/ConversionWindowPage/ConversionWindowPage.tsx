// TODO: 只转换图片的类型，不对图片的大小进行处理
import { Toaster } from '@packages/ui/src';
import React, { useEffect, useState } from 'react';
import { ImageConverter } from '../../features';
import { useI18n } from '../../i18n/useI18n';

export const ConversionWindowPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useI18n();

  const handleClose = () => {
    setIsOpen(false);
    // 关闭窗口
    const ipcRenderer = (window as any).ipcRenderer;
    if (ipcRenderer && ipcRenderer.invoke) {
      ipcRenderer.invoke('close-conversion-window');
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
      <ImageConverter isOpen={isOpen} onClose={handleClose} t={t} />
      <Toaster />
    </>
  );
};

export default ConversionWindowPage;

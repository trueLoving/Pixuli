import { Toaster } from '@packages/ui/src';
import React, { useEffect, useState } from 'react';
import { ImageConverter } from '../../features';

export const ConversionWindowPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

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
      <ImageConverter isOpen={isOpen} onClose={handleClose} />
      <Toaster />
    </>
  );
};

export default ConversionWindowPage;

import { Toaster } from '@packages/ui/src';
import React, { useEffect, useState } from 'react';
import { ImageCompression } from '../../features';

export const CompressionWindowPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // 关闭窗口
    const ipcRenderer = (window as any).ipcRenderer;
    if (ipcRenderer && ipcRenderer.invoke) {
      ipcRenderer.invoke('close-compression-window');
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
      <ImageCompression isOpen={isOpen} onClose={handleClose} />
      <Toaster />
    </>
  );
};

export default CompressionWindowPage;

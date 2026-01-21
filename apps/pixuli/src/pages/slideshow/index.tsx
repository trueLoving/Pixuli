import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { useUIStore } from '@/stores/uiStore';
import { SlideShowPlayer } from '@packages/common/src';
import { X } from 'lucide-react';
import React, { useCallback, useState } from 'react';

export const SlideshowPage: React.FC = () => {
  const { t } = useI18n();
  const { images } = useImageStore();
  const { setIsFullscreenMode } = useUIStore();

  // 页面级别的全屏状态
  const [isFullscreenMode, setIsFullscreenModeLocal] = useState(false);

  const handleFullscreenToggle = useCallback(
    (isFullscreen: boolean) => {
      setIsFullscreenModeLocal(isFullscreen);
      setIsFullscreenMode(isFullscreen);
    },
    [setIsFullscreenMode],
  );

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreenModeLocal(false);
    setIsFullscreenMode(false);
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, [setIsFullscreenMode]);

  return (
    <div className="h-full w-full relative">
      <SlideShowPlayer
        isOpen={true}
        images={images}
        t={t}
        embedded={true}
        onFullscreenToggle={handleFullscreenToggle}
      />
      {/* 全屏模式下的返回按钮 */}
      {isFullscreenMode && (
        <button
          onClick={handleExitFullscreen}
          className="absolute top-4 right-4 z-50 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-lg transition-all"
          title={t('common.back') || '返回'}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SlideshowPage;

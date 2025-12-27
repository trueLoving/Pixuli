import React from 'react';
import { Timeline, type ImageItem } from '@packages/common/src';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';

interface TimelinePageProps {
  images: ImageItem[];
  isFullscreenMode: boolean;
  onFullscreenToggle: (isFullscreen: boolean) => void;
  onExitFullscreen: () => void;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  images,
  isFullscreenMode,
  onFullscreenToggle,
  onExitFullscreen,
}) => {
  const { t } = useI18n();

  return (
    <div className="h-full w-full overflow-y-auto relative">
      <Timeline
        images={images}
        t={t}
        embedded={true}
        onFullscreenToggle={onFullscreenToggle}
      />
      {/* 全屏模式下的返回按钮 */}
      {isFullscreenMode && (
        <button
          onClick={onExitFullscreen}
          className="absolute top-4 right-4 z-50 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-lg transition-all"
          title={t('common.back') || '返回'}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default TimelinePage;

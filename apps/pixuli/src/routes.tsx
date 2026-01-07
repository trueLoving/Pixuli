import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PhotosPage } from './pages/photos';
import { SlideshowPage } from './pages/slideshow';
import { TimelinePage } from './pages/timeline';
import { CompressPage } from './pages/compress';
import { ConvertPage } from './pages/convert';
import { AnalyzePage } from './pages/analyze';
import { EditPage } from './pages/edit';
import { GeneratePage } from './pages/generate';
import { useImageStore } from './stores/imageStore';

// 路由路径常量
export const ROUTES = {
  PHOTOS: '/photos',
  SLIDESHOW: '/slideshow',
  TIMELINE: '/timeline',
  COMPRESS: '/compress',
  CONVERT: '/convert',
  ANALYZE: '/analyze',
  EDIT: '/edit',
  GENERATE: '/generate',
} as const;

// 主内容区域路由组件
interface AppRoutesProps {
  onOpenConfigModal: () => void;
  isFullscreenMode: boolean;
  setIsFullscreenMode: (isFullscreen: boolean) => void;
  fileModeClass?: string;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  onOpenConfigModal,
  isFullscreenMode,
  setIsFullscreenMode,
  fileModeClass = '',
}) => {
  const { images } = useImageStore();

  const handleExitFullscreen = () => {
    setIsFullscreenMode(false);
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <Routes>
      <Route
        path={ROUTES.PHOTOS}
        element={
          <div className={`h-full ${fileModeClass}`}>
            <PhotosPage onOpenConfigModal={onOpenConfigModal} />
          </div>
        }
      />
      <Route
        path={ROUTES.SLIDESHOW}
        element={
          <SlideshowPage
            images={images}
            isFullscreenMode={isFullscreenMode}
            onFullscreenToggle={setIsFullscreenMode}
            onExitFullscreen={handleExitFullscreen}
          />
        }
      />
      <Route
        path={ROUTES.TIMELINE}
        element={
          <TimelinePage
            images={images}
            isFullscreenMode={isFullscreenMode}
            onFullscreenToggle={setIsFullscreenMode}
            onExitFullscreen={handleExitFullscreen}
          />
        }
      />
      <Route path={ROUTES.COMPRESS} element={<CompressPage />} />
      <Route path={ROUTES.CONVERT} element={<ConvertPage />} />
      <Route path={ROUTES.ANALYZE} element={<AnalyzePage />} />
      <Route path={ROUTES.EDIT} element={<EditPage />} />
      <Route path={ROUTES.GENERATE} element={<GeneratePage />} />
      <Route path="/" element={<Navigate to={ROUTES.PHOTOS} replace />} />
    </Routes>
  );
};

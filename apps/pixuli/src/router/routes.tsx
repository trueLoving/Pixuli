import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// 路由懒加载 - 提升初始加载性能
const PhotosPage = lazy(() =>
  import('../pages/photos').then(module => ({ default: module.PhotosPage })),
);
const SlideshowPage = lazy(() =>
  import('../pages/slideshow').then(module => ({
    default: module.SlideshowPage,
  })),
);
const TimelinePage = lazy(() =>
  import('../pages/timeline').then(module => ({
    default: module.TimelinePage,
  })),
);
const CompressPage = lazy(() =>
  import('../pages/compress').then(module => ({
    default: module.CompressPage,
  })),
);
const ConvertPage = lazy(() =>
  import('../pages/convert').then(module => ({ default: module.ConvertPage })),
);
const AnalyzePage = lazy(() =>
  import('../pages/analyze').then(module => ({ default: module.AnalyzePage })),
);
const EditPage = lazy(() =>
  import('../pages/edit').then(module => ({ default: module.EditPage })),
);
const GeneratePage = lazy(() =>
  import('../pages/generate').then(module => ({
    default: module.GeneratePage,
  })),
);

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

// 路由配置类型
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

// 主内容区域路由组件
interface AppRoutesProps {
  onOpenConfigModal: () => void;
  isFullscreenMode: boolean;
  setIsFullscreenMode: (isFullscreen: boolean) => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ onOpenConfigModal }) => {
  // 路由加载中的占位组件
  const RouteSuspense = ({ children }: { children: React.ReactNode }) => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      {children}
    </Suspense>
  );

  return (
    <Routes>
      <Route
        path={ROUTES.PHOTOS}
        element={
          <RouteSuspense>
            <PhotosPage onOpenConfigModal={onOpenConfigModal} />
          </RouteSuspense>
        }
      />
      <Route
        path={ROUTES.SLIDESHOW}
        element={
          <RouteSuspense>
            <SlideshowPage />
          </RouteSuspense>
        }
      />
      <Route
        path={ROUTES.TIMELINE}
        element={
          <RouteSuspense>
            <TimelinePage />
          </RouteSuspense>
        }
      />
      <Route
        path={ROUTES.COMPRESS}
        element={
          <RouteSuspense>
            <CompressPage />
          </RouteSuspense>
        }
      />
      <Route
        path={ROUTES.CONVERT}
        element={
          <RouteSuspense>
            <ConvertPage />
          </RouteSuspense>
        }
      />
      <Route
        path={ROUTES.ANALYZE}
        element={
          <RouteSuspense>
            <AnalyzePage />
          </RouteSuspense>
        }
      />
      <Route
        path={ROUTES.EDIT}
        element={
          <RouteSuspense>
            <EditPage />
          </RouteSuspense>
        }
      />
      <Route
        path={ROUTES.GENERATE}
        element={
          <RouteSuspense>
            <GeneratePage />
          </RouteSuspense>
        }
      />
      <Route path="/" element={<Navigate to={ROUTES.PHOTOS} replace />} />
      {/* 404 路由 - 重定向到首页 */}
      <Route path="*" element={<Navigate to={ROUTES.PHOTOS} replace />} />
    </Routes>
  );
};

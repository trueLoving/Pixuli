import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// 路由懒加载 - 提升初始加载性能
const PhotosPage = lazy(() =>
  import('../pages/photos').then(module => ({ default: module.PhotosPage })),
);
const CompressPage = lazy(() =>
  import('../pages/compress').then(module => ({
    default: module.CompressPage,
  })),
);
const ConvertPage = lazy(() =>
  import('../pages/convert').then(module => ({ default: module.ConvertPage })),
);
// 路由路径常量
export const ROUTES = {
  PHOTOS: '/photos',
  COMPRESS: '/compress',
  CONVERT: '/convert',
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
        path="/slideshow"
        element={<Navigate to={ROUTES.PHOTOS} replace />}
      />
      <Route
        path="/timeline"
        element={<Navigate to={ROUTES.PHOTOS} replace />}
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
        path="/analyze"
        element={<Navigate to={ROUTES.PHOTOS} replace />}
      />
      <Route path="/edit" element={<Navigate to={ROUTES.PHOTOS} replace />} />
      <Route
        path="/generate"
        element={<Navigate to={ROUTES.PHOTOS} replace />}
      />
      <Route path="/" element={<Navigate to={ROUTES.PHOTOS} replace />} />
      {/* 404 路由 - 重定向到首页 */}
      <Route path="*" element={<Navigate to={ROUTES.PHOTOS} replace />} />
    </Routes>
  );
};

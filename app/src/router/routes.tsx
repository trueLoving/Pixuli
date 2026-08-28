import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceRouteRedirect } from './WorkspaceRouteRedirect';

const LibraryPage = lazy(() =>
  import('../pages/library').then(module => ({ default: module.LibraryPage })),
);

export const ROUTES = {
  LIBRARY: '/library',
  WORKSPACE: '/workspace',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

interface AppRoutesProps {
  onOpenConfigModal: () => void;
  isFullscreenMode: boolean;
  setIsFullscreenMode: (isFullscreen: boolean) => void;
}

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

export const AppRoutes: React.FC<AppRoutesProps> = ({ onOpenConfigModal }) => {
  const libraryElement = (
    <RouteSuspense>
      <LibraryPage onOpenConfigModal={onOpenConfigModal} />
    </RouteSuspense>
  );

  return (
    <Routes>
      <Route path={ROUTES.LIBRARY} element={libraryElement} />
      <Route
        path="/photos"
        element={<Navigate to={ROUTES.LIBRARY} replace />}
      />
      <Route
        path="/slideshow"
        element={<Navigate to={ROUTES.LIBRARY} replace />}
      />
      <Route
        path="/timeline"
        element={<Navigate to={ROUTES.LIBRARY} replace />}
      />
      <Route
        path={ROUTES.WORKSPACE}
        element={
          <RouteSuspense>
            <WorkspaceRouteRedirect />
          </RouteSuspense>
        }
      />
      <Route
        path="/compress"
        element={<Navigate to={ROUTES.LIBRARY} replace />}
      />
      <Route
        path="/convert"
        element={<Navigate to={ROUTES.LIBRARY} replace />}
      />
      <Route
        path="/analyze"
        element={<Navigate to={ROUTES.LIBRARY} replace />}
      />
      <Route path="/edit" element={<Navigate to={ROUTES.LIBRARY} replace />} />
      <Route
        path="/generate"
        element={<Navigate to={ROUTES.LIBRARY} replace />}
      />
      <Route path="/" element={<Navigate to={ROUTES.LIBRARY} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LIBRARY} replace />} />
    </Routes>
  );
};

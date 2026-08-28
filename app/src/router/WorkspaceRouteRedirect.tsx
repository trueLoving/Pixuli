import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { ROUTES } from './routes';

/** 旧 /workspace 路由：打开工作区弹窗后回到资源库 */
export const WorkspaceRouteRedirect: React.FC = () => {
  const openWorkspaceModal = useUIStore(state => state.openWorkspaceModal);

  useEffect(() => {
    openWorkspaceModal();
  }, [openWorkspaceModal]);

  return <Navigate to={ROUTES.LIBRARY} replace />;
};

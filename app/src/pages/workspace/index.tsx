import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import { useUIStore } from '@/stores/uiStore';

/** 旧 /workspace 路由：管理工作区改为独立弹窗与资源管理器底栏承载 */
export const WorkspacePage: React.FC = () => {
  const openWorkspaceModal = useUIStore(state => state.openWorkspaceModal);

  useEffect(() => {
    openWorkspaceModal();
  }, [openWorkspaceModal]);

  return <Navigate to={ROUTES.PHOTOS} replace />;
};

export default WorkspacePage;

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import { useUIStore } from '@/stores/uiStore';

/** 旧 /workspace 路由：管理工作区改由设置弹窗与资源管理器底栏承载 */
export const WorkspacePage: React.FC = () => {
  const openSettingsModal = useUIStore(state => state.openSettingsModal);

  useEffect(() => {
    openSettingsModal('workspace');
  }, [openSettingsModal]);

  return <Navigate to={ROUTES.PHOTOS} replace />;
};

export default WorkspacePage;

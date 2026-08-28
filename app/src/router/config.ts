/**
 * 路由配置
 * 统一管理应用的所有路由定义
 */

import { ROUTES } from './routes';

export interface RouteMeta {
  path: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  menuKey?: string;
}

export const routeConfig: Record<string, RouteMeta> = {
  [ROUTES.LIBRARY]: {
    path: ROUTES.LIBRARY,
    title: 'Library',
    description: 'Browse and manage resources in the local library',
    menuKey: 'library',
  },
  [ROUTES.WORKSPACE]: {
    path: ROUTES.WORKSPACE,
    title: 'Workspace',
    description: 'Manage local workspace',
    menuKey: 'workspace',
  },
};

export function getRouteMeta(path: string): RouteMeta | undefined {
  return routeConfig[path];
}

export function getMenuKeyByPath(path: string): string | undefined {
  return routeConfig[path]?.menuKey;
}

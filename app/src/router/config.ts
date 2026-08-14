/**
 * 路由配置
 * 统一管理应用的所有路由定义
 */

import { ROUTES } from './routes';

// 路由元数据配置
export interface RouteMeta {
  path: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  menuKey?: string;
}

// 路由配置映射
export const routeConfig: Record<string, RouteMeta> = {
  [ROUTES.PHOTOS]: {
    path: ROUTES.PHOTOS,
    title: 'Photos',
    description: 'Browse photos in file mode',
    menuKey: 'photos',
  },
  [ROUTES.WORKSPACE]: {
    path: ROUTES.WORKSPACE,
    title: 'Workspace',
    description: 'Manage local workspace',
    menuKey: 'workspace',
  },
  [ROUTES.COMPRESS]: {
    path: ROUTES.COMPRESS,
    title: 'Compress',
    description: 'Compress images',
    menuKey: 'compress',
  },
  [ROUTES.CONVERT]: {
    path: ROUTES.CONVERT,
    title: 'Convert',
    description: 'Convert image formats',
    menuKey: 'convert',
  },
};

/**
 * 根据路径获取路由元数据
 */
export function getRouteMeta(path: string): RouteMeta | undefined {
  return routeConfig[path];
}

/**
 * 根据路径获取菜单键
 */
export function getMenuKeyByPath(path: string): string | undefined {
  return routeConfig[path]?.menuKey;
}

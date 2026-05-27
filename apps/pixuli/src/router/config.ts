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
  browseMode?: 'file';
}

// 路由配置映射
export const routeConfig: Record<string, RouteMeta> = {
  [ROUTES.PHOTOS]: {
    path: ROUTES.PHOTOS,
    title: 'Photos',
    description: 'Browse photos in file mode',
    menuKey: 'photos',
    browseMode: 'file',
  },
  [ROUTES.COMPRESS]: {
    path: ROUTES.COMPRESS,
    title: 'Compress',
    description: 'Compress images',
    menuKey: 'compress',
    browseMode: 'file',
  },
  [ROUTES.CONVERT]: {
    path: ROUTES.CONVERT,
    title: 'Convert',
    description: 'Convert image formats',
    menuKey: 'convert',
    browseMode: 'file',
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

/**
 * 根据路径获取浏览模式
 */
export function getBrowseModeByPath(path: string): 'file' | undefined {
  return routeConfig[path]?.browseMode;
}

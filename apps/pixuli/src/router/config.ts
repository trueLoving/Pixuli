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
  browseMode?: 'file' | 'slide' | 'timeline';
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
  [ROUTES.SLIDESHOW]: {
    path: ROUTES.SLIDESHOW,
    title: 'Slideshow',
    description: 'View photos in slideshow mode',
    menuKey: 'browse-slide',
    browseMode: 'slide',
  },
  [ROUTES.TIMELINE]: {
    path: ROUTES.TIMELINE,
    title: 'Timeline',
    description: 'View photos in timeline mode',
    menuKey: 'browse-timeline',
    browseMode: 'timeline',
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
  [ROUTES.ANALYZE]: {
    path: ROUTES.ANALYZE,
    title: 'Analyze',
    description: 'Analyze images',
    menuKey: 'analyze',
    browseMode: 'file',
  },
  [ROUTES.EDIT]: {
    path: ROUTES.EDIT,
    title: 'Edit',
    description: 'Edit images',
    menuKey: 'edit',
    browseMode: 'file',
  },
  [ROUTES.GENERATE]: {
    path: ROUTES.GENERATE,
    title: 'Generate',
    description: 'Generate images',
    menuKey: 'generate',
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
export function getBrowseModeByPath(
  path: string,
): 'file' | 'slide' | 'timeline' | undefined {
  return routeConfig[path]?.browseMode;
}

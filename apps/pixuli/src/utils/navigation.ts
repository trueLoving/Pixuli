/**
 * 路由导航工具
 * 提供便捷的路由导航函数
 */

import { ROUTES } from '../router/routes';
import type { NavigateFunction } from 'react-router-dom';

/**
 * 路由导航函数类型
 */
export type RouteNavigator = NavigateFunction;

/**
 * 导航到指定路由
 */
export function navigateToRoute(
  navigate: RouteNavigator,
  route: string,
  options?: { replace?: boolean },
): void {
  navigate(route, { replace: options?.replace ?? false });
}

/**
 * 导航到照片页面
 */
export function navigateToPhotos(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.PHOTOS);
}

/**
 * 导航到幻灯片页面
 */
export function navigateToSlideshow(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.SLIDESHOW);
}

/**
 * 导航到时间线页面
 */
export function navigateToTimeline(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.TIMELINE);
}

/**
 * 导航到压缩页面
 */
export function navigateToCompress(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.COMPRESS);
}

/**
 * 导航到转换页面
 */
export function navigateToConvert(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.CONVERT);
}

/**
 * 导航到分析页面
 */
export function navigateToAnalyze(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.ANALYZE);
}

/**
 * 导航到编辑页面
 */
export function navigateToEdit(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.EDIT);
}

/**
 * 导航到生成页面
 */
export function navigateToGenerate(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.GENERATE);
}

/**
 * 检查当前路径是否为指定路由
 */
export function isCurrentRoute(pathname: string, route: string): boolean {
  return pathname === route;
}

/**
 * 检查当前路径是否为照片相关路由
 */
export function isPhotosRoute(pathname: string): boolean {
  return pathname === ROUTES.PHOTOS;
}

/**
 * 检查当前路径是否为浏览相关路由
 */
export function isBrowseRoute(pathname: string): boolean {
  return (
    pathname === ROUTES.PHOTOS ||
    pathname === ROUTES.SLIDESHOW ||
    pathname === ROUTES.TIMELINE
  );
}

/**
 * 检查当前路径是否为工具相关路由
 */
export function isUtilityRoute(pathname: string): boolean {
  return (
    pathname === ROUTES.COMPRESS ||
    pathname === ROUTES.CONVERT ||
    pathname === ROUTES.ANALYZE ||
    pathname === ROUTES.EDIT ||
    pathname === ROUTES.GENERATE
  );
}

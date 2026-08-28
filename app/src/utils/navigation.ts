/**
 * 路由导航工具
 */

import type { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '@/router/routes';

export type RouteNavigator = NavigateFunction;

export function navigateToRoute(
  navigate: RouteNavigator,
  route: string,
  options?: { replace?: boolean },
): void {
  navigate(route, { replace: options?.replace ?? false });
}

export function navigateToLibrary(navigate: RouteNavigator): void {
  navigateToRoute(navigate, ROUTES.LIBRARY);
}

/** @deprecated 使用 navigateToLibrary */
export function navigateToPhotos(navigate: RouteNavigator): void {
  navigateToLibrary(navigate);
}

export function isCurrentRoute(pathname: string, route: string): boolean {
  return pathname === route;
}

export function isLibraryRoute(pathname: string): boolean {
  return pathname === ROUTES.LIBRARY || pathname === '/photos';
}

/** @deprecated 使用 isLibraryRoute */
export function isPhotosRoute(pathname: string): boolean {
  return isLibraryRoute(pathname);
}

export function isBrowseRoute(pathname: string): boolean {
  return isLibraryRoute(pathname);
}

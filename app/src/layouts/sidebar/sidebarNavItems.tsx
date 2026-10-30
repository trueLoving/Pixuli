import { FileText, FolderOpen } from 'lucide-react';
import React from 'react';
import type {
  SidebarMenuItem,
  SidebarPrimaryNavItem,
} from '@/layouts/sidebar/types';

export function buildLibraryNavItem(
  translate: (key: string) => string,
): SidebarPrimaryNavItem {
  return {
    menuKey: 'library',
    icon: <FileText size={20} />,
    label: translate('sidebar.libraryNav'),
    menuItem: { type: 'library' },
    requiresConfig: true,
  };
}

export function buildWorkspaceNavItem(
  translate: (key: string) => string,
): SidebarPrimaryNavItem {
  return {
    menuKey: 'workspace',
    icon: <FolderOpen size={20} />,
    label: translate('sidebar.workspaceNav'),
    menuItem: { type: 'workspace' },
  };
}

export function buildPrimaryNavItems(
  translate: (key: string) => string,
): SidebarPrimaryNavItem[] {
  return [buildLibraryNavItem(translate)];
}

export function cloneNavIcon(
  icon: React.ReactNode,
  size: number,
): React.ReactNode {
  return React.cloneElement(icon as React.ReactElement<{ size?: number }>, {
    size,
  });
}

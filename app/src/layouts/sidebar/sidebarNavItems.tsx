import { FileImage, FileText, FolderOpen, Zap } from 'lucide-react';
import React from 'react';
import { UTILITY_TOOLS_ENABLED } from '@/features/tools/utilityToolsConfig';
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

export function buildUtilityNavItems(
  translate: (key: string) => string,
  hideUtilityTools: boolean,
): SidebarPrimaryNavItem[] {
  if (hideUtilityTools || !UTILITY_TOOLS_ENABLED) {
    return [];
  }
  return [
    {
      menuKey: 'compress',
      icon: <Zap size={20} />,
      label: translate('sidebar.imageCompress'),
      menuItem: { type: 'utility', tool: 'compress' },
    },
    {
      menuKey: 'convert',
      icon: <FileImage size={20} />,
      label: translate('sidebar.imageConvert'),
      menuItem: { type: 'utility', tool: 'convert' },
    },
  ];
}

export function buildPrimaryNavItems(
  translate: (key: string) => string,
  hideUtilityTools: boolean,
): SidebarPrimaryNavItem[] {
  return [
    buildLibraryNavItem(translate),
    ...buildUtilityNavItems(translate, hideUtilityTools),
  ];
}

export function cloneNavIcon(
  icon: React.ReactNode,
  size: number,
): React.ReactNode {
  return React.cloneElement(icon as React.ReactElement<{ size?: number }>, {
    size,
  });
}

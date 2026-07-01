import type { LucideIcon } from 'lucide-react';
import { Edit, ExternalLink, Eye, Link, Share2, Trash2 } from 'lucide-react';
import type { ImageActionId } from './types';

export interface ImageActionDefinition {
  id: ImageActionId;
  labelKey: string;
  icon: LucideIcon;
  danger?: boolean;
}

export const IMAGE_ACTION_DEFINITIONS: Record<
  ImageActionId,
  ImageActionDefinition
> = {
  preview: {
    id: 'preview',
    labelKey: 'image.actions.preview',
    icon: Eye,
  },
  edit: {
    id: 'edit',
    labelKey: 'image.actions.edit',
    icon: Edit,
  },
  viewUrl: {
    id: 'viewUrl',
    labelKey: 'image.actions.viewUrl',
    icon: Link,
  },
  copyUrl: {
    id: 'copyUrl',
    labelKey: 'image.actions.copyUrl',
    icon: Link,
  },
  openUrl: {
    id: 'openUrl',
    labelKey: 'image.actions.openUrl',
    icon: ExternalLink,
  },
  share: {
    id: 'share',
    labelKey: 'image.actions.share',
    icon: Share2,
  },
  delete: {
    id: 'delete',
    labelKey: 'image.actions.delete',
    icon: Trash2,
    danger: true,
  },
};

export const GRID_ICON_ACTIONS: ImageActionId[] = [
  'preview',
  'viewUrl',
  'edit',
  'delete',
];

export const LIST_ICON_ACTIONS: ImageActionId[] = ['preview', 'edit'];

export const LIST_MORE_ACTIONS: ImageActionId[] = [
  'viewUrl',
  'copyUrl',
  'openUrl',
  'share',
  'delete',
];

export const PREVIEW_ACTIONS: ImageActionId[] = [
  'copyUrl',
  'openUrl',
  'share',
  'edit',
  'delete',
];

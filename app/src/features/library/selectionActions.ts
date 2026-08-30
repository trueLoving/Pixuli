import type { CompactAction } from '@/features/inspector/inspectorTypes';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { UTILITY_TOOLS_ENABLED } from '@/features/tools/utilityToolsConfig';
import type { ImageItem } from '@pixuli/core/types';
import {
  Download,
  Edit,
  Globe,
  Link,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Trash2,
  Wand2,
} from 'lucide-react';

export const MOBILE_BAR_ACTION_IDS = new Set(['batch-edit']);

export interface BatchSelectionActionHandlers {
  onBatchEdit?: () => void;
  onBatchDownload?: () => void;
  onSync?: () => void;
  onOpenAccess?: () => void;
  onSendCompress?: () => void;
  onSendConvert?: () => void;
  onBatchDelete: () => void;
}

export interface SingleSelectionActionHandlers {
  onEdit?: () => void;
  onCopy: () => void;
  onShare?: () => void;
  onSendCompress?: () => void;
  onSendConvert?: () => void;
  onDelete: () => void;
}

function imageToolTitles(
  selectedImages: ImageItem[],
  t: (key: string) => string,
  compressLabel: string,
  convertLabel: string,
): { compressTitle: string; convertTitle: string; imageCount: number } {
  const imageCount = selectedImages.filter(
    item => getAssetKind(item) === 'image',
  ).length;
  const compressTitle = !UTILITY_TOOLS_ENABLED
    ? t('image.inspector.toolDisabled')
    : imageCount === 0
      ? t('image.inspector.toolImageOnly')
      : imageCount < selectedImages.length
        ? `${compressLabel} (${imageCount}/${selectedImages.length})`
        : compressLabel;
  const convertTitle = !UTILITY_TOOLS_ENABLED
    ? t('image.inspector.toolDisabled')
    : imageCount === 0
      ? t('image.inspector.toolImageOnly')
      : convertLabel;
  return { compressTitle, convertTitle, imageCount };
}

export function buildBatchSelectionActions(
  selectedImages: ImageItem[],
  t: (key: string) => string,
  handlers: BatchSelectionActionHandlers,
): { grid: CompactAction[]; danger: CompactAction | null } {
  if (selectedImages.length === 0) {
    return { grid: [], danger: null };
  }

  const { compressTitle, convertTitle, imageCount } = imageToolTitles(
    selectedImages,
    t,
    t('image.inspector.sendCompress'),
    t('image.inspector.sendConvert'),
  );

  const grid: CompactAction[] = [];

  if (handlers.onBatchEdit) {
    grid.push({
      id: 'batch-edit',
      label: t('image.library.batchEdit'),
      title: t('image.library.batchEdit'),
      icon: SquarePen,
      onClick: handlers.onBatchEdit,
    });
  }

  if (handlers.onBatchDownload) {
    grid.push({
      id: 'batch-download',
      label: t('image.library.batchDownload'),
      title: t('image.library.batchDownload'),
      icon: Download,
      onClick: handlers.onBatchDownload,
    });
  }

  grid.push({
    id: 'sync',
    label: t('image.inspector.actionSync'),
    title: t('image.toolbar.sync'),
    icon: RefreshCw,
    disabled: !handlers.onSync,
    onClick: () => handlers.onSync?.(),
  });

  if (handlers.onOpenAccess) {
    grid.push({
      id: 'access',
      label: t('image.toolbar.access'),
      title: t('image.toolbar.access'),
      icon: Globe,
      onClick: handlers.onOpenAccess,
    });
  }

  grid.push({
    id: 'compress',
    label: t('image.inspector.actionCompress'),
    title: compressTitle,
    icon: SlidersHorizontal,
    disabled:
      !UTILITY_TOOLS_ENABLED || imageCount === 0 || !handlers.onSendCompress,
    onClick: () => {
      if (!UTILITY_TOOLS_ENABLED || imageCount === 0) return;
      handlers.onSendCompress?.();
    },
  });

  grid.push({
    id: 'convert',
    label: t('image.inspector.actionConvert'),
    title: convertTitle,
    icon: Wand2,
    disabled:
      !UTILITY_TOOLS_ENABLED || imageCount === 0 || !handlers.onSendConvert,
    onClick: () => {
      if (!UTILITY_TOOLS_ENABLED || imageCount === 0) return;
      handlers.onSendConvert?.();
    },
  });

  return {
    grid,
    danger: {
      id: 'delete',
      label: t('image.inspector.actionDelete'),
      title: t('image.library.deleteSelected'),
      icon: Trash2,
      onClick: handlers.onBatchDelete,
    },
  };
}

export function buildSingleSelectionActions(
  kind: ReturnType<typeof getAssetKind>,
  t: (key: string) => string,
  handlers: SingleSelectionActionHandlers,
  options: {
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  },
): { grid: CompactAction[]; danger: CompactAction | null } {
  const grid: CompactAction[] = [];

  if (options.canEdit && handlers.onEdit) {
    grid.push({
      id: 'edit',
      label: t('image.inspector.actionEdit'),
      title: t('image.actions.edit'),
      icon: Edit,
      onClick: handlers.onEdit,
    });
  }

  grid.push({
    id: 'copy',
    label: t('image.inspector.actionCopy'),
    title: t('image.actions.copyUrl'),
    icon: Link,
    onClick: handlers.onCopy,
  });

  if (options.canShare && handlers.onShare) {
    grid.push({
      id: 'share',
      label: t('image.inspector.actionShare'),
      title: t('image.actions.share'),
      icon: Share2,
      onClick: handlers.onShare,
    });
  }

  grid.push({
    id: 'compress',
    label: t('image.inspector.actionCompress'),
    title: !UTILITY_TOOLS_ENABLED
      ? t('image.inspector.toolDisabled')
      : kind === 'image'
        ? t('image.inspector.sendCompress')
        : t('image.inspector.toolImageOnly'),
    icon: SlidersHorizontal,
    disabled:
      !UTILITY_TOOLS_ENABLED || kind !== 'image' || !handlers.onSendCompress,
    onClick: () => {
      if (!UTILITY_TOOLS_ENABLED || kind !== 'image') return;
      handlers.onSendCompress?.();
    },
  });

  grid.push({
    id: 'convert',
    label: t('image.inspector.actionConvert'),
    title: !UTILITY_TOOLS_ENABLED
      ? t('image.inspector.toolDisabled')
      : kind === 'image'
        ? t('image.inspector.sendConvert')
        : t('image.inspector.toolImageOnly'),
    icon: Wand2,
    disabled:
      !UTILITY_TOOLS_ENABLED || kind !== 'image' || !handlers.onSendConvert,
    onClick: () => {
      if (!UTILITY_TOOLS_ENABLED || kind !== 'image') return;
      handlers.onSendConvert?.();
    },
  });

  grid.push({
    id: 'ai',
    label: t('image.inspector.actionAi'),
    title:
      kind !== 'image'
        ? t('image.inspector.toolImageOnly')
        : t('image.inspector.aiNotConnected'),
    icon: Sparkles,
    disabled: true,
    onClick: () => undefined,
  });

  const danger: CompactAction | null = options.canDelete
    ? {
        id: 'delete',
        label: t('image.inspector.actionDelete'),
        title: t('image.actions.delete'),
        icon: Trash2,
        onClick: handlers.onDelete,
      }
    : null;

  return { grid, danger };
}

export function filterActionsForMobileBar(actions: {
  grid: CompactAction[];
  danger: CompactAction | null;
}): { grid: CompactAction[]; danger: CompactAction | null } {
  return {
    grid: actions.grid.filter(action => MOBILE_BAR_ACTION_IDS.has(action.id)),
    danger: actions.danger,
  };
}

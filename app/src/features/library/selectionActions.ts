import type { CompactAction } from '@/features/inspector/inspectorTypes';
import { getCopyablePublicUrl } from '@/features/library/copyLink';
import { libraryProcessModes } from '@/features/library/libraryProcess';
import { getAssetKind } from '@/features/library/utils/assetKind';
import type { ImageItem } from '@pixuli/core/types';
import {
  Download,
  Edit,
  Link,
  RefreshCw,
  Share2,
  Sparkles,
  SquarePen,
  Trash2,
  Wand2,
  FolderInput,
} from 'lucide-react';

export const MOBILE_BAR_ACTION_IDS = new Set(['batch-edit', 'batch-move']);

export interface BatchSelectionActionHandlers {
  onBatchEdit?: () => void;
  onBatchMove?: () => void;
  onBatchDownload?: () => void;
  onSync?: () => void;
  onCopyLinks?: () => void;
  onSendConvert?: () => void;
  onBatchDelete: () => void;
}

export interface SingleSelectionActionHandlers {
  onEdit?: () => void;
  onCopy: () => void;
  onShare?: () => void;
  onSendConvert?: () => void;
  onDelete: () => void;
}

function processableCount(selectedImages: ImageItem[]): number {
  return selectedImages.filter(
    item => libraryProcessModes(getAssetKind(item)).length > 0,
  ).length;
}

export function buildBatchSelectionActions(
  selectedImages: ImageItem[],
  t: (key: string) => string,
  handlers: BatchSelectionActionHandlers,
  options?: {
    hasRemoteConnection?: boolean;
    convertInLibrary?: boolean;
  },
): { grid: CompactAction[]; danger: CompactAction | null } {
  if (selectedImages.length === 0) {
    return { grid: [], danger: null };
  }

  const convertInLibrary = options?.convertInLibrary === true;
  const imageCount = processableCount(selectedImages);

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

  if (handlers.onBatchMove) {
    grid.push({
      id: 'batch-move',
      label: t('image.library.batchMove'),
      title: t('image.library.batchMoveHint'),
      icon: FolderInput,
      onClick: handlers.onBatchMove,
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

  if (handlers.onCopyLinks) {
    const canCopyAny = selectedImages.some(
      item => getCopyablePublicUrl(item) !== null,
    );
    const copyTitle = canCopyAny
      ? t('image.actions.copyUrl')
      : options?.hasRemoteConnection === false
        ? t('image.copyLink.needConnection')
        : t('image.copyLink.needSync');
    grid.push({
      id: 'copy-links',
      label: t('image.actions.copyUrl'),
      // 无公网链时仍可点：由 copyImageLink 弹出「去连接 / 去同步」
      title: copyTitle,
      icon: Link,
      onClick: handlers.onCopyLinks,
    });
  }

  if (convertInLibrary && imageCount > 0) {
    grid.push({
      id: 'convert',
      label: t('image.inspector.actionConvert'),
      title: t('image.inspector.sendConvert'),
      icon: Wand2,
      disabled: imageCount === 0 || !handlers.onSendConvert,
      onClick: () => {
        if (imageCount === 0) return;
        handlers.onSendConvert?.();
      },
    });
  }

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
    canCopy?: boolean;
    /** 复制禁用时的原因文案（title） */
    copyDisabledTitle?: string;
    /** 本地工作区里按文件类型打开处理弹窗 */
    convertInLibrary?: boolean;
  },
): { grid: CompactAction[]; danger: CompactAction | null } {
  const grid: CompactAction[] = [];
  const convertInLibrary = options.convertInLibrary === true;
  const canProcess = libraryProcessModes(kind).length > 0;

  if (options.canEdit && handlers.onEdit) {
    grid.push({
      id: 'edit',
      label: t('image.inspector.actionEdit'),
      title: t('image.actions.edit'),
      icon: Edit,
      onClick: handlers.onEdit,
    });
  }

  const hasPublicUrl = options.canCopy !== false;
  grid.push({
    id: 'copy',
    label: t('image.inspector.actionCopy'),
    // 无公网链时仍可点：弹出三态引导（无连接 / 仅本地去同步 / 不可用）
    title: hasPublicUrl
      ? t('image.actions.copyUrl')
      : (options.copyDisabledTitle ?? t('image.copyLink.needSync')),
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

  if (convertInLibrary && canProcess) {
    grid.push({
      id: 'convert',
      label: t('image.inspector.actionConvert'),
      title: t('image.inspector.sendConvert'),
      icon: Wand2,
      disabled: !handlers.onSendConvert,
      onClick: () => {
        handlers.onSendConvert?.();
      },
    });
  }

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

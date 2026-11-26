import React, { useMemo } from 'react';
import type { AssetItem } from '@pixuli/core/types';
import { useSuspendLibraryShortcuts } from '@/features/library/useSuspendLibraryShortcuts';
import { createKindUiHostCapabilities } from '@/plugins/kindHost';
import { resolveKindProcess } from '@/plugins/kindActionResolve';
import '@/features/library/AssetLibraryBatchEditModal.css';

/**
 * 变换处理宿主：有 kind.process 贡献且 open 时挂载插件面板。
 * process = 对文件本体变换（裁剪/压缩/转换），产物为新文件（saveProcessedAsset）。
 * 面板自带弹层 chrome（如 image process）；宿主只负责 resolve + 快捷键挂起。
 * 多选时以首个资源 resolve；插件可在 props.assets 处理整批。
 */
export function KindProcessHost({
  assets,
  open,
  onClose,
  onApplied,
  t,
}: {
  assets: AssetItem[];
  open: boolean;
  onClose: () => void;
  onApplied?: (result: { paths: string[]; failed?: string[] }) => void;
  t: (key: string) => string;
}) {
  useSuspendLibraryShortcuts(open);
  const workspace = useMemo(() => createKindUiHostCapabilities(), []);

  if (!open || assets.length === 0) return null;

  const contribution = resolveKindProcess(assets[0]!);
  if (!contribution) return null;

  const Process = contribution.component;

  return (
    <Process
      assets={assets}
      workspace={workspace}
      t={t}
      onClose={onClose}
      onApplied={onApplied}
    />
  );
}

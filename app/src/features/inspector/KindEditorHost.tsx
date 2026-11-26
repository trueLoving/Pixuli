import React from 'react';
import type { AssetItem } from '@pixuli/core/types';
import { createKindUiHostCapabilities } from '@/plugins/kindHost';
import { resolveKindEditor } from '@/plugins/kindActionResolve';
import './KindActionHost.css';

/**
 * 内容编辑宿主壳：有 kind.editor 贡献且 open 时渲染插件编辑器。
 * editor = 原地改原文件内容（writeFile）；不产旁路新文件。
 * App 只提供壳与 workspace IO；编辑 UI 由插件贡献。
 */
export function KindEditorHost({
  asset,
  src,
  open,
  onClose,
  onSaved,
  t,
}: {
  asset: AssetItem;
  src: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: (result: { path: string }) => void;
  t: (key: string) => string;
}) {
  if (!open) return null;

  const contribution = resolveKindEditor(asset);
  if (!contribution) return null;

  const Editor = contribution.component;
  const workspace = createKindUiHostCapabilities();
  const placement = contribution.placement ?? 'modal';

  return (
    <div
      className={`kind-action-host kind-action-host--${placement}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="kind-action-host-backdrop" onClick={onClose} />
      <div className="kind-action-host-panel">
        <Editor
          asset={asset}
          src={src}
          localPath={asset.localPath}
          workspace={workspace}
          t={t}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}

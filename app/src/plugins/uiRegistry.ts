import type { ComponentType, ReactNode } from 'react';
import type {
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import type { AssetItem, AssetKind } from '@pixuli/core/types';

/** 预览 / 缩略图 / 编辑 / 处理匹配输入（含 getAssetKind 过渡回退） */
export type KindUiMatchInput = {
  name: string;
  mimeType?: string;
  kind?: AssetKind;
};

export type KindUiPlacement = 'modal' | 'panel' | 'fullscreen';

export type KindProcessedAssetInput = {
  source: AssetItem;
  fileName: string;
  data: Uint8Array;
  mimeType: string;
  width?: number;
  height?: number;
};

export type KindWorkspaceIO = {
  readFile: (path: string) => Promise<Uint8Array>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  isLocalAvailable: () => boolean;
  readAssetBytes: (asset: AssetItem) => Promise<Uint8Array>;
  saveProcessedAsset: (
    input: KindProcessedAssetInput,
  ) => Promise<{ path: string }>;
};

export type KindPreviewProps = {
  asset: AssetItem;
  src: string | null;
  localPath?: string | null;
  variant: 'inspector' | 'modal';
  t: (key: string) => string;
};

export type KindPreviewContribution = {
  id: string;
  match: (input: KindUiMatchInput) => boolean;
  component: ComponentType<KindPreviewProps>;
  /** 越大越优先；默认 0 */
  priority?: number;
};

export type KindThumbnailContribution = {
  id: string;
  match: (input: KindUiMatchInput) => boolean;
  capture: (url: string) => Promise<string | null>;
  priority?: number;
};

/**
 * 内容编辑（如 Markdown / txt）：改原文件内容本身。
 * 保存用 workspace.writeFile 写回原路径，不产生新文件。
 */
export type KindEditorProps = {
  asset: AssetItem;
  src: string | null;
  localPath?: string | null;
  workspace: KindWorkspaceIO;
  t: (key: string) => string;
  onClose: () => void;
  onSaved?: (result: { path: string }) => void;
};

export type KindEditorContribution = {
  id: string;
  match: (input: KindUiMatchInput) => boolean;
  component: ComponentType<KindEditorProps>;
  placement?: KindUiPlacement;
  priority?: number;
  /** 入口按钮 i18n key */
  labelKey?: string;
};

/**
 * 文件变换（如图片裁剪/压缩/转换）：针对文件本体，产物为新文件。
 * 经 workspace.saveProcessedAsset 旁路写回；可单选或多选。
 */
export type KindProcessProps = {
  assets: AssetItem[];
  workspace: KindWorkspaceIO;
  t: (key: string) => string;
  onClose: () => void;
  onApplied?: (result: { paths: string[]; failed?: string[] }) => void;
};

export type KindProcessContribution = {
  id: string;
  match: (input: KindUiMatchInput) => boolean;
  component: ComponentType<KindProcessProps>;
  placement?: KindUiPlacement;
  priority?: number;
  labelKey?: string;
};

export type StorageConnectionFieldsProps = {
  pluginId: string;
  labelPrefix: string;
  /** 不透明配置；具体字段由插件 UI 解释 */
  config: StorageProviderConfig;
  onChange: (config: StorageProviderConfig) => void;
  t: (key: string) => string;
  classes: Record<string, string>;
  discovery?: StorageProviderDiscovery;
  resolveDiscovery?: () => StorageProviderDiscovery;
  section: 'auth' | 'location';
  onValidatedChange?: (ok: boolean) => void;
};

export type StorageConnectionFieldsContribution = {
  pluginId: string;
  component: ComponentType<StorageConnectionFieldsProps>;
  /** i18n 前缀，缺省 `${pluginId}.config` */
  labelPrefix?: string;
  /** 位置步骤是否可继续；缺省则无法进入 done */
  isConfigComplete?: (config: StorageProviderConfig) => boolean;
};

export type StorageSourceIconContribution = {
  pluginId: string;
  render: (size?: number) => ReactNode;
};

export interface UiContributionRegistry {
  registerPreview(contribution: KindPreviewContribution): void;
  registerThumbnail(contribution: KindThumbnailContribution): void;
  registerEditor(contribution: KindEditorContribution): void;
  registerProcess(contribution: KindProcessContribution): void;
  registerConnectionFields(
    contribution: StorageConnectionFieldsContribution,
  ): void;
  registerSourceIcon(contribution: StorageSourceIconContribution): void;
  unregisterPreview(id: string): boolean;
  unregisterThumbnail(id: string): boolean;
  unregisterEditor(id: string): boolean;
  unregisterProcess(id: string): boolean;
  unregisterConnectionFields(pluginId: string): boolean;
  unregisterSourceIcon(pluginId: string): boolean;
  resolvePreview(input: KindUiMatchInput): KindPreviewContribution | undefined;
  resolveThumbnail(
    input: KindUiMatchInput,
  ): KindThumbnailContribution | undefined;
  resolveEditor(input: KindUiMatchInput): KindEditorContribution | undefined;
  resolveProcess(input: KindUiMatchInput): KindProcessContribution | undefined;
  resolveConnectionFields(
    pluginId: string,
  ): StorageConnectionFieldsContribution | undefined;
  resolveSourceIcon(
    pluginId: string,
  ): StorageSourceIconContribution | undefined;
  listConnectionPluginIds(): string[];
}

function pickBest<T extends { priority?: number; id: string }>(
  items: T[],
  match: (item: T) => boolean,
): T | undefined {
  const hits = items.filter(match);
  if (hits.length === 0) return undefined;
  hits.sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id),
  );
  return hits[0];
}

function upsertById<T extends { id: string }>(list: T[], item: T): void {
  const idx = list.findIndex(c => c.id === item.id);
  if (idx >= 0) list.splice(idx, 1);
  list.push(item);
}

function removeById<T extends { id: string }>(list: T[], id: string): boolean {
  const idx = list.findIndex(c => c.id === id);
  if (idx < 0) return false;
  list.splice(idx, 1);
  return true;
}

export class DefaultUiContributionRegistry implements UiContributionRegistry {
  private readonly previews: KindPreviewContribution[] = [];
  private readonly thumbnails: KindThumbnailContribution[] = [];
  private readonly editors: KindEditorContribution[] = [];
  private readonly processes: KindProcessContribution[] = [];
  private readonly connectionFields = new Map<
    string,
    StorageConnectionFieldsContribution
  >();
  private readonly sourceIcons = new Map<
    string,
    StorageSourceIconContribution
  >();

  registerPreview(contribution: KindPreviewContribution): void {
    upsertById(this.previews, contribution);
  }

  registerThumbnail(contribution: KindThumbnailContribution): void {
    upsertById(this.thumbnails, contribution);
  }

  registerEditor(contribution: KindEditorContribution): void {
    upsertById(this.editors, contribution);
  }

  registerProcess(contribution: KindProcessContribution): void {
    upsertById(this.processes, contribution);
  }

  registerConnectionFields(
    contribution: StorageConnectionFieldsContribution,
  ): void {
    this.connectionFields.set(contribution.pluginId, contribution);
  }

  registerSourceIcon(contribution: StorageSourceIconContribution): void {
    this.sourceIcons.set(contribution.pluginId, contribution);
  }

  unregisterPreview(id: string): boolean {
    return removeById(this.previews, id);
  }

  unregisterThumbnail(id: string): boolean {
    return removeById(this.thumbnails, id);
  }

  unregisterEditor(id: string): boolean {
    return removeById(this.editors, id);
  }

  unregisterProcess(id: string): boolean {
    return removeById(this.processes, id);
  }

  unregisterConnectionFields(pluginId: string): boolean {
    return this.connectionFields.delete(pluginId);
  }

  unregisterSourceIcon(pluginId: string): boolean {
    return this.sourceIcons.delete(pluginId);
  }

  resolvePreview(input: KindUiMatchInput): KindPreviewContribution | undefined {
    return pickBest(this.previews, c => c.match(input));
  }

  resolveThumbnail(
    input: KindUiMatchInput,
  ): KindThumbnailContribution | undefined {
    return pickBest(this.thumbnails, c => c.match(input));
  }

  resolveEditor(input: KindUiMatchInput): KindEditorContribution | undefined {
    return pickBest(this.editors, c => c.match(input));
  }

  resolveProcess(input: KindUiMatchInput): KindProcessContribution | undefined {
    return pickBest(this.processes, c => c.match(input));
  }

  resolveConnectionFields(
    pluginId: string,
  ): StorageConnectionFieldsContribution | undefined {
    return this.connectionFields.get(pluginId);
  }

  resolveSourceIcon(
    pluginId: string,
  ): StorageSourceIconContribution | undefined {
    return this.sourceIcons.get(pluginId);
  }

  listConnectionPluginIds(): string[] {
    return [...this.connectionFields.keys()];
  }
}

export const uiRegistry: UiContributionRegistry =
  new DefaultUiContributionRegistry();

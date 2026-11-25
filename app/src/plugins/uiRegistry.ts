import type { ComponentType, ReactNode } from 'react';
import type {
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import type { AssetItem, AssetKind } from '@pixuli/core/types';

/** 预览 / 缩略图匹配输入（含 getAssetKind 过渡回退） */
export type KindUiMatchInput = {
  name: string;
  mimeType?: string;
  kind?: AssetKind;
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
  registerConnectionFields(
    contribution: StorageConnectionFieldsContribution,
  ): void;
  registerSourceIcon(contribution: StorageSourceIconContribution): void;
  unregisterPreview(id: string): boolean;
  unregisterThumbnail(id: string): boolean;
  unregisterConnectionFields(pluginId: string): boolean;
  unregisterSourceIcon(pluginId: string): boolean;
  resolvePreview(input: KindUiMatchInput): KindPreviewContribution | undefined;
  resolveThumbnail(
    input: KindUiMatchInput,
  ): KindThumbnailContribution | undefined;
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

export class DefaultUiContributionRegistry implements UiContributionRegistry {
  private readonly previews: KindPreviewContribution[] = [];
  private readonly thumbnails: KindThumbnailContribution[] = [];
  private readonly connectionFields = new Map<
    string,
    StorageConnectionFieldsContribution
  >();
  private readonly sourceIcons = new Map<
    string,
    StorageSourceIconContribution
  >();

  registerPreview(contribution: KindPreviewContribution): void {
    const idx = this.previews.findIndex(c => c.id === contribution.id);
    if (idx >= 0) this.previews.splice(idx, 1);
    this.previews.push(contribution);
  }

  registerThumbnail(contribution: KindThumbnailContribution): void {
    const idx = this.thumbnails.findIndex(c => c.id === contribution.id);
    if (idx >= 0) this.thumbnails.splice(idx, 1);
    this.thumbnails.push(contribution);
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
    const idx = this.previews.findIndex(c => c.id === id);
    if (idx < 0) return false;
    this.previews.splice(idx, 1);
    return true;
  }

  unregisterThumbnail(id: string): boolean {
    const idx = this.thumbnails.findIndex(c => c.id === id);
    if (idx < 0) return false;
    this.thumbnails.splice(idx, 1);
    return true;
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

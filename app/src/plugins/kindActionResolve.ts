import type { AssetItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { startPluginRuntime } from './runtime';
import {
  uiRegistry,
  type KindEditorContribution,
  type KindProcessContribution,
  type KindUiMatchInput,
} from './uiRegistry';

function matchInput(asset: Pick<AssetItem, 'name' | 'type'>): KindUiMatchInput {
  return {
    name: asset.name,
    mimeType: asset.type,
    kind: getAssetKind(asset),
  };
}

/** 当前资源是否有内容编辑贡献（原地改原文件；Inspector 入口用） */
export function resolveKindEditor(
  asset: Pick<AssetItem, 'name' | 'type'>,
): KindEditorContribution | undefined {
  startPluginRuntime();
  return uiRegistry.resolveEditor(matchInput(asset));
}

/** 当前资源是否有变换处理贡献（产旁路新文件：裁剪/压缩等） */
export function resolveKindProcess(
  asset: Pick<AssetItem, 'name' | 'type'>,
): KindProcessContribution | undefined {
  startPluginRuntime();
  return uiRegistry.resolveProcess(matchInput(asset));
}

export function hasKindEditor(
  asset: Pick<AssetItem, 'name' | 'type'>,
): boolean {
  return Boolean(resolveKindEditor(asset));
}

export function hasKindProcess(
  asset: Pick<AssetItem, 'name' | 'type'>,
): boolean {
  return Boolean(resolveKindProcess(asset));
}

import type { AssetItem } from '@pixuli/core/types';
import {
  parentDirOfRelativePath,
  uniqueRelativePath,
} from '@pixuli/kind-image';
import { readAssetBytes } from '@/features/library/assetDownloadService';
import { resolveImportTargetDir } from '@/features/workspace/workspaceLocalFs';
import { getWorkspaceVault } from '@/features/workspace/workspaceRuntime';
import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';
import type { KindProcessedAssetInput, KindWorkspaceIO } from './uiRegistry';

/**
 * Kind 插件 UI 可选用的宿主能力（与具体文件类型无关）。
 * 新增 Kind 时复用同一 bag，不必再在 app 写包装组件。
 */
export type KindUiHostCapabilities = KindWorkspaceIO;

async function saveProcessedAsset(
  input: KindProcessedAssetInput,
): Promise<{ path: string }> {
  const vault = getWorkspaceVault();
  const existing = await vault.list();
  const taken = new Set(existing.map(entry => entry.relativePath));
  const source = input.source;
  if (source.localPath) taken.add(source.localPath);
  const dir = source.localPath
    ? parentDirOfRelativePath(source.localPath)
    : await resolveImportTargetDir();
  const target = uniqueRelativePath(dir, input.fileName, taken);
  const savedName = target.split('/').pop() ?? input.fileName;
  const file = new File([input.data.slice()], savedName, {
    type: input.mimeType,
  });
  await vault.importFile(file, target, {
    name: savedName,
    mimeType: input.mimeType,
    width: input.width,
    height: input.height,
    syncState: 'local-only',
  });
  return { path: target };
}

export function createKindUiHostCapabilities(): KindUiHostCapabilities {
  return {
    readFile: path => getWorkspaceAdapter().readFile(path),
    writeFile: (path, data) => getWorkspaceAdapter().writeFile(path, data),
    isLocalAvailable: isWorkspaceAvailable,
    readAssetBytes: (asset: AssetItem) => readAssetBytes(asset),
    saveProcessedAsset,
  };
}

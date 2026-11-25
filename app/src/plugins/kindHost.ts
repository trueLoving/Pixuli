import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';

/**
 * Kind 插件 UI 可选用的宿主能力（与具体文件类型无关）。
 * 新增 Kind 时复用同一 bag，不必再在 app 写包装组件。
 */
export type KindUiHostCapabilities = {
  readFile: (path: string) => Promise<Uint8Array>;
  isLocalAvailable: () => boolean;
};

export function createKindUiHostCapabilities(): KindUiHostCapabilities {
  return {
    readFile: path => getWorkspaceAdapter().readFile(path),
    isLocalAvailable: isWorkspaceAvailable,
  };
}

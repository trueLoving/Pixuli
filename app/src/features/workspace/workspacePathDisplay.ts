import {
  parseFsaRootPath,
  resolveFsaAbsolutePath,
} from '@/platforms/web/fsaWorkspaceFs';

export function isVirtualWorkspaceRoot(rootPath: string): boolean {
  return (
    rootPath.startsWith('opfs://') ||
    rootPath.startsWith('fsa://') ||
    rootPath.startsWith('mobile://')
  );
}

/** 解析工作区在本机的展示路径（绝对路径优先；FSA 仅在运行时/API 允许时解析） */
export async function resolveWorkspaceRootDisplayPath(
  rootPath: string | null,
  persistedAbsolutePath?: string | null,
): Promise<string | null> {
  if (!rootPath) {
    return null;
  }

  if (!isVirtualWorkspaceRoot(rootPath)) {
    return rootPath;
  }

  if (rootPath.startsWith('fsa://')) {
    const cached = persistedAbsolutePath?.trim();
    if (cached) {
      return cached;
    }
    const workspaceId = parseFsaRootPath(rootPath);
    if (!workspaceId) {
      return null;
    }
    return resolveFsaAbsolutePath(workspaceId);
  }

  return null;
}

/** 资源管理器路径说明（不含工作区名称，用于标题括号内） */
export function formatWorkspacePathHint(
  rootPath: string | null,
  rootDisplayPath: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!rootPath) {
    return null;
  }
  if (rootPath.startsWith('mobile://')) {
    return t('workspace.mobileStorage');
  }
  if (rootPath.startsWith('opfs://')) {
    return t('workspace.webStorage');
  }
  if (rootPath.startsWith('fsa://')) {
    return rootDisplayPath?.trim() || null;
  }
  return rootPath;
}

/** 资源管理器标题：工作区名称（路径） */
export function formatWorkspaceTitle(
  rootPath: string | null,
  displayName: string | null,
  rootDisplayPath: string | null | undefined,
  t: (key: string) => string,
): string {
  const name = displayName?.trim() || t('workspace.unnamed');
  const pathHint = formatWorkspacePathHint(rootPath, rootDisplayPath, t);
  if (!pathHint) {
    return name;
  }
  return `${name}（${pathHint}）`;
}

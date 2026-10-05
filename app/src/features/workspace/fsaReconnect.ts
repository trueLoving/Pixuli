/** Web FSA 工作区恢复：分类错误并判断是否应引导重新授权 */

export type FsaReconnectReason = 'permission' | 'missing_handle';

export type WorkspaceReconnectHint = {
  rootPath: string;
  folderLabel: string | null;
  reason: FsaReconnectReason;
};

export function isFsaRootPath(rootPath: string | null | undefined): boolean {
  return Boolean(rootPath?.startsWith('fsa://'));
}

export function classifyFsaAccessError(
  message: string,
): FsaReconnectReason | null {
  const lower = message.toLowerCase();
  if (
    lower.includes('handle not found') ||
    lower.includes('pick the folder again')
  ) {
    return 'missing_handle';
  }
  if (lower.includes('permission') || lower.includes('denied')) {
    return 'permission';
  }
  return null;
}

export function buildReconnectHint(
  rootPath: string | null | undefined,
  folderLabel: string | null | undefined,
  errorMessage: string,
): WorkspaceReconnectHint | null {
  if (!isFsaRootPath(rootPath)) {
    return null;
  }
  const reason = classifyFsaAccessError(errorMessage);
  if (!reason) {
    return null;
  }
  return {
    rootPath: rootPath!,
    folderLabel: folderLabel ?? null,
    reason,
  };
}

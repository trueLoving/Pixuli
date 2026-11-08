/** 本地索引 list 的路径过滤（与 app folderTree 浅层语义对齐） */

export function matchesListPathPrefix(
  relativePath: string,
  pathPrefix: string | undefined,
  shallow: boolean,
): boolean {
  const prefix =
    pathPrefix?.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '') ?? '';
  const normalized = relativePath.replace(/\\/g, '/');
  if (!prefix) {
    // 工作区根：shallow 时仅本层文件（路径不含 /）
    if (!shallow) {
      return true;
    }
    return normalized.length > 0 && !normalized.includes('/');
  }
  const withSlash = `${prefix}/`;
  if (!normalized.startsWith(withSlash)) {
    return false;
  }
  if (!shallow) {
    return true;
  }
  const rest = normalized.slice(withSlash.length);
  return rest.length > 0 && !rest.includes('/');
}

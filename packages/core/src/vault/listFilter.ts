/** 本地索引 list 的路径过滤（与 app folderTree 浅层语义对齐） */

export function matchesListPathPrefix(
  relativePath: string,
  pathPrefix: string | undefined,
  shallow: boolean,
): boolean {
  const prefix =
    pathPrefix?.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '') ?? '';
  if (!prefix) {
    return true;
  }
  const normalized = relativePath.replace(/\\/g, '/');
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

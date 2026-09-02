export function folderLabel(path?: string): string {
  if (!path) return '—';
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 1) return '/';
  return parts.slice(0, -1).join('/');
}

export function folderFromLocalPath(localPath?: string): string {
  if (!localPath) return '';
  const slash = localPath.lastIndexOf('/');
  return slash === -1 ? '' : localPath.slice(0, slash);
}

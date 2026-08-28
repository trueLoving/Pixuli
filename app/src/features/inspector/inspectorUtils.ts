export function folderLabel(path?: string): string {
  if (!path) return '—';
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 1) return '/';
  return parts.slice(0, -1).join('/');
}

import type { KindMatchInput } from '@pixuli/core/kinds';

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi']);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function matchVideoKind(input: KindMatchInput): boolean {
  const mime = input.mimeType?.trim().toLowerCase();
  if (mime?.startsWith('video/')) return true;
  return VIDEO_EXTENSIONS.has(extensionOf(input.name));
}

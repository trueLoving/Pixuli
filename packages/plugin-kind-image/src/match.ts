import type { KindMatchInput } from '@pixuli/core/kinds';

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'bmp',
]);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function matchImageKind(input: KindMatchInput): boolean {
  const mime = input.mimeType?.trim().toLowerCase();
  if (mime?.startsWith('image/')) return true;
  return IMAGE_EXTENSIONS.has(extensionOf(input.name));
}

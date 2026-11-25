import type { KindMatchInput } from '@pixuli/core/kinds';

export function matchTextKind(input: KindMatchInput): boolean {
  const name = input.name.trim().toLowerCase();
  if (name.endsWith('.txt')) return true;
  const mime = input.mimeType?.trim().toLowerCase();
  return mime === 'text/plain';
}

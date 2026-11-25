import type { KindMatchInput } from '@pixuli/core/kinds';

export function matchMarkdownKind(input: KindMatchInput): boolean {
  const name = input.name.trim().toLowerCase();
  if (name.endsWith('.md') || name.endsWith('.markdown')) return true;
  const mime = input.mimeType?.trim().toLowerCase();
  return mime === 'text/markdown' || mime === 'text/x-markdown';
}

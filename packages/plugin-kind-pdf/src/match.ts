import type { KindMatchInput } from '@pixuli/core/kinds';

export function matchPdfKind(input: KindMatchInput): boolean {
  const name = input.name.trim().toLowerCase();
  if (name.endsWith('.pdf')) return true;
  const mime = input.mimeType?.trim().toLowerCase();
  return mime === 'application/pdf';
}

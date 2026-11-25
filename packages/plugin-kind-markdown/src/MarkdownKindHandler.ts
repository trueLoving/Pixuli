import type { KindHandler } from '@pixuli/core/kinds';
import { matchMarkdownKind } from './match';
import { markdownKindManifest } from './manifest';

export class MarkdownKindHandler implements KindHandler {
  readonly manifest = markdownKindManifest;

  match(input: { name: string; mimeType?: string }): boolean {
    return matchMarkdownKind(input);
  }
}

export function createMarkdownKindHandler(): KindHandler {
  return new MarkdownKindHandler();
}

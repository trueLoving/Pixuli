import type { KindHandler } from '@pixuli/core/kinds';
import { matchTextKind } from './match';
import { textKindManifest } from './manifest';

export class TextKindHandler implements KindHandler {
  readonly manifest = textKindManifest;

  match(input: { name: string; mimeType?: string }): boolean {
    return matchTextKind(input);
  }
}

export function createTextKindHandler(): KindHandler {
  return new TextKindHandler();
}

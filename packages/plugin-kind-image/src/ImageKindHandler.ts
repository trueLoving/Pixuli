import type { KindHandler } from '@pixuli/core/kinds';
import { matchImageKind } from './match';
import { imageKindManifest } from './manifest';

export class ImageKindHandler implements KindHandler {
  readonly manifest = imageKindManifest;

  match(input: { name: string; mimeType?: string }): boolean {
    return matchImageKind(input);
  }
}

export function createImageKindHandler(): KindHandler {
  return new ImageKindHandler();
}

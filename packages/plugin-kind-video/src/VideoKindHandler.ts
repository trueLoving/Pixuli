import type { KindHandler } from '@pixuli/core/kinds';
import { matchVideoKind } from './match';
import { videoKindManifest } from './manifest';

export class VideoKindHandler implements KindHandler {
  readonly manifest = videoKindManifest;

  match(input: { name: string; mimeType?: string }): boolean {
    return matchVideoKind(input);
  }
}

export function createVideoKindHandler(): KindHandler {
  return new VideoKindHandler();
}

import {
  createKindPluginRegistry,
  type KindPluginManifest,
  type KindPluginRegistry,
} from '@pixuli/core/kinds';
import { registerPdfKind } from '@pixuli/kind-pdf/register';

export const kindRegistry: KindPluginRegistry = createKindPluginRegistry();

let bootstrapped = false;

export function bootstrapKindPlugins(): void {
  if (bootstrapped) return;
  registerPdfKind(kindRegistry);
  bootstrapped = true;
}

bootstrapKindPlugins();

export function listKindPluginManifests(): KindPluginManifest[] {
  return kindRegistry.listManifests();
}

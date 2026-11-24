import type {
  KindPluginManifest,
  KindPluginRegistry,
} from '@pixuli/core/kinds';
import { kindRegistry, startPluginRuntime } from '@/plugins/runtime';

export { kindRegistry };
export type { KindPluginRegistry };

startPluginRuntime();

export function listKindPluginManifests(): KindPluginManifest[] {
  return kindRegistry.listManifests();
}

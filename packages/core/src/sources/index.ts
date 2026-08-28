export type { StoredSourceEntry } from '../plugins/types';
export {
  createStoredSourceEntry,
  getRepoConfigFromSource,
  mergeStoredSourceUpdate,
  normalizeStoredSourceEntry,
  normalizeStoredSources,
  pluginIdToLegacyType,
  resolveSourceDisplay,
  type CreateStoredSourceInput,
  type LegacyStorageType,
} from './normalize';
export {
  buildPluginConfigExport,
  parsePluginConfigImport,
  PLUGIN_CONFIG_EXPORT_VERSION,
  type PluginConfigExportPayload,
  type ParsedPluginConfigImport,
} from './importExport';

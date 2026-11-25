import type { PluginCapabilityKind } from './types';

/** 磁盘插件清单（可发现、不必执行 JS） */
export interface DiskPluginManifest {
  id: string;
  name: string;
  version: string;
  main: string;
  capabilities: PluginCapabilityKind[];
  minAppVersion?: string;
}

function isCapability(value: unknown): value is PluginCapabilityKind {
  return value === 'storage' || value === 'kind';
}

/**
 * 解析插件目录下的 manifest.json 内容。
 * @throws 结构非法时抛错
 */
export function parseDiskPluginManifest(raw: unknown): DiskPluginManifest {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('manifest must be an object');
  }
  const obj = raw as Record<string, unknown>;
  const { id, name, version, main, capabilities, minAppVersion } = obj;

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('manifest.id must be a non-empty string');
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('manifest.name must be a non-empty string');
  }
  if (typeof version !== 'string' || !version.trim()) {
    throw new Error('manifest.version must be a non-empty string');
  }
  if (typeof main !== 'string' || !main.trim()) {
    throw new Error('manifest.main must be a non-empty string');
  }
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    throw new Error('manifest.capabilities must be a non-empty array');
  }
  if (!capabilities.every(isCapability)) {
    throw new Error('manifest.capabilities entries must be storage | kind');
  }
  if (minAppVersion != null && typeof minAppVersion !== 'string') {
    throw new Error('manifest.minAppVersion must be a string when present');
  }

  return {
    id: id.trim(),
    name: name.trim(),
    version: version.trim(),
    main: main.trim(),
    capabilities: [...capabilities],
    ...(typeof minAppVersion === 'string' && minAppVersion.trim()
      ? { minAppVersion: minAppVersion.trim() }
      : {}),
  };
}

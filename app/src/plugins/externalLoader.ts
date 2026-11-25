import {
  parseDiskPluginManifest,
  type DiskPluginManifest,
  type PluginLoadResult,
  type PluginRuntime,
  type RuntimePluginFactory,
} from '@pixuli/core/plugin-runtime';

export type ExternalLoaderFs = {
  readdir: (dir: string) => Promise<string[]>;
  readText: (filePath: string) => Promise<string>;
  isDirectory: (filePath: string) => Promise<boolean>;
  join: (...parts: string[]) => string;
  /** 将绝对路径转为 dynamic import 可用的 URL */
  toImportUrl: (absolutePath: string) => string;
};

export type DiscoveredExternalPlugin = {
  manifest: DiskPluginManifest;
  directory: string;
  mainPath: string;
  importUrl: string;
};

export type ExternalModule = {
  createRuntimePlugin?: RuntimePluginFactory;
  default?: RuntimePluginFactory;
};

function resolveFactory(mod: ExternalModule): RuntimePluginFactory {
  const factory = mod.createRuntimePlugin ?? mod.default;
  if (typeof factory !== 'function') {
    throw new Error(
      'plugin entry must export createRuntimePlugin (or default factory)',
    );
  }
  return factory;
}

/** 扫描 pluginsRoot 下含 manifest.json 的子目录 */
export async function discoverExternalPlugins(
  pluginsRoot: string,
  fs: ExternalLoaderFs,
): Promise<DiscoveredExternalPlugin[]> {
  let names: string[];
  try {
    names = await fs.readdir(pluginsRoot);
  } catch {
    return [];
  }

  const found: DiscoveredExternalPlugin[] = [];
  for (const name of names) {
    const directory = fs.join(pluginsRoot, name);
    if (!(await fs.isDirectory(directory))) continue;

    const manifestPath = fs.join(directory, 'manifest.json');
    let rawText: string;
    try {
      rawText = await fs.readText(manifestPath);
    } catch {
      continue;
    }

    let manifest: DiskPluginManifest;
    try {
      manifest = parseDiskPluginManifest(JSON.parse(rawText));
    } catch {
      continue;
    }

    const mainPath = fs.join(directory, manifest.main);
    found.push({
      manifest,
      directory,
      mainPath,
      importUrl: fs.toImportUrl(mainPath),
    });
  }
  return found;
}

/**
 * 将已发现的磁盘插件 registerExternal 并 load（若当前 enabled）。
 * 已注册同 id 时跳过并记失败，避免覆盖 builtin。
 */
export async function loadDiscoveredExternalPlugins(
  runtime: PluginRuntime,
  discovered: DiscoveredExternalPlugin[],
  importModule: (url: string) => Promise<unknown>,
): Promise<PluginLoadResult[]> {
  const results: PluginLoadResult[] = [];

  for (const item of discovered) {
    const { id } = item.manifest;
    try {
      if (runtime.listStates().some(s => s.id === id)) {
        results.push({
          id,
          ok: false,
          error: `plugin already registered: ${id}`,
        });
        continue;
      }

      const mod = (await importModule(item.importUrl)) as ExternalModule;
      const factory = resolveFactory(mod);
      runtime.registerExternal(factory);

      const state = runtime.listStates().find(s => s.id === id);
      if (state && !state.enabled) {
        results.push({ id, ok: true });
        continue;
      }
      results.push(await runtime.load(id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ id, ok: false, error: message });
    }
  }

  return results;
}

export async function loadExternalPluginsFromDisk(
  runtime: PluginRuntime,
  pluginsRoot: string,
  fs: ExternalLoaderFs,
  importModule: (url: string) => Promise<unknown>,
): Promise<PluginLoadResult[]> {
  const discovered = await discoverExternalPlugins(pluginsRoot, fs);
  return loadDiscoveredExternalPlugins(runtime, discovered, importModule);
}

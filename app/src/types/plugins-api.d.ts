interface PluginsDiscoverEntry {
  directory: string;
  manifestPath: string;
  mainRelative: string;
  importUrl: string;
  manifestJson: string;
}

interface PluginsAPI {
  getRoot: () => Promise<{ rootPath: string }>;
  discover: () => Promise<{
    rootPath: string;
    plugins: PluginsDiscoverEntry[];
  }>;
}

interface Window {
  pluginsAPI?: PluginsAPI;
}

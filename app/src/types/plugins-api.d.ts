interface PluginsDiscoverEntry {
  directory: string;
  manifestPath: string;
  mainRelative: string;
  importUrl: string;
  manifestJson: string;
}

interface PluginsInstallResult {
  ok: boolean;
  canceled?: boolean;
  pluginId?: string;
  directory?: string;
  error?: string;
}

interface PluginsUninstallResult {
  ok: boolean;
  pluginId?: string;
  error?: string;
}

interface PluginsAPI {
  getRoot: () => Promise<{ rootPath: string }>;
  discover: () => Promise<{
    rootPath: string;
    plugins: PluginsDiscoverEntry[];
  }>;
  /** 读取 userData/plugins 下相对路径文本 */
  readText?: (relativePath: string) => Promise<{ text: string }>;
  /** Desktop：系统目录选择器 + 复制到 userData/plugins */
  installFromDirectory?: () => Promise<PluginsInstallResult>;
  /** Desktop：删除 userData/plugins 下对应插件目录 */
  uninstall?: (pluginId: string) => Promise<PluginsUninstallResult>;
}

interface Window {
  pluginsAPI?: PluginsAPI;
}

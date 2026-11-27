import {
  createPluginRuntime,
  type PluginLoadResult,
  type PluginRuntime,
} from '@pixuli/core/plugin-runtime';
import { createImageRuntimePlugin } from '@pixuli/kind-image/runtime';
import { createMarkdownRuntimePlugin } from '@pixuli/kind-markdown/runtime';
import { createPdfRuntimePlugin } from '@pixuli/kind-pdf/runtime';
import { createTextRuntimePlugin } from '@pixuli/kind-text/runtime';
import { createVideoRuntimePlugin } from '@pixuli/kind-video/runtime';
import { createGitHubRuntimePlugin } from '@pixuli/provider-github/runtime';
import { createPixuliGiteeRuntimePlugin } from './createPixuliGiteeRuntimePlugin';
import { contributeAllPluginUi } from './contributeUi';
import { loadExternalPlugins } from './loadExternalPlugins';
import { LocalStoragePluginStateStore } from './localStorageStateStore';
import { createAppPluginUiHost } from './pluginUiHost';
import { kindRegistry, storageRegistry } from './registries';

export { kindRegistry, storageRegistry };

const stateStore = new LocalStoragePluginStateStore();

export const pluginRuntime: PluginRuntime = createPluginRuntime(
  {
    storage: storageRegistry,
    kinds: kindRegistry,
    ui: createAppPluginUiHost(),
  },
  stateStore,
);

pluginRuntime.registerBuiltin(createGitHubRuntimePlugin);
pluginRuntime.registerBuiltin(createPixuliGiteeRuntimePlugin);
pluginRuntime.registerBuiltin(createImageRuntimePlugin);
pluginRuntime.registerBuiltin(createPdfRuntimePlugin);
pluginRuntime.registerBuiltin(createMarkdownRuntimePlugin);
pluginRuntime.registerBuiltin(createTextRuntimePlugin);
pluginRuntime.registerBuiltin(createVideoRuntimePlugin);

let bootResults: PluginLoadResult[] | null = null;
let externalLoadStarted = false;

/** 同步启动内置插件（模块导入侧与测试可用） */
export function startPluginRuntime(): PluginLoadResult[] {
  if (!bootResults) {
    bootResults = pluginRuntime.startSync();
    contributeAllPluginUi();
    if (!externalLoadStarted) {
      externalLoadStarted = true;
      void loadExternalPlugins(pluginRuntime);
    }
  }
  return bootResults;
}

startPluginRuntime();

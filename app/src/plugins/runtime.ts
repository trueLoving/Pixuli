import {
  createPluginRuntime,
  type PluginLoadResult,
  type PluginRuntime,
} from '@pixuli/core/plugin-runtime';
import { createGitHubRuntimePlugin } from '@pixuli/provider-github/runtime';
import { createPdfRuntimePlugin } from '@pixuli/kind-pdf/runtime';
import {
  bindGiteePluginUi,
  bindGitHubPluginUi,
  bindPdfPluginUi,
} from './bindPluginUi';
import { createPixuliGiteeRuntimePlugin } from './createPixuliGiteeRuntimePlugin';
import { contributeAllPluginUi } from './contributeUi';
import { LocalStoragePluginStateStore } from './localStorageStateStore';
import { kindRegistry, storageRegistry } from './registries';

export { kindRegistry, storageRegistry };

const stateStore = new LocalStoragePluginStateStore();

export const pluginRuntime: PluginRuntime = createPluginRuntime(
  { storage: storageRegistry, kinds: kindRegistry },
  stateStore,
);

pluginRuntime.registerBuiltin(bindGitHubPluginUi(createGitHubRuntimePlugin));
pluginRuntime.registerBuiltin(
  bindGiteePluginUi(createPixuliGiteeRuntimePlugin),
);
pluginRuntime.registerBuiltin(bindPdfPluginUi(createPdfRuntimePlugin));

let bootResults: PluginLoadResult[] | null = null;

/** 同步启动内置插件（模块导入侧与测试可用） */
export function startPluginRuntime(): PluginLoadResult[] {
  if (!bootResults) {
    bootResults = pluginRuntime.startSync();
    contributeAllPluginUi();
  }
  return bootResults;
}

startPluginRuntime();

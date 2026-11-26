import { contributeBuiltinKindUi } from './contributeBuiltinKindUi';
import { uiRegistry } from './uiRegistry';

let contributed = false;

/**
 * 仅注册 app 内置 Kind UI（image/other）。
 * 插件 UI 由各 RuntimePlugin onload 经 PluginApi.ui 贡献，随 enable/unload 同步。
 */
export function contributeAllPluginUi(): void {
  if (contributed) return;
  contributeBuiltinKindUi(uiRegistry);
  contributed = true;
}

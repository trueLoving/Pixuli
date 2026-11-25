import { contributeBuiltinKindUi } from './contributeBuiltinKindUi';
import { uiRegistry } from './uiRegistry';

let contributed = false;

/**
 * 仅注册 app 内置 Kind UI（image/video/markdown/text/other）。
 * 插件 UI 由 Runtime onload 经 bindPluginUi 绑定，随 enable/unload 同步。
 */
export function contributeAllPluginUi(): void {
  if (contributed) return;
  contributeBuiltinKindUi(uiRegistry);
  contributed = true;
}

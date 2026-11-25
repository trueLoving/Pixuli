import { contributePdfUi } from '@pixuli/kind-pdf/ui';
import { contributeGiteeUi } from '@pixuli/provider-gitee/ui';
import { contributeGitHubUi } from '@pixuli/provider-github/ui';
import type {
  RuntimePlugin,
  RuntimePluginFactory,
} from '@pixuli/core/plugin-runtime';
import { createKindUiHostCapabilities } from './kindHost';
import { uiRegistry } from './uiRegistry';

/**
 * 将 UI 贡献绑定到 Runtime 插件生命周期：
 * onload 注册 UI，onunload 注销 — 与 capability registry 同步。
 */
function bindUiLifecycle(
  factory: RuntimePluginFactory,
  onLoadUi: () => void,
  onUnloadUi: () => void,
): RuntimePluginFactory {
  return () => {
    const plugin = factory();
    const prevOnload = plugin.onload.bind(plugin);
    const prevOnunload = plugin.onunload?.bind(plugin);

    const wrapped: RuntimePlugin = {
      ...plugin,
      onload(api) {
        prevOnload(api);
        onLoadUi();
      },
      async onunload() {
        onUnloadUi();
        await prevOnunload?.();
      },
    };
    return wrapped;
  };
}

export function bindPdfPluginUi(
  factory: RuntimePluginFactory,
): RuntimePluginFactory {
  return bindUiLifecycle(
    factory,
    () => contributePdfUi(uiRegistry, createKindUiHostCapabilities()),
    () => {
      uiRegistry.unregisterPreview('kind.pdf');
      uiRegistry.unregisterThumbnail('kind.pdf');
    },
  );
}

export function bindGitHubPluginUi(
  factory: RuntimePluginFactory,
): RuntimePluginFactory {
  return bindUiLifecycle(
    factory,
    () => contributeGitHubUi(uiRegistry),
    () => {
      uiRegistry.unregisterConnectionFields('github');
      uiRegistry.unregisterSourceIcon('github');
    },
  );
}

export function bindGiteePluginUi(
  factory: RuntimePluginFactory,
): RuntimePluginFactory {
  return bindUiLifecycle(
    factory,
    () => contributeGiteeUi(uiRegistry),
    () => {
      uiRegistry.unregisterConnectionFields('gitee');
      uiRegistry.unregisterSourceIcon('gitee');
    },
  );
}

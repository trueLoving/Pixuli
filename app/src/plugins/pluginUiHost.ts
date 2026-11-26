import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import {
  createKindUiHostCapabilities,
  type KindUiHostCapabilities,
} from './kindHost';
import {
  uiRegistry,
  type KindEditorContribution,
  type KindPreviewContribution,
  type KindProcessContribution,
  type KindThumbnailContribution,
  type StorageConnectionFieldsContribution,
  type StorageSourceIconContribution,
} from './uiRegistry';

/** 将 app uiRegistry + kindHost 适配为 PluginApi.ui */
export function createAppPluginUiHost(
  getCaps: () => KindUiHostCapabilities = createKindUiHostCapabilities,
): PluginUiHost {
  return {
    registerPreview(contribution) {
      uiRegistry.registerPreview(contribution as KindPreviewContribution);
    },
    registerThumbnail(contribution) {
      uiRegistry.registerThumbnail(contribution as KindThumbnailContribution);
    },
    registerEditor(contribution) {
      uiRegistry.registerEditor(contribution as KindEditorContribution);
    },
    registerProcess(contribution) {
      uiRegistry.registerProcess(contribution as KindProcessContribution);
    },
    registerConnectionFields(contribution) {
      uiRegistry.registerConnectionFields(
        contribution as StorageConnectionFieldsContribution,
      );
    },
    registerSourceIcon(contribution) {
      uiRegistry.registerSourceIcon(
        contribution as StorageSourceIconContribution,
      );
    },
    unregisterPreview(id) {
      return uiRegistry.unregisterPreview(id);
    },
    unregisterThumbnail(id) {
      return uiRegistry.unregisterThumbnail(id);
    },
    unregisterEditor(id) {
      return uiRegistry.unregisterEditor(id);
    },
    unregisterProcess(id) {
      return uiRegistry.unregisterProcess(id);
    },
    unregisterConnectionFields(pluginId) {
      return uiRegistry.unregisterConnectionFields(pluginId);
    },
    unregisterSourceIcon(pluginId) {
      return uiRegistry.unregisterSourceIcon(pluginId);
    },
    getKindCapabilities() {
      return getCaps();
    },
  };
}

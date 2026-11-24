import React from 'react';
import type {
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import { giteeManifest } from '../manifest';
import { isGiteeConfigComplete } from './config';
import { GiteeConnectionFields } from './GiteeConnectionFields';

/** 与 app UiContributionRegistry 结构兼容 */
export type StorageUiHostRegistry = {
  registerConnectionFields(contribution: {
    pluginId: string;
    labelPrefix?: string;
    isConfigComplete?: (config: StorageProviderConfig) => boolean;
    component: React.ComponentType<{
      pluginId: string;
      labelPrefix: string;
      config: StorageProviderConfig;
      onChange: (config: StorageProviderConfig) => void;
      t: (key: string) => string;
      classes: Record<string, string>;
      discovery?: StorageProviderDiscovery;
      resolveDiscovery?: () => StorageProviderDiscovery;
      section: 'auth' | 'location';
      onValidatedChange?: (ok: boolean) => void;
    }>;
  }): void;
  registerSourceIcon(contribution: {
    pluginId: string;
    render: (size?: number) => React.ReactNode;
  }): void;
};

function GiteeIcon({ size = 18 }: { size?: number }) {
  const fontSize = Math.max(10, Math.round(size * 0.66));
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center font-bold text-red-600"
      style={{ width: size, height: size, fontSize }}
      aria-hidden
    >
      码
    </span>
  );
}

export function contributeGiteeUi(registry: StorageUiHostRegistry): void {
  registry.registerConnectionFields({
    pluginId: giteeManifest.id,
    labelPrefix: 'gitee.config',
    isConfigComplete: isGiteeConfigComplete,
    component: GiteeConnectionFields,
  });
  registry.registerSourceIcon({
    pluginId: giteeManifest.id,
    render: (size = 18) => <GiteeIcon size={size} />,
  });
}

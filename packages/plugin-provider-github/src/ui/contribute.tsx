import React from 'react';
import type {
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import { Github } from 'lucide-react';
import { githubManifest } from '../manifest';
import { isGitHubConfigComplete } from './config';
import { GitHubConnectionFields } from './GitHubConnectionFields';

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

export function contributeGitHubUi(registry: StorageUiHostRegistry): void {
  registry.registerConnectionFields({
    pluginId: githubManifest.id,
    labelPrefix: 'github.config',
    isConfigComplete: isGitHubConfigComplete,
    component: GitHubConnectionFields,
  });
  registry.registerSourceIcon({
    pluginId: githubManifest.id,
    render: (size = 18) => (
      <Github size={size} className="shrink-0 text-gray-700" />
    ),
  });
}

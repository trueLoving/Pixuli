import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import { Github } from 'lucide-react';
import { githubManifest } from '../manifest';
import { isGitHubConfigComplete } from './config';
import { GitHubConnectionFields } from './GitHubConnectionFields';

export function contributeGitHubUi(ui: PluginUiHost): void {
  ui.registerConnectionFields({
    pluginId: githubManifest.id,
    labelPrefix: 'github.config',
    isConfigComplete: isGitHubConfigComplete,
    component: GitHubConnectionFields,
  });
  ui.registerSourceIcon({
    pluginId: githubManifest.id,
    render: (size = 18) => (
      <Github size={size} className="shrink-0 text-gray-700" />
    ),
  });
}

export function unregisterGitHubUi(ui: PluginUiHost): void {
  ui.unregisterConnectionFields(githubManifest.id);
  ui.unregisterSourceIcon(githubManifest.id);
}

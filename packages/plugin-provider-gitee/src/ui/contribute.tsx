import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import { giteeManifest } from '../manifest';
import { isGiteeConfigComplete } from './config';
import { GiteeConnectionFields } from './GiteeConnectionFields';

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

export function contributeGiteeUi(ui: PluginUiHost): void {
  ui.registerConnectionFields({
    pluginId: giteeManifest.id,
    labelPrefix: 'gitee.config',
    isConfigComplete: isGiteeConfigComplete,
    component: GiteeConnectionFields,
  });
  ui.registerSourceIcon({
    pluginId: giteeManifest.id,
    render: (size = 18) => <GiteeIcon size={size} />,
  });
}

export function unregisterGiteeUi(ui: PluginUiHost): void {
  ui.unregisterConnectionFields(giteeManifest.id);
  ui.unregisterSourceIcon(giteeManifest.id);
}

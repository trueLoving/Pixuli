import {
  getRepoConfigFromSource,
  resolveSourceDisplay,
  type StoredSourceEntry,
} from '@pixuli/core/sources';

/** 当前同步目标的展示名。仓库在设置里指定，菜单只用来说明。 */
export function formatSyncTargetLabel(
  source: StoredSourceEntry | null | undefined,
  emptyLabel: string,
): string {
  if (!source) {
    return emptyLabel;
  }
  const repo = getRepoConfigFromSource(source);
  const { typeLabel } = resolveSourceDisplay(source.pluginId);
  if (!repo.owner && !repo.repo) {
    return typeLabel;
  }
  return `${typeLabel} ${repo.owner}/${repo.repo}`;
}

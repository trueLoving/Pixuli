import { describe, it, expect } from 'vitest';
import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
  type StoredSourceEntry,
} from '@pixuli/core/sources';

/** Web/Desktop GiteeConfigModal 与 Mobile StorageConfigModal 编辑态共用 */
function resolveEditFormFromSource(
  sources: StoredSourceEntry[],
  sourceId: string,
) {
  const source = sources.find(s => s.id === sourceId);
  if (!source) {
    return null;
  }
  return {
    legacyType: pluginIdToLegacyType(source.pluginId),
    form: getRepoConfigFromSource(source),
  };
}

const githubEntry: StoredSourceEntry = {
  id: 'gh-m',
  label: 'a/b',
  pluginId: 'github',
  config: {
    owner: 'a',
    repo: 'b',
    branch: 'main',
    token: 't1',
    path: 'images',
  },
  createdAt: 1,
  updatedAt: 1,
};

const giteeEntry: StoredSourceEntry = {
  id: 'gt-m',
  label: 'x/y',
  pluginId: 'gitee',
  config: {
    owner: 'x',
    repo: 'y',
    branch: 'master',
    token: 't2',
    path: 'pics',
  },
  createdAt: 2,
  updatedAt: 2,
};

describe('storage config edit init (REF-310 / M3 parity)', () => {
  it('编辑非当前选中 Gitee 源应回显其 config', () => {
    const resolved = resolveEditFormFromSource(
      [githubEntry, giteeEntry],
      'gt-m',
    );
    expect(resolved?.legacyType).toBe('gitee');
    expect(resolved?.form).toMatchObject({
      owner: 'x',
      repo: 'y',
      token: 't2',
      path: 'pics',
    });
  });
});

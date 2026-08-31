import { describe, expect, it } from 'vitest';
import {
  storedSourceToWorkspaceBinding,
  storedSourcesToWorkspaceBindings,
} from '../bindings';
import type { StoredSourceEntry } from '../../plugins/types';

function makeSource(
  overrides: Partial<StoredSourceEntry> = {},
): StoredSourceEntry {
  return {
    id: 'source-1',
    pluginId: 'github',
    label: 'My Repo',
    config: {
      owner: 'acme',
      repo: 'photos',
      branch: 'main',
      token: 'secret',
      path: '/root/',
    },
    ...overrides,
  };
}

describe('storedSourceToWorkspaceBinding (D3 configRoot)', () => {
  it('maps source fields to workspace binding', () => {
    const binding = storedSourceToWorkspaceBinding(makeSource());
    expect(binding).toEqual({
      id: 'source-1',
      label: 'My Repo',
      pluginId: 'github',
      configRoot: 'root',
      config: makeSource().config,
    });
  });

  it('normalizes configRoot slashes', () => {
    const binding = storedSourceToWorkspaceBinding(
      makeSource({
        config: {
          owner: 'a',
          repo: 'b',
          branch: 'main',
          token: 't',
          path: '///photos///',
        },
      }),
    );
    expect(binding.configRoot).toBe('photos');
  });

  it('allows empty configRoot for repo root mirror', () => {
    const binding = storedSourceToWorkspaceBinding(
      makeSource({
        config: {
          owner: 'a',
          repo: 'b',
          branch: 'main',
          token: 't',
          path: '',
        },
      }),
    );
    expect(binding.configRoot).toBe('');
  });
});

describe('storedSourcesToWorkspaceBindings', () => {
  it('maps all sources in order', () => {
    const sources = [
      makeSource({ id: 'a', pluginId: 'github' }),
      makeSource({
        id: 'b',
        pluginId: 'gitee',
        label: 'Gitee',
        config: {
          owner: 'x',
          repo: 'y',
          branch: 'master',
          token: 't',
          path: 'img',
        },
      }),
    ];
    const bindings = storedSourcesToWorkspaceBindings(sources);
    expect(bindings).toHaveLength(2);
    expect(bindings[0].id).toBe('a');
    expect(bindings[1].pluginId).toBe('gitee');
    expect(bindings[1].configRoot).toBe('img');
  });
});

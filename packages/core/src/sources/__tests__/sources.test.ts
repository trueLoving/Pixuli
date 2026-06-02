import { describe, expect, it } from 'vitest';
import {
  buildPluginConfigExport,
  createStoredSourceEntry,
  normalizeStoredSourceEntry,
  normalizeStoredSources,
  parsePluginConfigImport,
} from '../index';

describe('normalizeStoredSourceEntry', () => {
  it('accepts StoredSourceEntry shape', () => {
    const entry = normalizeStoredSourceEntry({
      id: 'a1',
      label: 'my/repo',
      pluginId: 'github',
      config: {
        owner: 'o',
        repo: 'r',
        branch: 'main',
        token: 't',
        path: 'images',
      },
      createdAt: 1,
      updatedAt: 2,
    });
    expect(entry).toMatchObject({
      id: 'a1',
      label: 'my/repo',
      pluginId: 'github',
    });
  });

  it('migrates legacy flat entry with type and name', () => {
    const entry = normalizeStoredSourceEntry({
      id: 'b2',
      type: 'gitee',
      name: 'owner/repo',
      owner: 'owner',
      repo: 'repo',
      branch: 'master',
      token: 'secret',
      path: 'pics',
      createdAt: 10,
      updatedAt: 20,
    });
    expect(entry?.pluginId).toBe('gitee');
    expect(entry?.label).toBe('owner/repo');
    expect(entry?.config).toMatchObject({
      owner: 'owner',
      repo: 'repo',
      token: 'secret',
    });
  });

  it('rejects invalid entries', () => {
    expect(normalizeStoredSourceEntry(null)).toBeNull();
    expect(normalizeStoredSourceEntry({ id: 'x' })).toBeNull();
  });
});

describe('normalizeStoredSources', () => {
  it('filters invalid items', () => {
    const list = normalizeStoredSources([
      { id: '1', type: 'github', owner: 'a', repo: 'b', token: 't' },
      { id: 'bad' },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].pluginId).toBe('github');
  });
});

describe('plugin config import/export', () => {
  it('exports with pluginId', () => {
    const payload = buildPluginConfigExport({
      pluginId: 'github',
      config: { owner: 'a', repo: 'b', token: 't' },
      platform: 'web',
    });
    expect(payload.version).toBe('2.0');
    expect(payload.pluginId).toBe('github');
  });

  it('parses v2 export', () => {
    const parsed = parsePluginConfigImport(
      buildPluginConfigExport({
        pluginId: 'gitee',
        config: { owner: 'a', repo: 'b', token: 't' },
      }),
      'github',
    );
    expect(parsed?.pluginId).toBe('gitee');
    expect(parsed?.config.owner).toBe('a');
  });

  it('parses v1 export without pluginId', () => {
    const parsed = parsePluginConfigImport(
      {
        version: '1.0',
        config: {
          owner: 'a',
          repo: 'b',
          token: 't',
          branch: 'main',
          path: 'images',
        },
      },
      'github',
    );
    expect(parsed?.pluginId).toBe('github');
  });

  it('infers pluginId from legacy type field', () => {
    const parsed = parsePluginConfigImport(
      { type: 'gitee', config: { owner: 'a', repo: 'b', token: 't' } },
      'github',
    );
    expect(parsed?.pluginId).toBe('gitee');
  });
});

describe('createStoredSourceEntry', () => {
  it('creates entry with timestamps', () => {
    const entry = createStoredSourceEntry({
      pluginId: 'github',
      label: 'test',
      config: { owner: 'a', repo: 'b', token: 't' },
    });
    expect(entry.pluginId).toBe('github');
    expect(entry.createdAt).toBeLessThanOrEqual(Date.now());
  });
});

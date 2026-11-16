import { describe, expect, it } from 'vitest';
import { buildPluginConfigExport } from '../../sources/importExport';
import {
  USER_CONFIG_KIND,
  buildSettingsExport,
  buildUserConfigExport,
  parseSettingsImport,
  parseUserConfigImport,
} from '../index';

const github = {
  id: 'gh-1',
  label: 'alpha/repo',
  pluginId: 'github' as const,
  config: {
    owner: 'alpha',
    repo: 'repo',
    token: 'token-alpha',
    branch: 'main',
  },
  createdAt: 1,
  updatedAt: 1,
};

describe('user-config envelope', () => {
  it('round-trips preferences and sources', () => {
    const payload = buildUserConfigExport({
      preferences: { language: 'zh-CN', theme: 'dark' },
      sources: { items: [github], selectedSourceId: 'gh-1' },
    });
    expect(payload.kind).toBe(USER_CONFIG_KIND);
    const parsed = parseUserConfigImport(payload);
    expect(parsed?.preferences).toEqual({
      language: 'zh-CN',
      theme: 'dark',
    });
    expect(parsed?.sources?.selectedSourceId).toBe('gh-1');
    expect(parsed?.sources?.items.map(s => s.id)).toEqual(['gh-1']);
    expect(parsed?.skippedBlocks).toEqual([]);
  });

  it('skips unknown blocks without failing', () => {
    const parsed = parseUserConfigImport({
      kind: USER_CONFIG_KIND,
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      blocks: {
        preferences: { language: 'en-US' },
        libraryUi: { density: 'compact' },
      },
    });
    expect(parsed?.preferences?.language).toBe('en-US');
    expect(parsed?.sources).toBeNull();
    expect(parsed?.skippedBlocks).toEqual(['libraryUi']);
  });

  it('imports legacy pixuli-settings as sources only', () => {
    const parsed = parseUserConfigImport({
      version: '1.0',
      kind: 'pixuli-settings',
      timestamp: '2026-01-01T00:00:00.000Z',
      selectedSourceId: 'gh-1',
      sources: [github],
    });
    expect(parsed?.preferences).toBeNull();
    expect(parsed?.sources?.items).toHaveLength(1);
    expect(parsed?.sources?.selectedSourceId).toBe('gh-1');
  });

  it('imports legacy single-plugin export as one source', () => {
    const parsed = parseUserConfigImport(
      buildPluginConfigExport({
        pluginId: 'gitee',
        config: { owner: 'o', repo: 'r', token: 't' },
      }),
    );
    expect(parsed?.sources?.items).toHaveLength(1);
    expect(parsed?.sources?.items[0]?.pluginId).toBe('gitee');
  });

  it('buildSettingsExport writes the new envelope', () => {
    const payload = buildSettingsExport({
      sources: [github],
      selectedSourceId: 'gh-1',
    });
    expect(payload.kind).toBe(USER_CONFIG_KIND);
    expect(payload.blocks.sources?.items).toHaveLength(1);
    expect(parseSettingsImport(payload)?.selectedSourceId).toBe('gh-1');
  });

  it('rejects a sources block whose items are all invalid', () => {
    expect(
      parseUserConfigImport({
        kind: USER_CONFIG_KIND,
        schemaVersion: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        blocks: {
          sources: { items: [{ id: 'x' }], selectedSourceId: null },
        },
      }),
    ).toBeNull();
  });
});

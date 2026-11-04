import { describe, it, expect } from 'vitest';
import {
  isStoragePluginRegistered,
  listStoragePluginManifests,
} from '../registry';

describe('storage registry (REF-310 / W3)', () => {
  it('应注册 github 与 gitee 内置插件', () => {
    const ids = listStoragePluginManifests().map(m => m.id);
    expect(ids).toContain('github');
    expect(ids).toContain('gitee');
    expect(isStoragePluginRegistered('github')).toBe(true);
    expect(isStoragePluginRegistered('gitee')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  formatWorkspacePathHint,
  formatWorkspaceTitle,
  isVirtualWorkspaceRoot,
} from '../workspacePathDisplay';

describe('isVirtualWorkspaceRoot', () => {
  it('detects virtual workspace schemes', () => {
    expect(isVirtualWorkspaceRoot('fsa://abc')).toBe(true);
    expect(isVirtualWorkspaceRoot('opfs://abc')).toBe(true);
    expect(isVirtualWorkspaceRoot('mobile://abc')).toBe(true);
    expect(isVirtualWorkspaceRoot('/Users/me/Pictures')).toBe(false);
  });
});

describe('formatWorkspacePathHint', () => {
  const t = (key: string) => key;

  it('returns absolute filesystem paths as-is', () => {
    expect(formatWorkspacePathHint('/Users/me/Pictures/111', null, t)).toBe(
      '/Users/me/Pictures/111',
    );
  });

  it('uses resolved absolute path for FSA workspaces', () => {
    expect(
      formatWorkspacePathHint('fsa://abc', '/Users/me/Pictures/222', t),
    ).toBe('/Users/me/Pictures/222');
  });

  it('returns null for FSA when absolute path is unavailable', () => {
    expect(formatWorkspacePathHint('fsa://abc', null, t)).toBeNull();
  });

  it('labels other virtual storage backends', () => {
    expect(formatWorkspacePathHint('opfs://abc', null, t)).toBe(
      'workspace.webStorage',
    );
    expect(formatWorkspacePathHint('mobile://abc', null, t)).toBe(
      'workspace.mobileStorage',
    );
  });
});

describe('formatWorkspaceTitle', () => {
  const t = (key: string) => key;

  it('combines workspace name and absolute path', () => {
    expect(
      formatWorkspaceTitle(
        '/Users/me/Pictures/111',
        '111',
        '/Users/me/Pictures/111',
        t,
      ),
    ).toBe('111（/Users/me/Pictures/111）');
    expect(
      formatWorkspaceTitle('fsa://abc', '222', '/Users/me/Pictures/222', t),
    ).toBe('222（/Users/me/Pictures/222）');
  });

  it('omits parentheses when FSA path cannot be resolved', () => {
    expect(formatWorkspaceTitle('fsa://abc', '222', null, t)).toBe('222');
  });

  it('falls back to unnamed when no path', () => {
    expect(formatWorkspaceTitle(null, null, null, t)).toBe('workspace.unnamed');
  });
});

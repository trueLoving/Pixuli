import { afterEach, describe, expect, it } from 'vitest';
import {
  hasKindEditor,
  hasKindProcess,
  resolveKindEditor,
} from '../kindActionResolve';
import { uiRegistry } from '../uiRegistry';

describe('kindActionResolve', () => {
  afterEach(() => {
    uiRegistry.unregisterEditor('test.editor');
    uiRegistry.unregisterProcess('test.process');
  });

  it('reports editor presence from registry', () => {
    expect(hasKindEditor({ name: 'a.md', type: 'text/markdown' })).toBe(false);

    uiRegistry.registerEditor({
      id: 'test.editor',
      match: input =>
        input.kind === 'markdown' || /\.md$/i.test(input.name ?? ''),
      component: () => null,
    });

    expect(hasKindEditor({ name: 'a.md', type: 'text/markdown' })).toBe(true);
    expect(resolveKindEditor({ name: 'a.md', type: '' })?.id).toBe(
      'test.editor',
    );
    expect(hasKindProcess({ name: 'a.md', type: 'text/markdown' })).toBe(false);
  });

  it('reports process presence from registry', () => {
    uiRegistry.registerProcess({
      id: 'test.process',
      match: input =>
        input.kind === 'image' || /\.jpg$/i.test(input.name ?? ''),
      component: () => null,
    });
    expect(hasKindProcess({ name: 'a.jpg', type: 'image/jpeg' })).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { DefaultUiContributionRegistry } from '../uiRegistry';

describe('UiContributionRegistry', () => {
  it('resolves preview by match and priority', () => {
    const reg = new DefaultUiContributionRegistry();
    reg.registerPreview({
      id: 'low',
      priority: 1,
      match: input => input.kind === 'pdf',
      component: () => null,
    });
    reg.registerPreview({
      id: 'high',
      priority: 10,
      match: input => input.kind === 'pdf',
      component: () => null,
    });
    expect(reg.resolvePreview({ name: 'a.pdf', kind: 'pdf' })?.id).toBe('high');
  });

  it('resolves connection fields and icons by pluginId', () => {
    const reg = new DefaultUiContributionRegistry();
    reg.registerConnectionFields({
      pluginId: 'github',
      component: () => null,
    });
    reg.registerSourceIcon({
      pluginId: 'github',
      render: () => 'gh',
    });
    expect(reg.resolveConnectionFields('github')?.pluginId).toBe('github');
    expect(reg.resolveSourceIcon('missing')).toBeUndefined();
    expect(reg.listConnectionPluginIds()).toEqual(['github']);
  });

  it('returns undefined when nothing matches', () => {
    const reg = new DefaultUiContributionRegistry();
    expect(
      reg.resolvePreview({ name: 'x.bin', kind: 'other' }),
    ).toBeUndefined();
  });

  it('unregisters preview / connection / icon by id', () => {
    const reg = new DefaultUiContributionRegistry();
    reg.registerPreview({
      id: 'kind.pdf',
      match: input => input.kind === 'pdf',
      component: () => null,
    });
    reg.registerConnectionFields({
      pluginId: 'github',
      component: () => null,
    });
    reg.registerSourceIcon({
      pluginId: 'github',
      render: () => null,
    });

    expect(reg.unregisterPreview('kind.pdf')).toBe(true);
    expect(reg.resolvePreview({ name: 'a.pdf', kind: 'pdf' })).toBeUndefined();
    expect(reg.unregisterConnectionFields('github')).toBe(true);
    expect(reg.resolveConnectionFields('github')).toBeUndefined();
    expect(reg.unregisterSourceIcon('github')).toBe(true);
    expect(reg.resolveSourceIcon('github')).toBeUndefined();
  });

  it('resolves and unregisters editor / process contributions', () => {
    const reg = new DefaultUiContributionRegistry();
    reg.registerEditor({
      id: 'kind.markdown',
      priority: 10,
      match: input => input.kind === 'markdown',
      component: () => null,
      labelKey: 'image.editor.open',
      placement: 'modal',
    });
    reg.registerProcess({
      id: 'kind.image',
      priority: 5,
      match: input => input.kind === 'image',
      component: () => null,
      labelKey: 'image.process.open',
    });

    expect(reg.resolveEditor({ name: 'a.md', kind: 'markdown' })?.id).toBe(
      'kind.markdown',
    );
    expect(reg.resolveProcess({ name: 'a.jpg', kind: 'image' })?.id).toBe(
      'kind.image',
    );

    expect(reg.unregisterEditor('kind.markdown')).toBe(true);
    expect(
      reg.resolveEditor({ name: 'a.md', kind: 'markdown' }),
    ).toBeUndefined();
    expect(reg.unregisterProcess('kind.image')).toBe(true);
    expect(
      reg.resolveProcess({ name: 'a.jpg', kind: 'image' }),
    ).toBeUndefined();
  });
});

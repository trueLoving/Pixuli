import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { AssetItem } from '@pixuli/core/types';
import { KindEditorHost } from '../KindEditorHost';
import { uiRegistry } from '@/plugins/uiRegistry';

const asset = {
  id: '1',
  name: 'notes.md',
  type: 'text/markdown',
  url: '',
  localPath: 'notes.md',
} as AssetItem;

describe('KindEditorHost', () => {
  afterEach(() => {
    uiRegistry.unregisterEditor('test.markdown');
  });

  it('renders nothing when closed or no contribution', () => {
    const { container, rerender } = render(
      <KindEditorHost
        asset={asset}
        src={null}
        open={false}
        onClose={() => undefined}
        t={k => k}
      />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <KindEditorHost
        asset={asset}
        src={null}
        open
        onClose={() => undefined}
        t={k => k}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders plugin editor when open and contribution exists', () => {
    uiRegistry.registerEditor({
      id: 'test.markdown',
      match: input => input.kind === 'markdown' || input.name.endsWith('.md'),
      component: ({ onClose }) => (
        <button type="button" onClick={onClose}>
          plugin-editor
        </button>
      ),
    });

    render(
      <KindEditorHost
        asset={asset}
        src={null}
        open
        onClose={() => undefined}
        t={k => k}
      />,
    );
    expect(screen.getByRole('button', { name: 'plugin-editor' })).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

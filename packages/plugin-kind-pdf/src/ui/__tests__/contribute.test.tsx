import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { contributePdfUi } from '../contribute';

describe('contributePdfUi', () => {
  it('wires host readFile into registered preview without app wrapper', () => {
    const readFile = vi.fn(async () => new Uint8Array([1]));
    const isLocalAvailable = vi.fn(() => true);
    let Preview: React.ComponentType<{
      asset: { name: string };
      src: string | null;
      localPath?: string | null;
      variant: 'inspector' | 'modal';
      t: (key: string) => string;
    }> | null = null;

    const ui = createEmptyPluginUiHost();
    ui.registerPreview = contribution => {
      Preview = contribution.component as typeof Preview;
    };

    contributePdfUi(ui, { readFile, isLocalAvailable });
    expect(Preview).toBeTruthy();
    const Slot = Preview!;

    render(
      <Slot
        asset={{ name: 'a.pdf' }}
        src={null}
        localPath="docs/a.pdf"
        variant="inspector"
        t={key => key}
      />,
    );

    expect(screen.getByText('image.pdf.loading')).toBeInTheDocument();
  });
});

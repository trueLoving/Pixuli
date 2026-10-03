import { describe, expect, it, vi } from 'vitest';
import type { ImageItem } from '@pixuli/core/types';
import {
  buildBatchSelectionActions,
  buildSingleSelectionActions,
  filterActionsForMobileBar,
} from './selectionActions';

const image = {
  id: '1',
  name: 'a.jpg',
  localPath: 'images/a.jpg',
  url: '',
  githubUrl: '',
  size: 1,
  width: 1,
  height: 1,
  uploadTime: '2026-01-01',
  tags: [],
} as ImageItem;

const pdf = {
  ...image,
  id: '2',
  name: 'doc.pdf',
  type: 'application/pdf',
} as ImageItem;

describe('buildBatchSelectionActions move', () => {
  const t = (key: string) => key;

  it('adds a local-only move action and keeps it on the narrow bar', () => {
    const onBatchMove = vi.fn();
    const actions = buildBatchSelectionActions([image], t, {
      onBatchMove,
      onBatchDelete: vi.fn(),
    });
    const move = actions.grid.find(action => action.id === 'batch-move');
    expect(move?.title).toBe('image.library.batchMoveHint');
    move?.onClick();
    expect(onBatchMove).toHaveBeenCalled();

    const mobile = filterActionsForMobileBar(actions);
    expect(mobile.grid.map(action => action.id)).toContain('batch-move');
  });

  it('omits move when the handler is absent', () => {
    const actions = buildBatchSelectionActions([image], t, {
      onBatchDelete: vi.fn(),
    });
    expect(actions.grid.some(action => action.id === 'batch-move')).toBe(false);
  });
});

describe('buildBatchSelectionActions tools switch', () => {
  const t = (key: string) => key;

  it('hides compress/convert when tools are off', () => {
    const actions = buildBatchSelectionActions(
      [image],
      t,
      {
        onSendCompress: vi.fn(),
        onSendConvert: vi.fn(),
        onBatchDelete: vi.fn(),
      },
      { toolsEnabled: false },
    );
    expect(actions.grid.some(action => action.id === 'compress')).toBe(false);
    expect(actions.grid.some(action => action.id === 'convert')).toBe(false);
  });

  it('shows compress for images when tools are on', () => {
    const onSendCompress = vi.fn();
    const actions = buildBatchSelectionActions(
      [image],
      t,
      {
        onSendCompress,
        onSendConvert: vi.fn(),
        onBatchDelete: vi.fn(),
      },
      { toolsEnabled: true },
    );
    const compress = actions.grid.find(action => action.id === 'compress');
    expect(compress?.disabled).toBe(false);
    compress?.onClick();
    expect(onSendCompress).toHaveBeenCalled();
  });

  it('disables compress for non-images with a reason when tools are on', () => {
    const actions = buildBatchSelectionActions(
      [pdf],
      t,
      {
        onSendCompress: vi.fn(),
        onSendConvert: vi.fn(),
        onBatchDelete: vi.fn(),
      },
      { toolsEnabled: true },
    );
    const compress = actions.grid.find(action => action.id === 'compress');
    expect(compress?.disabled).toBe(true);
    expect(compress?.title).toBe('image.inspector.toolImageOnly');
  });
});

describe('buildSingleSelectionActions tools switch', () => {
  const t = (key: string) => key;

  it('hides compress when tools are off', () => {
    const actions = buildSingleSelectionActions(
      'image',
      t,
      {
        onCopy: vi.fn(),
        onSendCompress: vi.fn(),
        onDelete: vi.fn(),
      },
      {
        canEdit: false,
        canShare: false,
        canDelete: true,
        toolsEnabled: false,
      },
    );
    expect(actions.grid.some(action => action.id === 'compress')).toBe(false);
  });

  it('disables compress for pdf when tools are on', () => {
    const actions = buildSingleSelectionActions(
      'pdf',
      t,
      {
        onCopy: vi.fn(),
        onSendCompress: vi.fn(),
        onDelete: vi.fn(),
      },
      {
        canEdit: false,
        canShare: false,
        canDelete: true,
        toolsEnabled: true,
      },
    );
    const compress = actions.grid.find(action => action.id === 'compress');
    expect(compress?.disabled).toBe(true);
    expect(compress?.title).toBe('image.inspector.toolImageOnly');
  });
});

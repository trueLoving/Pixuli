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

describe('buildBatchSelectionActions process', () => {
  const t = (key: string) => key;

  it('hides process outside the local library', () => {
    const actions = buildBatchSelectionActions(
      [image],
      t,
      {
        onSendConvert: vi.fn(),
        onBatchDelete: vi.fn(),
      },
      { convertInLibrary: false },
    );
    expect(actions.grid.some(action => action.id === 'convert')).toBe(false);
    expect(actions.grid.some(action => action.id === 'compress')).toBe(false);
  });

  it('shows process for images in the local library', () => {
    const onSendConvert = vi.fn();
    const actions = buildBatchSelectionActions(
      [image],
      t,
      {
        onSendConvert,
        onBatchDelete: vi.fn(),
      },
      { convertInLibrary: true },
    );
    const convert = actions.grid.find(action => action.id === 'convert');
    expect(convert?.disabled).toBe(false);
    convert?.onClick();
    expect(onSendConvert).toHaveBeenCalled();
  });

  it('hides process when the selection has no processable files', () => {
    const actions = buildBatchSelectionActions(
      [pdf],
      t,
      {
        onSendConvert: vi.fn(),
        onBatchDelete: vi.fn(),
      },
      { convertInLibrary: true },
    );
    expect(actions.grid.some(action => action.id === 'convert')).toBe(false);
  });
});

describe('buildBatchSelectionActions copy-link guidance', () => {
  const t = (key: string) => key;

  it('keeps copy clickable when local-only so toast can offer sync', () => {
    const onCopyLinks = vi.fn();
    const actions = buildBatchSelectionActions(
      [image],
      t,
      {
        onCopyLinks,
        onBatchDelete: vi.fn(),
      },
      { hasRemoteConnection: true },
    );
    const copy = actions.grid.find(action => action.id === 'copy-links');
    expect(copy?.disabled).toBeFalsy();
    expect(copy?.title).toBe('image.copyLink.needSync');
    copy?.onClick();
    expect(onCopyLinks).toHaveBeenCalled();
  });

  it('titles needConnection when no remote', () => {
    const actions = buildBatchSelectionActions(
      [image],
      t,
      {
        onCopyLinks: vi.fn(),
        onBatchDelete: vi.fn(),
      },
      { hasRemoteConnection: false },
    );
    const copy = actions.grid.find(action => action.id === 'copy-links');
    expect(copy?.title).toBe('image.copyLink.needConnection');
    expect(copy?.disabled).toBeFalsy();
  });
});

describe('buildSingleSelectionActions process', () => {
  const t = (key: string) => key;

  it('hides process outside the local library', () => {
    const actions = buildSingleSelectionActions(
      'image',
      t,
      {
        onCopy: vi.fn(),
        onDelete: vi.fn(),
      },
      {
        canEdit: false,
        canShare: false,
        canDelete: true,
        convertInLibrary: false,
      },
    );
    expect(actions.grid.some(action => action.id === 'compress')).toBe(false);
    expect(actions.grid.some(action => action.id === 'convert')).toBe(false);
  });

  it('shows process for an image in the local library', () => {
    const onSendConvert = vi.fn();
    const actions = buildSingleSelectionActions(
      'image',
      t,
      {
        onCopy: vi.fn(),
        onSendConvert,
        onDelete: vi.fn(),
      },
      {
        canEdit: false,
        canShare: false,
        canDelete: true,
        convertInLibrary: true,
      },
    );
    const convert = actions.grid.find(action => action.id === 'convert');
    expect(convert?.disabled).toBe(false);
    convert?.onClick();
    expect(onSendConvert).toHaveBeenCalled();
  });

  it('hides process for a pdf', () => {
    const actions = buildSingleSelectionActions(
      'pdf',
      t,
      {
        onCopy: vi.fn(),
        onSendConvert: vi.fn(),
        onDelete: vi.fn(),
      },
      {
        canEdit: false,
        canShare: false,
        canDelete: true,
        convertInLibrary: true,
      },
    );
    expect(actions.grid.some(action => action.id === 'convert')).toBe(false);
  });

  it('keeps copy clickable when no public url', () => {
    const onCopy = vi.fn();
    const actions = buildSingleSelectionActions(
      'image',
      t,
      { onCopy, onDelete: vi.fn() },
      {
        canEdit: false,
        canShare: false,
        canDelete: true,
        canCopy: false,
        copyDisabledTitle: 'image.copyLink.needSync',
      },
    );
    const copy = actions.grid.find(action => action.id === 'copy');
    expect(copy?.disabled).toBeFalsy();
    expect(copy?.title).toBe('image.copyLink.needSync');
    copy?.onClick();
    expect(onCopy).toHaveBeenCalled();
  });
});

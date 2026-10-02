import { describe, expect, it, vi } from 'vitest';
import type { ImageItem } from '@pixuli/core/types';
import {
  buildBatchSelectionActions,
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

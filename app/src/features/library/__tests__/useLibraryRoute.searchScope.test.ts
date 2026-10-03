import { describe, expect, it } from 'vitest';
import type { ImageItem } from '@pixuli/core/types';
import { filterImagesByFolder } from '@/features/workspace/folderTree';

/**
 * 与 useLibraryRoute 中 visibleImages 选择逻辑一致：
 * 仅在「有查询 + 工作区范围 + 当前在文件夹内」时忽略树过滤。
 */
function resolveVisibleImages(
  images: ImageItem[],
  selectedFolderPath: string | null | undefined,
  searchScope: 'folder' | 'workspace',
  searchQuery: string,
): ImageItem[] {
  const searchAllWorkspace =
    searchScope === 'workspace' &&
    Boolean(searchQuery.trim()) &&
    Boolean(selectedFolderPath);
  return searchAllWorkspace
    ? images
    : filterImagesByFolder(images, selectedFolderPath);
}

const items = [
  {
    id: '1',
    name: 'a.jpg',
    localPath: 'photos/a.jpg',
    url: '',
    size: 1,
    width: 1,
    height: 1,
    type: 'image/jpeg',
  },
  {
    id: '2',
    name: 'b.jpg',
    localPath: 'docs/b.jpg',
    url: '',
    size: 1,
    width: 1,
    height: 1,
    type: 'image/jpeg',
  },
] as ImageItem[];

describe('library search scope (REF-612)', () => {
  it('keeps folder filter when scope is folder', () => {
    const visible = resolveVisibleImages(items, 'photos', 'folder', 'jpg');
    expect(visible.map(item => item.id)).toEqual(['1']);
  });

  it('expands to whole workspace when scope is workspace', () => {
    const visible = resolveVisibleImages(items, 'photos', 'workspace', 'jpg');
    expect(visible.map(item => item.id)).toEqual(['1', '2']);
  });

  it('does not expand without a committed query', () => {
    const visible = resolveVisibleImages(items, 'photos', 'workspace', '');
    expect(visible.map(item => item.id)).toEqual(['1']);
  });

  it('does not expand when already at workspace root', () => {
    const visible = resolveVisibleImages(items, '', 'workspace', 'jpg');
    expect(visible).toHaveLength(2);
  });
});

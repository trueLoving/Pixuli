import type { LocalListOptions } from '@pixuli/core/vault';
import { LIBRARY_ROOT_LIST_CAP } from '@/features/library/utils/libraryScale';
import { useUIStore } from '@/stores/uiStore';

/** 本地资源库列表加载范围（store/索引懒载入） */
export type LibraryListScope = {
  quiet?: boolean;
  /** 当前文件夹；空 = 根 `/` 浅层（仍 defer 预览） */
  folderPath?: string;
  /** 「在全部中搜索」且已有查询词 */
  searchAll?: boolean;
  searchQuery?: string;
};

/** 无显式 scope 时（上传后刷新等）：按当前选中文件夹浅载入 */
export function readDefaultLibraryListScope(): LibraryListScope {
  return {
    folderPath: useUIStore.getState().selectedFolderPath,
  };
}

/** LibraryListScope → vault.list 选项（文件夹浅载入 / 全库搜索 / 根视图上限） */
export function toLocalListOptions(scope: LibraryListScope): LocalListOptions {
  const query = scope.searchQuery?.trim();
  if (scope.searchAll && query) {
    return { search: query, limit: LIBRARY_ROOT_LIST_CAP };
  }
  const folderPath = scope.folderPath?.trim() ?? '';
  if (folderPath) {
    return { pathPrefix: folderPath, shallow: true };
  }
  // 根有查询：全库搜索；否则本层文件 + 子文件夹入口（非整库摊平）
  if (query) {
    return { search: query, limit: LIBRARY_ROOT_LIST_CAP };
  }
  return { shallow: true, limit: LIBRARY_ROOT_LIST_CAP };
}

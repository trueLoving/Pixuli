import { useCallback } from 'react';
import type { BatchMetadataPatch } from '@/features/library/assetMutationService';
import { useAssetStore } from '@/features/library/assetStore';

/**
 * 图片操作相关的 hooks
 */
export function useAssetOperations() {
  const { deleteAsset, deleteMultipleAssets, updateAsset, loadAssets } =
    useAssetStore();

  const handleDeleteAsset = useCallback(
    async (assetId: string, fileName: string) => {
      try {
        await deleteAsset(assetId, fileName);
        // 删除后重新加载图片列表
        await loadAssets();
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    },
    [deleteAsset, loadAssets],
  );

  const handleDeleteMultipleAssets = useCallback(
    async (assetIds: string[], fileNames: string[]) => {
      try {
        await deleteMultipleAssets(assetIds, fileNames);
        // 删除后重新加载图片列表
        await loadAssets();
      } catch (error) {
        console.error('Failed to delete multiple images:', error);
      }
    },
    [deleteMultipleAssets, loadAssets],
  );

  const handleUpdateAsset = useCallback(
    async (data: any) => {
      try {
        await updateAsset(data);
        // 更新后重新加载图片列表
        await loadAssets();
      } catch (error) {
        console.error('Failed to update image:', error);
      }
    },
    [updateAsset, loadAssets],
  );

  const handleBatchUpdateMetadata = useCallback(
    async (assetIds: string[], patch: BatchMetadataPatch) => {
      const { batchUpdateMetadata } = useAssetStore.getState();
      const result = await batchUpdateMetadata(assetIds, patch);
      await loadAssets();
      return result;
    },
    [loadAssets],
  );

  return {
    handleDeleteAsset,
    handleDeleteMultipleAssets,
    handleUpdateAsset,
    handleBatchUpdateMetadata,
  };
}

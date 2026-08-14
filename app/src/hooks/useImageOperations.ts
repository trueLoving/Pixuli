import { useCallback } from 'react';
import { useImageStore } from '../stores/imageStore';

/**
 * 图片操作相关的 hooks
 */
export function useImageOperations() {
  const { deleteImage, deleteMultipleImages, updateImage, loadImages } =
    useImageStore();

  const handleDeleteImage = useCallback(
    async (imageId: string, fileName: string) => {
      try {
        await deleteImage(imageId, fileName);
        // 删除后重新加载图片列表
        await loadImages();
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    },
    [deleteImage, loadImages],
  );

  const handleDeleteMultipleImages = useCallback(
    async (imageIds: string[], fileNames: string[]) => {
      try {
        await deleteMultipleImages(imageIds, fileNames);
        // 删除后重新加载图片列表
        await loadImages();
      } catch (error) {
        console.error('Failed to delete multiple images:', error);
      }
    },
    [deleteMultipleImages, loadImages],
  );

  const handleUpdateImage = useCallback(
    async (data: any) => {
      try {
        await updateImage(data);
        // 更新后重新加载图片列表
        await loadImages();
      } catch (error) {
        console.error('Failed to update image:', error);
      }
    },
    [updateImage, loadImages],
  );

  return {
    handleDeleteImage,
    handleDeleteMultipleImages,
    handleUpdateImage,
  };
}

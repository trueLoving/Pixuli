import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageCompressionOptions } from '@pixuli/core/types';
import { compressImage } from '@pixuli/core/utils';
import { showInfo } from '@/ui/feedback/toast';
import {
  DEFAULT_COMPRESSION_OPTIONS,
  type CompressionPreviewMap,
} from './imageUploadTypes';

interface UseImageUploadCompressionOptions {
  enableCompression: boolean;
  compressionOptions?: ImageCompressionOptions;
  fileDimensions: Record<string, { width: number; height: number }>;
}

export function useImageUploadCompression({
  enableCompression,
  compressionOptions,
  fileDimensions,
}: UseImageUploadCompressionOptions) {
  const [userWantsCompress, setUserWantsCompress] = useState(false);
  const [compressionPreview, setCompressionPreview] =
    useState<CompressionPreviewMap>({});
  const [calculatingCompression, setCalculatingCompression] = useState(false);
  const [showCompressionConfig, setShowCompressionConfig] = useState(false);
  const [userCompressionConfig, setUserCompressionConfig] =
    useState<ImageCompressionOptions>(
      compressionOptions || DEFAULT_COMPRESSION_OPTIONS,
    );

  const compressionPreviewRef = useRef(compressionPreview);
  useEffect(() => {
    compressionPreviewRef.current = compressionPreview;
  }, [compressionPreview]);

  const cleanupPreviewUrls = useCallback(() => {
    Object.values(compressionPreviewRef.current).forEach(preview => {
      if (preview.originalPreviewUrl) {
        URL.revokeObjectURL(preview.originalPreviewUrl);
      }
      if (preview.compressedPreviewUrl) {
        URL.revokeObjectURL(preview.compressedPreviewUrl);
      }
    });
  }, []);

  useEffect(() => () => cleanupPreviewUrls(), [cleanupPreviewUrls]);

  const compressFileIfNeeded = useCallback(
    async (file: File, shouldCompress: boolean): Promise<File> => {
      if (!shouldCompress || !enableCompression) {
        return file;
      }
      try {
        const compressionResult = await compressImage(
          file,
          userCompressionConfig,
        );
        if (compressionResult.compressionRatio > 0) {
          showInfo(
            `图片已压缩: ${compressionResult.compressionRatio.toFixed(1)}% (${(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB)`,
          );
        }
        return compressionResult.compressedFile;
      } catch (error) {
        console.warn('图片压缩失败，使用原文件:', error);
        showInfo('图片压缩失败，将使用原文件上传');
        return file;
      }
    },
    [enableCompression, userCompressionConfig],
  );

  const calculateCompressionPreview = useCallback(
    async (files: File[]) => {
      if (!enableCompression || files.length === 0) {
        setCompressionPreview({});
        return;
      }

      setCalculatingCompression(true);
      const preview: CompressionPreviewMap = {};

      try {
        await Promise.all(
          files.map(async file => {
            try {
              const originalPreviewUrl = URL.createObjectURL(file);
              const result = await compressImage(file, userCompressionConfig);
              const compressedPreviewUrl = URL.createObjectURL(
                result.compressedFile,
              );
              preview[file.name] = {
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                compressionRatio: result.compressionRatio,
                originalDimensions: result.originalDimensions,
                compressedDimensions: result.compressedDimensions,
                originalPreviewUrl,
                compressedPreviewUrl,
              };
            } catch (error) {
              console.warn(`计算压缩预览失败 ${file.name}:`, error);
              const dimensions = fileDimensions[file.name] || {
                width: 0,
                height: 0,
              };
              preview[file.name] = {
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 0,
                originalDimensions: dimensions,
                compressedDimensions: dimensions,
                originalPreviewUrl: URL.createObjectURL(file),
              };
            }
          }),
        );
        setCompressionPreview(preview);
      } catch (error) {
        console.error('计算压缩预览时出错:', error);
      } finally {
        setCalculatingCompression(false);
      }
    },
    [enableCompression, userCompressionConfig, fileDimensions],
  );

  const handleCompressionToggle = useCallback(
    (checked: boolean, files: File[]) => {
      setUserWantsCompress(checked);
      if (checked && files.length > 0) {
        void calculateCompressionPreview(files);
      } else {
        cleanupPreviewUrls();
        setCompressionPreview({});
      }
    },
    [calculateCompressionPreview, cleanupPreviewUrls],
  );

  const handleCompressionConfigChange = useCallback(
    (config: ImageCompressionOptions, previewFiles: File[]) => {
      setUserCompressionConfig(config);
      if (userWantsCompress && previewFiles.length > 0) {
        void calculateCompressionPreview(previewFiles);
      }
    },
    [userWantsCompress, calculateCompressionPreview],
  );

  const resetCompressionState = useCallback(() => {
    cleanupPreviewUrls();
    setCompressionPreview({});
    setUserWantsCompress(false);
    setShowCompressionConfig(false);
    setUserCompressionConfig(compressionOptions || DEFAULT_COMPRESSION_OPTIONS);
  }, [cleanupPreviewUrls, compressionOptions]);

  return {
    userWantsCompress,
    compressionPreview,
    calculatingCompression,
    showCompressionConfig,
    userCompressionConfig,
    setShowCompressionConfig,
    compressFileIfNeeded,
    handleCompressionToggle,
    handleCompressionConfigChange,
    resetCompressionState,
  };
}

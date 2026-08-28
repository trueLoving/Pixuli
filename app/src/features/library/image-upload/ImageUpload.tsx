import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defaultTranslate } from '@/i18n/locales';
import type {
  BatchUploadProgress,
  ImageCaptureMetadata,
  ImageCompressionOptions,
  ImageCropOptions,
  ImageUploadData,
  MultiImageUploadData,
  WebImageUploadData,
} from '@pixuli/core/types';
import { compressImage } from '@pixuli/core/utils';
import {
  showInfo,
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import type { NativeImagePickers } from './nativePickers';
import ImageCropModal from './ImageCropModal';
import { ImageUploadBatchProgress } from './ImageUploadBatchProgress';
import { ImageUploadConfirmForm } from './ImageUploadConfirmForm';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import {
  DEFAULT_COMPRESSION_OPTIONS,
  type CompressionPreviewMap,
} from './imageUploadTypes';
import {
  getImageDimensions,
  isPreviewableMedia,
  resolveDefaultFolder,
} from './imageUploadUtils';
import './ImageUpload.css';

interface ImageUploadProps {
  onUploadImage: (data: ImageUploadData) => Promise<unknown>;
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<unknown>;
  loading: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  t?: (key: string) => string;
  enableCrop?: boolean;
  cropOptions?: ImageCropOptions;
  enableCompression?: boolean;
  compressionOptions?: ImageCompressionOptions;
  /** Capacitor 等原生壳注入的相机/相册选图（REF-510 #120） */
  nativePickers?: NativeImagePickers;
  /** 默认目标文件夹（当前资源库范围） */
  defaultFolder?: string;
  /** 外部预填文件（主视图拖入打开确认） */
  initialFiles?: File[];
  onInitialFilesConsumed?: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadImage,
  onUploadMultipleImages,
  loading,
  batchUploadProgress,
  t,
  enableCrop = false,
  cropOptions,
  enableCompression = false,
  compressionOptions,
  nativePickers,
  defaultFolder,
  initialFiles,
  onInitialFilesConsumed,
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [uploadData, setUploadData] = useState<WebImageUploadData | null>(null);
  const [multiUploadData, setMultiUploadData] =
    useState<MultiImageUploadData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropFileIndex, setCropFileIndex] = useState<number>(-1);
  const [fileDimensions, setFileDimensions] = useState<{
    [key: string]: { width: number; height: number };
  }>({});
  const [userWantsCompress, setUserWantsCompress] = useState(false);
  const [userWantsCrop, setUserWantsCrop] = useState(false);
  const [compressionPreview, setCompressionPreview] =
    useState<CompressionPreviewMap>({});
  const [calculatingCompression, setCalculatingCompression] = useState(false);
  const [showCompressionConfig, setShowCompressionConfig] = useState(false);
  const [userCompressionConfig, setUserCompressionConfig] =
    useState<ImageCompressionOptions>(
      compressionOptions || DEFAULT_COMPRESSION_OPTIONS,
    );
  const tagInputRef = useRef<HTMLInputElement>(null);
  const captureMetadataByFileRef = useRef(
    new WeakMap<File, ImageCaptureMetadata>(),
  );

  const rememberCaptureMetadata = useCallback(
    (file: File, metadata?: ImageCaptureMetadata) => {
      if (metadata) {
        captureMetadataByFileRef.current.set(file, metadata);
      }
    },
    [],
  );

  const transferCaptureMetadata = useCallback((from: File, to: File) => {
    const metadata = captureMetadataByFileRef.current.get(from);
    if (metadata) {
      captureMetadataByFileRef.current.set(to, metadata);
      captureMetadataByFileRef.current.delete(from);
    }
  }, []);

  const getCaptureMetadata = useCallback(
    (file: File): ImageCaptureMetadata | undefined =>
      captureMetadataByFileRef.current.get(file),
    [],
  );

  const buildCaptureMetadataList = useCallback(
    (files: File[]) => files.map(file => getCaptureMetadata(file)),
    [getCaptureMetadata],
  );

  // 使用 ref 存储预览数据，避免依赖变化导致函数重新创建
  const compressionPreviewRef = useRef(compressionPreview);
  useEffect(() => {
    compressionPreviewRef.current = compressionPreview;
  }, [compressionPreview]);

  // 清理预览URL的辅助函数
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

  // 组件卸载时清理预览URL
  useEffect(() => {
    return () => {
      cleanupPreviewUrls();
    };
  }, [cleanupPreviewUrls]);

  // 压缩文件的辅助函数
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

  // 计算压缩预览
  const calculateCompressionPreview = useCallback(
    async (files: File[]) => {
      if (!enableCompression || files.length === 0) {
        setCompressionPreview({});
        return;
      }

      setCalculatingCompression(true);
      const preview: typeof compressionPreview = {};

      try {
        await Promise.all(
          files.map(async file => {
            try {
              // 创建原图预览URL
              const originalPreviewUrl = URL.createObjectURL(file);

              const result = await compressImage(file, userCompressionConfig);

              // 创建压缩后图片预览URL
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
              // 如果计算失败，使用原始信息
              const dimensions = fileDimensions[file.name] || {
                width: 0,
                height: 0,
              };
              const originalPreviewUrl = URL.createObjectURL(file);
              preview[file.name] = {
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 0,
                originalDimensions: dimensions,
                compressedDimensions: dimensions,
                originalPreviewUrl,
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

  // 当用户选择压缩时，计算预览
  const handleCompressionToggle = useCallback(
    (checked: boolean) => {
      setUserWantsCompress(checked);
      if (checked) {
        const files = uploadData
          ? [uploadData.file]
          : multiUploadData
            ? multiUploadData.files
            : [];
        if (files.length > 0) {
          calculateCompressionPreview(files);
        }
      } else {
        // 清理预览URL
        cleanupPreviewUrls();
        setCompressionPreview({});
      }
    },
    [
      uploadData,
      multiUploadData,
      calculateCompressionPreview,
      cleanupPreviewUrls,
    ],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        // 获取所有文件的尺寸信息
        const dimensionsMap: {
          [key: string]: { width: number; height: number };
        } = {};

        for (const file of acceptedFiles) {
          try {
            const dimensions = await getImageDimensions(file);
            dimensionsMap[file.name] = dimensions;
          } catch (error) {
            // 如果获取尺寸失败，使用默认值
            dimensionsMap[file.name] = { width: 0, height: 0 };
          }
        }

        setFileDimensions(dimensionsMap);

        // 重置用户选择
        setUserWantsCompress(false);
        setUserWantsCrop(false);
        // 清理预览URL
        cleanupPreviewUrls();
        setCompressionPreview({});
        setShowCompressionConfig(false);
        // 重置为用户配置或默认配置
        setUserCompressionConfig(
          compressionOptions || DEFAULT_COMPRESSION_OPTIONS,
        );

        if (acceptedFiles.length === 1) {
          // 单文件短确认
          const file = acceptedFiles[0];
          setUploadData({
            file,
            name: file.name,
            description: '',
            tags: [],
            targetFolder: resolveDefaultFolder(defaultFolder),
          });
          setIsMultiple(false);
          setShowForm(true);
          showInfo(`${translate('image.upload.selectedSingle')}: ${file.name}`);
        } else {
          // 多文件短确认
          setMultiUploadData({
            files: acceptedFiles,
            name: '',
            description: '',
            tags: [],
            targetFolder: resolveDefaultFolder(defaultFolder),
          });
          setIsMultiple(true);
          setShowForm(true);
          showInfo(
            translate('image.upload.selectedCount').replace(
              '{count}',
              String(acceptedFiles.length),
            ),
          );
        }
      }
    },
    [
      translate,
      getImageDimensions,
      defaultFolder,
      cleanupPreviewUrls,
      compressionOptions,
    ],
  );

  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) return;
    let cancelled = false;
    void onDrop(initialFiles).finally(() => {
      if (!cancelled) {
        onInitialFilesConsumed?.();
      }
    });
    return () => {
      cancelled = true;
    };
    // 仅在外部种子文件变化时预填；避免 onDrop 引用变化导致重复打开确认
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed files only
  }, [initialFiles]);

  const handleNativePick = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (!nativePickers) {
        return;
      }
      try {
        const files =
          source === 'camera'
            ? await nativePickers.pickFromCamera()
            : await nativePickers.pickFromGallery();
        for (const pick of files) {
          rememberCaptureMetadata(pick.file, pick.captureMetadata);
        }
        if (files.length > 0) {
          await onDrop(files.map(pick => pick.file));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        showInfo(`${translate('image.upload.nativePickFailed')}: ${message}`);
      }
    },
    [nativePickers, onDrop, translate, rememberCaptureMetadata],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'video/*': ['.mp4', '.webm', '.mov', '.mkv', '.avi'],
      'text/plain': ['.txt', '.md'],
      'application/json': ['.json'],
      'application/zip': ['.zip'],
    },
    multiple: true, // 始终允许多选，根据文件数量决定处理方式
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadData) {
      let finalFile = uploadData.file;
      const fileName = uploadData.name || uploadData.file.name;

      // 如果用户选择裁剪，先显示裁剪界面
      if (userWantsCrop && enableCrop) {
        setCropFile(finalFile);
        setCropFileIndex(-1);
        setShowCropModal(true);
        setShowForm(false);
        return;
      }

      // 如果用户选择压缩，进行压缩
      if (userWantsCompress && enableCompression) {
        const compressionToast = showLoading('正在压缩图片...');
        try {
          const compressed = await compressFileIfNeeded(finalFile, true);
          transferCaptureMetadata(finalFile, compressed);
          finalFile = compressed;
          updateLoadingToSuccess(compressionToast, '图片压缩完成');
        } catch (error) {
          updateLoadingToError(
            compressionToast,
            `压缩失败: ${error instanceof Error ? error.message : '未知错误'}`,
          );
        }
      }

      const dimensions =
        fileDimensions[finalFile.name] || fileDimensions[uploadData.file.name];
      const dimensionsText =
        dimensions && dimensions.width > 0 && dimensions.height > 0
          ? ` (${dimensions.width} × ${dimensions.height})`
          : '';

      const loadingToast = showLoading(
        `${translate('image.upload.uploadingSingle')} "${fileName}"...`,
      );
      try {
        // 确保传递完整的 uploadData，包括 tags
        const completeUploadData: ImageUploadData = {
          file: finalFile,
          name: uploadData.name || finalFile.name,
          description: uploadData.description || '',
          tags: uploadData.tags || [],
          targetFolder:
            uploadData.targetFolder || resolveDefaultFolder(defaultFolder),
          captureMetadata: getCaptureMetadata(finalFile),
        };
        await onUploadImage(completeUploadData);
        updateLoadingToSuccess(
          loadingToast,
          translate('image.upload.successToastSingle')
            .replace('{name}', fileName)
            .replace('{dims}', dimensionsText),
        );
        if (mountedRef.current) {
          setUploadData(null);
          setShowForm(false);
          setFileDimensions(prev => {
            const newDims = { ...prev };
            delete newDims[uploadData.file.name];
            if (finalFile.name !== uploadData.file.name) {
              delete newDims[finalFile.name];
            }
            return newDims;
          });
        }
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailed')}: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    }
  };

  const handleInputChange = (
    field: keyof WebImageUploadData,
    value: string | string[],
  ) => {
    if (uploadData) {
      setUploadData({ ...uploadData, [field]: value });
    }
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (multiUploadData) {
      // 如果用户选择裁剪，先处理第一张图片的裁剪
      if (userWantsCrop && enableCrop && multiUploadData.files.length > 0) {
        setCropFile(multiUploadData.files[0]);
        setCropFileIndex(0);
        setShowCropModal(true);
        setShowForm(false);
        return;
      }

      // 如果用户选择压缩，压缩所有文件
      let processedFiles = multiUploadData.files;
      if (userWantsCompress && enableCompression) {
        const compressionToast = showLoading(
          `正在压缩 ${multiUploadData.files.length} 张图片...`,
        );
        try {
          processedFiles = await Promise.all(
            multiUploadData.files.map(async file => {
              const compressed = await compressFileIfNeeded(file, true);
              transferCaptureMetadata(file, compressed);
              return compressed;
            }),
          );
          updateLoadingToSuccess(compressionToast, '图片压缩完成');
        } catch (error) {
          updateLoadingToError(
            compressionToast,
            `压缩失败: ${error instanceof Error ? error.message : '未知错误'}`,
          );
          processedFiles = multiUploadData.files;
        }
      }

      const loadingToast = showLoading(
        `${translate('image.upload.uploadingMultiple')} ${processedFiles.length} ${translate('image.upload.file')}...`,
      );
      try {
        // 确保传递完整的 multiUploadData，包括 tags
        const completeMultiUploadData: MultiImageUploadData = {
          files: processedFiles,
          name: multiUploadData.name || '',
          description: multiUploadData.description || '',
          tags: multiUploadData.tags || [],
          targetFolder:
            multiUploadData.targetFolder || resolveDefaultFolder(defaultFolder),
          captureMetadataList: buildCaptureMetadataList(processedFiles),
        };
        await onUploadMultipleImages(completeMultiUploadData);
        updateLoadingToSuccess(
          loadingToast,
          translate('image.upload.successToastMultiple').replace(
            '{count}',
            String(processedFiles.length),
          ),
        );
        if (mountedRef.current) {
          setMultiUploadData(null);
          setShowForm(false);
          setIsMultiple(false);
        }
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailedMultiple')}: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    }
  };

  const handleMultiInputChange = (
    field: keyof MultiImageUploadData,
    value: string | string[],
  ) => {
    if (multiUploadData) {
      setMultiUploadData({ ...multiUploadData, [field]: value });
    }
  };

  const handleCancel = useCallback(() => {
    showInfo(translate('image.upload.cancelled'));
    // 清理预览URL
    cleanupPreviewUrls();
    setUploadData(null);
    setMultiUploadData(null);
    setShowForm(false);
    setIsMultiple(false);
    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
    setCompressionPreview({});
  }, [translate, cleanupPreviewUrls]);

  // 处理裁剪完成
  const handleCropComplete = async (croppedFile: File) => {
    if (cropFile) {
      transferCaptureMetadata(cropFile, croppedFile);
    }
    // 如果用户选择了压缩，压缩裁剪后的文件
    let finalFile = croppedFile;
    if (userWantsCompress && enableCompression) {
      try {
        const compressionToast = showLoading('正在压缩裁剪后的图片...');
        const compressed = await compressFileIfNeeded(croppedFile, true);
        transferCaptureMetadata(croppedFile, compressed);
        finalFile = compressed;
        updateLoadingToSuccess(compressionToast, '压缩完成');
      } catch (error) {
        console.warn('裁剪后压缩失败，使用原文件:', error);
        finalFile = croppedFile;
      }
    }

    if (cropFileIndex === -1) {
      // 单张图片裁剪完成，直接上传
      const fileName = uploadData?.name || finalFile.name;
      const dimensions =
        fileDimensions[finalFile.name] ||
        fileDimensions[uploadData?.file.name || ''];
      const dimensionsText =
        dimensions && dimensions.width > 0 && dimensions.height > 0
          ? ` (${dimensions.width} × ${dimensions.height})`
          : '';

      const loadingToast = showLoading(
        `${translate('image.upload.uploadingSingle')} "${fileName}"...`,
      );
      try {
        const completeUploadData: ImageUploadData = {
          file: finalFile,
          name: uploadData?.name || finalFile.name,
          description: uploadData?.description || '',
          tags: uploadData?.tags || [],
          targetFolder:
            uploadData?.targetFolder || resolveDefaultFolder(defaultFolder),
          captureMetadata: getCaptureMetadata(finalFile),
        };
        await onUploadImage(completeUploadData);
        updateLoadingToSuccess(
          loadingToast,
          translate('image.upload.successToastSingle')
            .replace('{name}', fileName)
            .replace('{dims}', dimensionsText),
        );
        if (mountedRef.current) {
          setUploadData(null);
          setShowForm(false);
          setFileDimensions(prev => {
            const newDims = { ...prev };
            if (uploadData?.file.name) delete newDims[uploadData.file.name];
            if (finalFile.name !== uploadData?.file.name) {
              delete newDims[finalFile.name];
            }
            return newDims;
          });
        }
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailed')}: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    } else {
      // 多张图片中的第一张裁剪完成，继续处理剩余图片
      if (multiUploadData) {
        const newFiles = [...multiUploadData.files];
        if (cropFile) {
          transferCaptureMetadata(cropFile, finalFile);
        }
        newFiles[cropFileIndex] = finalFile;

        // 如果还有其他图片需要裁剪，继续裁剪下一张
        if (userWantsCrop && enableCrop) {
          const nextCropIndex = newFiles.findIndex(
            (_, idx) => idx > cropFileIndex,
          );
          if (nextCropIndex !== -1) {
            setCropFile(newFiles[nextCropIndex]);
            setCropFileIndex(nextCropIndex);
            setMultiUploadData({
              ...multiUploadData,
              files: newFiles,
            });
            // 继续裁剪下一张
            return;
          }
        }

        // 所有需要裁剪的图片都处理完了，如果选择了压缩，压缩剩余图片
        let processedFiles = newFiles;
        if (userWantsCompress && enableCompression) {
          const compressionToast = showLoading(
            `正在压缩 ${newFiles.length} 张图片...`,
          );
          try {
            processedFiles = await Promise.all(
              newFiles.map(async file => {
                const compressed = await compressFileIfNeeded(file, true);
                transferCaptureMetadata(file, compressed);
                return compressed;
              }),
            );
            updateLoadingToSuccess(compressionToast, '图片压缩完成');
          } catch (error) {
            updateLoadingToError(
              compressionToast,
              `压缩失败: ${error instanceof Error ? error.message : '未知错误'}`,
            );
            processedFiles = newFiles;
          }
        }

        // 上传所有图片
        const loadingToast = showLoading(
          `${translate('image.upload.uploadingMultiple')} ${processedFiles.length} 张图片...`,
        );
        try {
          const completeMultiUploadData: MultiImageUploadData = {
            files: processedFiles,
            name: multiUploadData.name || '',
            description: multiUploadData.description || '',
            tags: multiUploadData.tags || [],
            targetFolder:
              multiUploadData.targetFolder ||
              resolveDefaultFolder(defaultFolder),
            captureMetadataList: buildCaptureMetadataList(processedFiles),
          };
          await onUploadMultipleImages(completeMultiUploadData);
          updateLoadingToSuccess(
            loadingToast,
            translate('image.upload.successToastMultiple').replace(
              '{count}',
              String(processedFiles.length),
            ),
          );
          if (mountedRef.current) {
            setMultiUploadData(null);
            setShowForm(false);
            setIsMultiple(false);
          }
        } catch (error) {
          updateLoadingToError(
            loadingToast,
            `${translate('image.upload.uploadFailedMultiple')}: ${error instanceof Error ? error.message : '未知错误'}`,
          );
        }
      }
    }

    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
  };

  // 处理跳过裁剪
  const handleSkipCrop = async (originalFile: File) => {
    // 如果用户选择了压缩，压缩文件
    let finalFile = originalFile;
    if (userWantsCompress && enableCompression) {
      try {
        const compressionToast = showLoading('正在压缩图片...');
        const compressed = await compressFileIfNeeded(originalFile, true);
        transferCaptureMetadata(originalFile, compressed);
        finalFile = compressed;
        updateLoadingToSuccess(compressionToast, '压缩完成');
      } catch (error) {
        console.warn('压缩失败，使用原文件:', error);
        finalFile = originalFile;
      }
    }

    if (cropFileIndex === -1) {
      // 单张图片跳过裁剪，直接上传
      const fileName = uploadData?.name || finalFile.name;
      const dimensions =
        fileDimensions[finalFile.name] ||
        fileDimensions[uploadData?.file.name || ''];
      const dimensionsText =
        dimensions && dimensions.width > 0 && dimensions.height > 0
          ? ` (${dimensions.width} × ${dimensions.height})`
          : '';

      const loadingToast = showLoading(
        `${translate('image.upload.uploadingSingle')} "${fileName}"...`,
      );
      try {
        const completeUploadData: ImageUploadData = {
          file: finalFile,
          name: uploadData?.name || finalFile.name,
          description: uploadData?.description || '',
          tags: uploadData?.tags || [],
          targetFolder:
            uploadData?.targetFolder || resolveDefaultFolder(defaultFolder),
          captureMetadata: getCaptureMetadata(finalFile),
        };
        await onUploadImage(completeUploadData);
        updateLoadingToSuccess(
          loadingToast,
          translate('image.upload.successToastSingle')
            .replace('{name}', fileName)
            .replace('{dims}', dimensionsText),
        );
        if (mountedRef.current) {
          setUploadData(null);
          setShowForm(false);
          setFileDimensions(prev => {
            const newDims = { ...prev };
            if (uploadData?.file.name) delete newDims[uploadData.file.name];
            if (finalFile.name !== uploadData?.file.name) {
              delete newDims[finalFile.name];
            }
            return newDims;
          });
        }
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailed')}: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    } else {
      // 多张图片中的第一张跳过裁剪，继续处理
      if (multiUploadData) {
        const newFiles = [...multiUploadData.files];
        if (cropFile) {
          transferCaptureMetadata(cropFile, finalFile);
        }
        newFiles[cropFileIndex] = finalFile;

        // 如果还有其他图片需要裁剪，继续裁剪下一张
        const nextCropIndex = newFiles.findIndex(
          (_, idx) => idx > cropFileIndex && userWantsCrop,
        );
        if (nextCropIndex !== -1 && userWantsCrop && enableCrop) {
          setCropFile(newFiles[nextCropIndex]);
          setCropFileIndex(nextCropIndex);
          setMultiUploadData({
            ...multiUploadData,
            files: newFiles,
          });
          return;
        }

        // 所有需要裁剪的图片都处理完了，如果选择了压缩，压缩剩余图片
        let processedFiles = newFiles;
        if (userWantsCompress && enableCompression) {
          const compressionToast = showLoading(
            `正在压缩 ${newFiles.length} 张图片...`,
          );
          try {
            processedFiles = await Promise.all(
              newFiles.map(async file => {
                const compressed = await compressFileIfNeeded(file, true);
                transferCaptureMetadata(file, compressed);
                return compressed;
              }),
            );
            updateLoadingToSuccess(compressionToast, '图片压缩完成');
          } catch (error) {
            updateLoadingToError(
              compressionToast,
              `压缩失败: ${error instanceof Error ? error.message : '未知错误'}`,
            );
            processedFiles = newFiles;
          }
        }

        // 上传所有图片
        const loadingToast = showLoading(
          `${translate('image.upload.uploadingMultiple')} ${processedFiles.length} 张图片...`,
        );
        try {
          const completeMultiUploadData: MultiImageUploadData = {
            files: processedFiles,
            name: multiUploadData.name || '',
            description: multiUploadData.description || '',
            tags: multiUploadData.tags || [],
            targetFolder:
              multiUploadData.targetFolder ||
              resolveDefaultFolder(defaultFolder),
            captureMetadataList: buildCaptureMetadataList(processedFiles),
          };
          await onUploadMultipleImages(completeMultiUploadData);
          updateLoadingToSuccess(
            loadingToast,
            translate('image.upload.successToastMultiple').replace(
              '{count}',
              String(processedFiles.length),
            ),
          );
          if (mountedRef.current) {
            setMultiUploadData(null);
            setShowForm(false);
            setIsMultiple(false);
          }
        } catch (error) {
          updateLoadingToError(
            loadingToast,
            `${translate('image.upload.uploadFailedMultiple')}: ${error instanceof Error ? error.message : '未知错误'}`,
          );
        }
      }
    }

    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
  };

  // 处理裁剪取消
  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);

    // 如果是多张图片，重置多张图片上传数据
    if (multiUploadData) {
      setMultiUploadData(null);
      setIsMultiple(false);
    }
  };

  // 批量上传进度显示 - 集成到主弹窗内
  const showProgress = batchUploadProgress && !showForm;

  // 统一上传表单 - 直接显示在主弹窗内
  const showFormContent = showForm && (uploadData || multiUploadData);
  const isMultipleUpload = showFormContent && isMultiple && multiUploadData;
  const files = showFormContent
    ? isMultipleUpload
      ? multiUploadData!.files
      : [uploadData!.file]
    : [];
  const currentData = showFormContent
    ? isMultipleUpload
      ? multiUploadData
      : uploadData
    : null;
  const folderValue =
    currentData?.targetFolder || resolveDefaultFolder(defaultFolder);
  const previewUrls = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const file of files) {
      if (isPreviewableMedia(file)) {
        map.set(file.name + file.size, URL.createObjectURL(file));
      }
    }
    return map;
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const setTargetFolder = (value: string) => {
    if (isMultipleUpload) {
      handleMultiInputChange('targetFolder', value);
    } else if (uploadData) {
      setUploadData({ ...uploadData, targetFolder: value });
    }
  };

  const handleCompressionConfigChange = useCallback(
    (config: ImageCompressionOptions) => {
      setUserCompressionConfig(config);
      if (userWantsCompress) {
        const previewFiles = uploadData
          ? [uploadData.file]
          : multiUploadData
            ? multiUploadData.files
            : [];
        if (previewFiles.length > 0) {
          void calculateCompressionPreview(previewFiles);
        }
      }
    },
    [
      userWantsCompress,
      uploadData,
      multiUploadData,
      calculateCompressionPreview,
    ],
  );

  const handleFormFieldChange = (
    field: keyof WebImageUploadData | keyof MultiImageUploadData,
    value: string | string[],
  ) => {
    if (isMultipleUpload) {
      handleMultiInputChange(field as keyof MultiImageUploadData, value);
      return;
    }
    handleInputChange(field as keyof WebImageUploadData, value);
  };

  // 如果显示表单，直接返回表单内容（不显示拖拽区域）
  if (showFormContent && currentData) {
    return (
      <ImageUploadConfirmForm
        files={files}
        isMultipleUpload={Boolean(isMultipleUpload)}
        currentData={currentData}
        folderValue={folderValue}
        fileDimensions={fileDimensions}
        previewUrls={previewUrls}
        enableCrop={enableCrop}
        enableCompression={enableCompression}
        userWantsCrop={userWantsCrop}
        userWantsCompress={userWantsCompress}
        calculatingCompression={calculatingCompression}
        showCompressionConfig={showCompressionConfig}
        userCompressionConfig={userCompressionConfig}
        compressionPreview={compressionPreview}
        onCropToggle={setUserWantsCrop}
        onCompressionToggle={handleCompressionToggle}
        onToggleCompressionConfig={() =>
          setShowCompressionConfig(open => !open)
        }
        onCompressionConfigChange={handleCompressionConfigChange}
        loading={loading}
        translate={translate}
        tagInputRef={tagInputRef}
        onSubmit={isMultipleUpload ? handleMultiSubmit : handleSubmit}
        onCancel={handleCancel}
        onTargetFolderChange={setTargetFolder}
        onFieldChange={handleFormFieldChange}
      />
    );
  }

  return (
    <>
      {/* 裁剪模态框 */}
      {showCropModal && cropFile && (
        <ImageCropModal
          src={URL.createObjectURL(cropFile)}
          fileName={cropFile.name}
          originalFile={cropFile}
          onCropComplete={handleCropComplete}
          onSkipCrop={handleSkipCrop}
          onCancel={handleCropCancel}
          t={translate}
          aspectRatio={cropOptions?.aspectRatio}
          minWidth={cropOptions?.minWidth}
          minHeight={cropOptions?.minHeight}
          maxWidth={cropOptions?.maxWidth}
          maxHeight={cropOptions?.maxHeight}
        />
      )}

      {showProgress && batchUploadProgress ? (
        <ImageUploadBatchProgress
          batchUploadProgress={batchUploadProgress}
          translate={translate}
          fileNameAt={index => multiUploadData?.files[index]?.name}
        />
      ) : (
        <ImageUploadDropzone
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          enableCrop={enableCrop}
          nativePickers={nativePickers}
          translate={translate}
          onNativePick={source => {
            void handleNativePick(source);
          }}
        />
      )}
    </>
  );
};

export default ImageUpload;

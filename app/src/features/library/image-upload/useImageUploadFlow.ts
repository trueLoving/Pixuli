import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type {
  BatchUploadProgress,
  ImageCompressionOptions,
  ImageCropOptions,
  ImageUploadData,
  MultiImageUploadData,
  WebImageUploadData,
} from '@pixuli/core/types';
import {
  showInfo,
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import type { NativeImagePickers } from './nativePickers';
import {
  getImageDimensions,
  isPreviewableMedia,
  resolveDefaultFolder,
} from './imageUploadUtils';
import { useImageUploadCapture } from './useImageUploadCapture';
import { useImageUploadCompression } from './useImageUploadCompression';

export interface UseImageUploadFlowOptions {
  onUploadImage: (data: ImageUploadData) => Promise<unknown>;
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<unknown>;
  loading: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  translate: (key: string) => string;
  enableCrop?: boolean;
  cropOptions?: ImageCropOptions;
  enableCompression?: boolean;
  compressionOptions?: ImageCompressionOptions;
  nativePickers?: NativeImagePickers;
  defaultFolder?: string;
  initialFiles?: File[];
  onInitialFilesConsumed?: () => void;
}

export function useImageUploadFlow({
  onUploadImage,
  onUploadMultipleImages,
  loading,
  batchUploadProgress,
  translate,
  enableCrop = false,
  cropOptions,
  enableCompression = false,
  compressionOptions,
  nativePickers,
  defaultFolder,
  initialFiles,
  onInitialFilesConsumed,
}: UseImageUploadFlowOptions) {
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
  const [fileDimensions, setFileDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [userWantsCrop, setUserWantsCrop] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const {
    rememberCaptureMetadata,
    transferCaptureMetadata,
    getCaptureMetadata,
    buildCaptureMetadataList,
  } = useImageUploadCapture();

  const {
    userWantsCompress,
    compressionPreview,
    calculatingCompression,
    showCompressionConfig,
    userCompressionConfig,
    setShowCompressionConfig,
    compressFileIfNeeded,
    handleCompressionToggle: toggleCompressionPreview,
    handleCompressionConfigChange: applyCompressionConfig,
    resetCompressionState,
  } = useImageUploadCompression({
    enableCompression,
    compressionOptions,
    fileDimensions,
  });

  const getPreviewFiles = useCallback((): File[] => {
    if (uploadData) return [uploadData.file];
    if (multiUploadData) return multiUploadData.files;
    return [];
  }, [uploadData, multiUploadData]);

  const handleCompressionToggle = useCallback(
    (checked: boolean) => {
      toggleCompressionPreview(checked, getPreviewFiles());
    },
    [toggleCompressionPreview, getPreviewFiles],
  );

  const handleCompressionConfigChange = useCallback(
    (config: ImageCompressionOptions) => {
      applyCompressionConfig(config, getPreviewFiles());
    },
    [applyCompressionConfig, getPreviewFiles],
  );

  const clearSingleDimensions = useCallback(
    (originalName: string, finalName: string) => {
      setFileDimensions(prev => {
        const next = { ...prev };
        delete next[originalName];
        if (finalName !== originalName) delete next[finalName];
        return next;
      });
    },
    [],
  );

  const dimensionsTextFor = useCallback(
    (file: File, fallbackName?: string) => {
      const dimensions =
        fileDimensions[file.name] ||
        (fallbackName ? fileDimensions[fallbackName] : undefined);
      if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
        return ` (${dimensions.width} × ${dimensions.height})`;
      }
      return '';
    },
    [fileDimensions],
  );

  const performSingleUpload = useCallback(
    async (finalFile: File, meta: WebImageUploadData) => {
      const fileName = meta.name || finalFile.name;
      const loadingToast = showLoading(
        `${translate('image.upload.uploadingSingle')} "${fileName}"...`,
      );
      try {
        await onUploadImage({
          file: finalFile,
          name: meta.name || finalFile.name,
          description: meta.description || '',
          tags: meta.tags || [],
          targetFolder:
            meta.targetFolder || resolveDefaultFolder(defaultFolder),
          captureMetadata: getCaptureMetadata(finalFile),
        });
        updateLoadingToSuccess(
          loadingToast,
          translate('image.upload.successToastSingle')
            .replace('{name}', fileName)
            .replace('{dims}', dimensionsTextFor(finalFile, meta.file.name)),
        );
        if (mountedRef.current) {
          setUploadData(null);
          setShowForm(false);
          clearSingleDimensions(meta.file.name, finalFile.name);
        }
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailed')}: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    },
    [
      onUploadImage,
      translate,
      defaultFolder,
      getCaptureMetadata,
      dimensionsTextFor,
      clearSingleDimensions,
    ],
  );

  const performMultiUpload = useCallback(
    async (processedFiles: File[], meta: MultiImageUploadData) => {
      const loadingToast = showLoading(
        `${translate('image.upload.uploadingMultiple')} ${processedFiles.length} ${translate('image.upload.file')}...`,
      );
      try {
        await onUploadMultipleImages({
          files: processedFiles,
          name: meta.name || '',
          description: meta.description || '',
          tags: meta.tags || [],
          targetFolder:
            meta.targetFolder || resolveDefaultFolder(defaultFolder),
          captureMetadataList: buildCaptureMetadataList(processedFiles),
        });
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
    },
    [
      onUploadMultipleImages,
      translate,
      defaultFolder,
      buildCaptureMetadataList,
    ],
  );

  const compressWithToast = useCallback(
    async (files: File[], message: string): Promise<File[]> => {
      const compressionToast = showLoading(message);
      try {
        const processed = await Promise.all(
          files.map(async file => {
            const compressed = await compressFileIfNeeded(file, true);
            transferCaptureMetadata(file, compressed);
            return compressed;
          }),
        );
        updateLoadingToSuccess(compressionToast, '图片压缩完成');
        return processed;
      } catch (error) {
        updateLoadingToError(
          compressionToast,
          `压缩失败: ${error instanceof Error ? error.message : '未知错误'}`,
        );
        return files;
      }
    },
    [compressFileIfNeeded, transferCaptureMetadata],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const dimensionsMap: Record<string, { width: number; height: number }> =
        {};
      for (const file of acceptedFiles) {
        try {
          dimensionsMap[file.name] = await getImageDimensions(file);
        } catch {
          dimensionsMap[file.name] = { width: 0, height: 0 };
        }
      }

      setFileDimensions(dimensionsMap);
      resetCompressionState();
      setUserWantsCrop(false);

      if (acceptedFiles.length === 1) {
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
    },
    [translate, defaultFolder, resetCompressionState],
  );

  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) return;
    let cancelled = false;
    void onDrop(initialFiles).finally(() => {
      if (!cancelled) onInitialFilesConsumed?.();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed files only
  }, [initialFiles]);

  const handleNativePick = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (!nativePickers) return;
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
    multiple: true,
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData) return;

    let finalFile = uploadData.file;
    if (userWantsCrop && enableCrop) {
      setCropFile(finalFile);
      setCropFileIndex(-1);
      setShowCropModal(true);
      setShowForm(false);
      return;
    }

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

    await performSingleUpload(finalFile, uploadData);
  };

  const handleInputChange = (
    field: keyof WebImageUploadData,
    value: string | string[],
  ) => {
    if (uploadData) setUploadData({ ...uploadData, [field]: value });
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiUploadData) return;

    if (userWantsCrop && enableCrop && multiUploadData.files.length > 0) {
      setCropFile(multiUploadData.files[0]);
      setCropFileIndex(0);
      setShowCropModal(true);
      setShowForm(false);
      return;
    }

    let processedFiles = multiUploadData.files;
    if (userWantsCompress && enableCompression) {
      processedFiles = await compressWithToast(
        multiUploadData.files,
        `正在压缩 ${multiUploadData.files.length} 张图片...`,
      );
    }

    await performMultiUpload(processedFiles, multiUploadData);
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
    resetCompressionState();
    setUploadData(null);
    setMultiUploadData(null);
    setShowForm(false);
    setIsMultiple(false);
    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
  }, [translate, resetCompressionState]);

  const closeCropModal = useCallback(() => {
    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
  }, []);

  const handleCropComplete = async (croppedFile: File) => {
    if (cropFile) transferCaptureMetadata(cropFile, croppedFile);

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
      if (uploadData) {
        await performSingleUpload(finalFile, uploadData);
      }
    } else if (multiUploadData) {
      const newFiles = [...multiUploadData.files];
      if (cropFile) transferCaptureMetadata(cropFile, finalFile);
      newFiles[cropFileIndex] = finalFile;

      if (userWantsCrop && enableCrop) {
        const nextCropIndex = newFiles.findIndex(
          (_, idx) => idx > cropFileIndex,
        );
        if (nextCropIndex !== -1) {
          setCropFile(newFiles[nextCropIndex]);
          setCropFileIndex(nextCropIndex);
          setMultiUploadData({ ...multiUploadData, files: newFiles });
          return;
        }
      }

      let processedFiles = newFiles;
      if (userWantsCompress && enableCompression) {
        processedFiles = await compressWithToast(
          newFiles,
          `正在压缩 ${newFiles.length} 张图片...`,
        );
      }
      await performMultiUpload(processedFiles, multiUploadData);
    }

    closeCropModal();
  };

  const handleSkipCrop = async (originalFile: File) => {
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
      if (uploadData) await performSingleUpload(finalFile, uploadData);
    } else if (multiUploadData) {
      const newFiles = [...multiUploadData.files];
      if (cropFile) transferCaptureMetadata(cropFile, finalFile);
      newFiles[cropFileIndex] = finalFile;

      const nextCropIndex = newFiles.findIndex(
        (_, idx) => idx > cropFileIndex && userWantsCrop,
      );
      if (nextCropIndex !== -1 && userWantsCrop && enableCrop) {
        setCropFile(newFiles[nextCropIndex]);
        setCropFileIndex(nextCropIndex);
        setMultiUploadData({ ...multiUploadData, files: newFiles });
        return;
      }

      let processedFiles = newFiles;
      if (userWantsCompress && enableCompression) {
        processedFiles = await compressWithToast(
          newFiles,
          `正在压缩 ${newFiles.length} 张图片...`,
        );
      }
      await performMultiUpload(processedFiles, multiUploadData);
    }

    closeCropModal();
  };

  const handleCropCancel = () => {
    closeCropModal();
    if (multiUploadData) {
      setMultiUploadData(null);
      setIsMultiple(false);
    }
  };

  const showProgress = Boolean(batchUploadProgress && !showForm);
  const showFormContent = showForm && (uploadData || multiUploadData);
  const isMultipleUpload = Boolean(
    showFormContent && isMultiple && multiUploadData,
  );
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

  const previewUrls = useMemo(() => {
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

  return {
    loading,
    cropOptions,
    enableCrop,
    enableCompression,
    nativePickers,
    translate,
    batchUploadProgress,
    multiUploadData,
    showProgress,
    showFormContent,
    showCropModal,
    cropFile,
    isMultipleUpload,
    files,
    currentData,
    folderValue,
    fileDimensions,
    previewUrls,
    userWantsCrop,
    userWantsCompress,
    calculatingCompression,
    showCompressionConfig,
    userCompressionConfig,
    compressionPreview,
    tagInputRef,
    getRootProps,
    getInputProps,
    isDragActive,
    setUserWantsCrop,
    handleCompressionToggle,
    setShowCompressionConfig,
    handleCompressionConfigChange,
    handleSubmit,
    handleMultiSubmit,
    handleCancel,
    handleCropComplete,
    handleSkipCrop,
    handleCropCancel,
    handleNativePick,
    setTargetFolder,
    handleFormFieldChange,
  };
}

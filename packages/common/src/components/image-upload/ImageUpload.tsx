import {
  AlertCircle,
  CheckCircle,
  Crop,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defaultTranslate } from '../../locales';
import type {
  BatchUploadProgress,
  ImageCompressionOptions,
  ImageCropOptions,
  ImageUploadData,
  MultiImageUploadData,
} from '../../types/image';
import {
  showInfo,
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '../../utils/toast';
import { compressImage } from '../../utils/imageUtils';
import ImageCropModal from './image-crop/ImageCropModal';
import './ImageUpload.css';

interface ImageUploadProps {
  onUploadImage: (data: ImageUploadData) => Promise<void>;
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<void>;
  loading: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  t?: (key: string) => string;
  enableCrop?: boolean;
  cropOptions?: ImageCropOptions;
  enableCompression?: boolean;
  compressionOptions?: ImageCompressionOptions;
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
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;
  const [uploadData, setUploadData] = useState<ImageUploadData | null>(null);
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
  const [compressionPreview, setCompressionPreview] = useState<{
    [key: string]: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
      originalDimensions: { width: number; height: number };
      compressedDimensions: { width: number; height: number };
      originalPreviewUrl?: string;
      compressedPreviewUrl?: string;
    };
  }>({});
  const [calculatingCompression, setCalculatingCompression] = useState(false);
  const [showCompressionConfig, setShowCompressionConfig] = useState(false);
  const [userCompressionConfig, setUserCompressionConfig] =
    useState<ImageCompressionOptions>(
      compressionOptions || {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        maintainAspectRatio: true,
        outputFormat: 'image/jpeg',
      },
    );
  const tagInputRef = useRef<HTMLInputElement>(null);

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

  // 获取图片尺寸的辅助函数
  const getImageDimensions = useCallback(
    (file: File): Promise<{ width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        const timeout = setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('获取图片尺寸超时'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          resolve({
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
          });
        };

        img.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          reject(new Error('图片加载失败'));
        };

        img.src = objectUrl;
      });
    },
    [],
  );

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
          compressionOptions || {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080,
            maintainAspectRatio: true,
            outputFormat: 'image/jpeg',
          },
        );

        if (acceptedFiles.length === 1) {
          // 单张图片上传
          const file = acceptedFiles[0];
          setUploadData({
            file,
            name: file.name,
            description: '',
            tags: [],
          });
          setIsMultiple(false);
          setShowForm(true);
          showInfo(`${translate('image.upload.selectedSingle')}: ${file.name}`);
        } else {
          // 多张图片上传
          setMultiUploadData({
            files: acceptedFiles,
            name: '',
            description: '',
            tags: [],
          });
          setIsMultiple(true);
          setShowForm(true);
          showInfo(
            `${translate('image.upload.selectedMultiple')} ${acceptedFiles.length} 张图片`,
          );
        }
      }
    },
    [translate, getImageDimensions],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.svg'],
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
          finalFile = await compressFileIfNeeded(finalFile, true);
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
        };
        await onUploadImage(completeUploadData);
        updateLoadingToSuccess(
          loadingToast,
          `${translate('image.upload.uploadSuccessSingle')} "${fileName}" 上传成功${dimensionsText}！`,
        );
        setUploadData(null);
        setShowForm(false);
        // 清理尺寸信息
        setFileDimensions(prev => {
          const newDims = { ...prev };
          delete newDims[uploadData.file.name];
          if (finalFile.name !== uploadData.file.name) {
            delete newDims[finalFile.name];
          }
          return newDims;
        });
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailed')}: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    }
  };

  const handleInputChange = (
    field: keyof ImageUploadData,
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
            multiUploadData.files.map(file => compressFileIfNeeded(file, true)),
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
        `${translate('image.upload.uploadingMultiple')} ${processedFiles.length} 张图片...`,
      );
      try {
        // 确保传递完整的 multiUploadData，包括 tags
        const completeMultiUploadData: MultiImageUploadData = {
          files: processedFiles,
          name: multiUploadData.name || '',
          description: multiUploadData.description || '',
          tags: multiUploadData.tags || [],
        };
        await onUploadMultipleImages(completeMultiUploadData);
        updateLoadingToSuccess(
          loadingToast,
          `${translate('image.upload.uploadSuccessMultiple')} ${processedFiles.length} 张图片！`,
        );
        setMultiUploadData(null);
        setShowForm(false);
        setIsMultiple(false);
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
    // 如果用户选择了压缩，压缩裁剪后的文件
    let finalFile = croppedFile;
    if (userWantsCompress && enableCompression) {
      try {
        const compressionToast = showLoading('正在压缩裁剪后的图片...');
        finalFile = await compressFileIfNeeded(croppedFile, true);
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
        };
        await onUploadImage(completeUploadData);
        updateLoadingToSuccess(
          loadingToast,
          `${translate('image.upload.uploadSuccessSingle')} "${fileName}" 上传成功${dimensionsText}！`,
        );
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
              newFiles.map(file => compressFileIfNeeded(file, true)),
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
          };
          await onUploadMultipleImages(completeMultiUploadData);
          updateLoadingToSuccess(
            loadingToast,
            `${translate('image.upload.uploadSuccessMultiple')} ${processedFiles.length} 张图片！`,
          );
          setMultiUploadData(null);
          setShowForm(false);
          setIsMultiple(false);
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
        finalFile = await compressFileIfNeeded(originalFile, true);
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
        };
        await onUploadImage(completeUploadData);
        updateLoadingToSuccess(
          loadingToast,
          `${translate('image.upload.uploadSuccessSingle')} "${fileName}" 上传成功${dimensionsText}！`,
        );
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
              newFiles.map(file => compressFileIfNeeded(file, true)),
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
          };
          await onUploadMultipleImages(completeMultiUploadData);
          updateLoadingToSuccess(
            loadingToast,
            `${translate('image.upload.uploadSuccessMultiple')} ${processedFiles.length} 张图片！`,
          );
          setMultiUploadData(null);
          setShowForm(false);
          setIsMultiple(false);
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

  // 如果显示表单，直接返回表单内容（不显示拖拽区域）
  if (showFormContent && currentData) {
    return (
      <div className="image-upload-form-container">
        <form
          onSubmit={isMultipleUpload ? handleMultiSubmit : handleSubmit}
          className="image-upload-form"
        >
          {/* 文件列表 */}
          <div className="image-upload-file-list">
            {files.map((file, index) => {
              const dimensions = fileDimensions[file.name];
              const dimensionsText =
                dimensions && dimensions.width > 0 && dimensions.height > 0
                  ? `${dimensions.width} × ${dimensions.height}`
                  : null;
              return (
                <div key={index} className="image-upload-file-item">
                  <ImageIcon className="image-upload-file-icon" />
                  <div className="image-upload-file-info">
                    <p className="image-upload-file-name">{file.name}</p>
                    <div className="image-upload-file-meta">
                      <p className="image-upload-file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {dimensionsText && (
                        <p className="image-upload-file-dimensions">
                          {dimensionsText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 压缩和裁剪选项 */}
          {(enableCompression || enableCrop) && (
            <div className="image-upload-form-group">
              <label className="image-upload-form-label">处理选项</label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {enableCrop && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={userWantsCrop}
                      onChange={e => setUserWantsCrop(e.target.checked)}
                      style={{
                        width: '1rem',
                        height: '1rem',
                        cursor: 'pointer',
                      }}
                    />
                    <span>裁剪图片</span>
                  </label>
                )}
                {enableCompression && (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          flex: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={userWantsCompress}
                          onChange={e =>
                            handleCompressionToggle(e.target.checked)
                          }
                          style={{
                            width: '1rem',
                            height: '1rem',
                            cursor: 'pointer',
                          }}
                        />
                        <span>压缩图片</span>
                        {calculatingCompression && (
                          <Loader2
                            style={{
                              width: '0.875rem',
                              height: '0.875rem',
                              animation: 'spin 1s linear infinite',
                            }}
                          />
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowCompressionConfig(!showCompressionConfig)
                        }
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          color: '#0369a1',
                          backgroundColor: 'transparent',
                          border: '1px solid #bae6fd',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                        }}
                      >
                        {showCompressionConfig ? '收起配置' : '配置'}
                      </button>
                    </div>
                    {/* 压缩配置面板 */}
                    {showCompressionConfig && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          {/* 质量设置 */}
                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.25rem',
                                fontWeight: 500,
                                color: '#374151',
                              }}
                            >
                              压缩质量:{' '}
                              {Math.round(
                                (userCompressionConfig.quality || 0.8) * 100,
                              )}
                              %
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={userCompressionConfig.quality || 0.8}
                              onChange={e => {
                                const newConfig = {
                                  ...userCompressionConfig,
                                  quality: parseFloat(e.target.value),
                                };
                                setUserCompressionConfig(newConfig);
                                // 如果已选择压缩，重新计算预览
                                if (userWantsCompress) {
                                  const files = uploadData
                                    ? [uploadData.file]
                                    : multiUploadData
                                      ? multiUploadData.files
                                      : [];
                                  if (files.length > 0) {
                                    calculateCompressionPreview(files);
                                  }
                                }
                              }}
                              style={{ width: '100%' }}
                            />
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.625rem',
                                color: '#6b7280',
                                marginTop: '0.125rem',
                              }}
                            >
                              <span>低质量 (10%)</span>
                              <span>高质量 (100%)</span>
                            </div>
                          </div>

                          {/* 最大尺寸设置 */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  display: 'block',
                                  marginBottom: '0.25rem',
                                  fontWeight: 500,
                                  color: '#374151',
                                }}
                              >
                                最大宽度 (px)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={userCompressionConfig.maxWidth || ''}
                                onChange={e => {
                                  const newConfig = {
                                    ...userCompressionConfig,
                                    maxWidth: e.target.value
                                      ? parseInt(e.target.value, 10)
                                      : undefined,
                                  };
                                  setUserCompressionConfig(newConfig);
                                  if (userWantsCompress) {
                                    const files = uploadData
                                      ? [uploadData.file]
                                      : multiUploadData
                                        ? multiUploadData.files
                                        : [];
                                    if (files.length > 0) {
                                      calculateCompressionPreview(files);
                                    }
                                  }
                                }}
                                placeholder="不限制"
                                style={{
                                  width: '100%',
                                  padding: '0.375rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                }}
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  display: 'block',
                                  marginBottom: '0.25rem',
                                  fontWeight: 500,
                                  color: '#374151',
                                }}
                              >
                                最大高度 (px)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={userCompressionConfig.maxHeight || ''}
                                onChange={e => {
                                  const newConfig = {
                                    ...userCompressionConfig,
                                    maxHeight: e.target.value
                                      ? parseInt(e.target.value, 10)
                                      : undefined,
                                  };
                                  setUserCompressionConfig(newConfig);
                                  if (userWantsCompress) {
                                    const files = uploadData
                                      ? [uploadData.file]
                                      : multiUploadData
                                        ? multiUploadData.files
                                        : [];
                                    if (files.length > 0) {
                                      calculateCompressionPreview(files);
                                    }
                                  }
                                }}
                                placeholder="不限制"
                                style={{
                                  width: '100%',
                                  padding: '0.375rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                }}
                              />
                            </div>
                          </div>

                          {/* 输出格式 */}
                          <div>
                            <label
                              style={{
                                display: 'block',
                                marginBottom: '0.25rem',
                                fontWeight: 500,
                                color: '#374151',
                              }}
                            >
                              输出格式
                            </label>
                            <select
                              value={
                                userCompressionConfig.outputFormat ||
                                'image/jpeg'
                              }
                              onChange={e => {
                                const newConfig = {
                                  ...userCompressionConfig,
                                  outputFormat: e.target.value as
                                    | 'image/jpeg'
                                    | 'image/png'
                                    | 'image/webp',
                                };
                                setUserCompressionConfig(newConfig);
                                if (userWantsCompress) {
                                  const files = uploadData
                                    ? [uploadData.file]
                                    : multiUploadData
                                      ? multiUploadData.files
                                      : [];
                                  if (files.length > 0) {
                                    calculateCompressionPreview(files);
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '0.375rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                              }}
                            >
                              <option value="image/jpeg">JPEG</option>
                              <option value="image/png">PNG</option>
                              <option value="image/webp">WebP</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 压缩预览信息 */}
                    {userWantsCompress &&
                      !calculatingCompression &&
                      Object.keys(compressionPreview).length > 0 && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 500,
                              marginBottom: '0.5rem',
                              color: '#0369a1',
                            }}
                          >
                            压缩预览
                          </div>
                          {files.map((file, index) => {
                            const preview = compressionPreview[file.name];
                            if (!preview) return null;

                            const formatSize = (bytes: number) => {
                              if (bytes < 1024) return bytes + ' B';
                              if (bytes < 1024 * 1024)
                                return (bytes / 1024).toFixed(2) + ' KB';
                              return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                            };

                            const sizeChanged =
                              preview.originalSize !== preview.compressedSize;
                            const dimensionsChanged =
                              preview.originalDimensions.width !==
                                preview.compressedDimensions.width ||
                              preview.originalDimensions.height !==
                                preview.compressedDimensions.height;

                            return (
                              <div
                                key={index}
                                style={{
                                  marginBottom:
                                    index < files.length - 1 ? '0.5rem' : 0,
                                  paddingBottom:
                                    index < files.length - 1 ? '0.5rem' : 0,
                                  borderBottom:
                                    index < files.length - 1
                                      ? '1px solid #bae6fd'
                                      : 'none',
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 500,
                                    marginBottom: '0.25rem',
                                    color: '#0c4a6e',
                                  }}
                                >
                                  {file.name}
                                </div>
                                <div style={{ color: '#075985' }}>
                                  <div>
                                    文件大小:{' '}
                                    <span
                                      style={{
                                        textDecoration: sizeChanged
                                          ? 'line-through'
                                          : 'none',
                                        color: sizeChanged
                                          ? '#64748b'
                                          : 'inherit',
                                      }}
                                    >
                                      {formatSize(preview.originalSize)}
                                    </span>
                                    {sizeChanged && (
                                      <>
                                        {' → '}
                                        <span
                                          style={{
                                            color: '#059669',
                                            fontWeight: 500,
                                          }}
                                        >
                                          {formatSize(preview.compressedSize)}
                                        </span>{' '}
                                        <span
                                          style={{
                                            color:
                                              preview.compressionRatio > 30
                                                ? '#059669'
                                                : preview.compressionRatio > 10
                                                  ? '#d97706'
                                                  : '#64748b',
                                            fontWeight: 500,
                                          }}
                                        >
                                          (节省{' '}
                                          {preview.compressionRatio.toFixed(1)}
                                          %)
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {dimensionsChanged && (
                                    <div style={{ marginTop: '0.25rem' }}>
                                      尺寸:{' '}
                                      <span
                                        style={{
                                          textDecoration: 'line-through',
                                          color: '#64748b',
                                        }}
                                      >
                                        {preview.originalDimensions.width} ×{' '}
                                        {preview.originalDimensions.height}
                                      </span>
                                      {' → '}
                                      <span
                                        style={{
                                          color: '#059669',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {preview.compressedDimensions.width} ×{' '}
                                        {preview.compressedDimensions.height}
                                      </span>
                                    </div>
                                  )}
                                  {!sizeChanged && !dimensionsChanged && (
                                    <div
                                      style={{
                                        color: '#64748b',
                                        fontStyle: 'italic',
                                      }}
                                    >
                                      文件较小，无需压缩
                                    </div>
                                  )}
                                </div>
                                {/* 图片预览对比 */}
                                {(preview.originalPreviewUrl ||
                                  preview.compressedPreviewUrl) && (
                                  <div
                                    style={{
                                      marginTop: '0.75rem',
                                      display: 'grid',
                                      gridTemplateColumns:
                                        preview.originalPreviewUrl &&
                                        preview.compressedPreviewUrl
                                          ? '1fr 1fr'
                                          : '1fr',
                                      gap: '0.5rem',
                                    }}
                                  >
                                    {preview.originalPreviewUrl && (
                                      <div>
                                        <div
                                          style={{
                                            fontSize: '0.625rem',
                                            color: '#64748b',
                                            marginBottom: '0.25rem',
                                          }}
                                        >
                                          原图
                                        </div>
                                        <div
                                          style={{
                                            position: 'relative',
                                            width: '100%',
                                            aspectRatio: '16/9',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.25rem',
                                            overflow: 'hidden',
                                            backgroundColor: '#f9fafb',
                                          }}
                                        >
                                          <img
                                            src={preview.originalPreviewUrl}
                                            alt="原图预览"
                                            style={{
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'contain',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {preview.compressedPreviewUrl && (
                                      <div>
                                        <div
                                          style={{
                                            fontSize: '0.625rem',
                                            color: '#64748b',
                                            marginBottom: '0.25rem',
                                          }}
                                        >
                                          压缩后
                                        </div>
                                        <div
                                          style={{
                                            position: 'relative',
                                            width: '100%',
                                            aspectRatio: '16/9',
                                            border: '1px solid #10b981',
                                            borderRadius: '0.25rem',
                                            overflow: 'hidden',
                                            backgroundColor: '#f9fafb',
                                          }}
                                        >
                                          <img
                                            src={preview.compressedPreviewUrl}
                                            alt="压缩后预览"
                                            style={{
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'contain',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="image-upload-form-group">
            <label className="image-upload-form-label">
              {isMultipleUpload
                ? translate('image.upload.namePrefix')
                : translate('image.upload.imageName')}{' '}
              <span className="image-upload-form-optional">
                {translate('image.upload.optional')}
              </span>
            </label>
            <input
              type="text"
              value={currentData?.name || ''}
              onChange={e =>
                isMultipleUpload
                  ? handleMultiInputChange('name', e.target.value)
                  : handleInputChange('name', e.target.value)
              }
              placeholder={
                isMultipleUpload
                  ? translate('image.upload.namePrefixPlaceholder')
                  : translate('image.upload.imageNamePlaceholder')
              }
              className="image-upload-form-input"
            />
          </div>

          <div className="image-upload-form-group">
            <label className="image-upload-form-label">
              图片描述{' '}
              <span className="image-upload-form-optional">
                {translate('image.upload.optional')}
              </span>
            </label>
            <textarea
              value={currentData?.description || ''}
              onChange={e =>
                isMultipleUpload
                  ? handleMultiInputChange('description', e.target.value)
                  : handleInputChange('description', e.target.value)
              }
              placeholder={
                isMultipleUpload
                  ? translate('image.upload.descriptionPlaceholderMultiple')
                  : translate('image.upload.descriptionPlaceholder')
              }
              rows={3}
              className="image-upload-form-textarea"
            />
          </div>

          <div className="image-upload-form-group">
            <label className="image-upload-form-label">
              标签{' '}
              <span className="image-upload-form-optional">
                {translate('image.upload.optional')}
              </span>
            </label>
            {/* 标签显示区域 */}
            {Array.isArray(currentData?.tags) &&
              currentData.tags.length > 0 && (
                <div className="image-upload-tags-container">
                  {currentData.tags.map((tag, index) => (
                    <span key={index} className="image-upload-tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags =
                            currentData.tags?.filter((_, i) => i !== index) ||
                            [];
                          isMultipleUpload
                            ? handleMultiInputChange('tags', newTags)
                            : handleInputChange('tags', newTags);
                        }}
                        className="image-upload-tag-remove"
                        aria-label={`删除标签 ${tag}`}
                      >
                        <X className="image-upload-tag-remove-icon" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            {/* 标签输入框 */}
            <input
              ref={tagInputRef}
              type="text"
              onChange={e => {
                const value = e.target.value;
                // 如果输入包含逗号，自动添加标签
                if (value.includes(',')) {
                  const newTags = value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(Boolean);
                  const existingTags = currentData?.tags || [];
                  const uniqueNewTags = newTags.filter(
                    tag => !existingTags.includes(tag),
                  );
                  if (uniqueNewTags.length > 0) {
                    const updatedTags = [...existingTags, ...uniqueNewTags];
                    isMultipleUpload
                      ? handleMultiInputChange('tags', updatedTags)
                      : handleInputChange('tags', updatedTags);
                  }
                  if (tagInputRef.current) {
                    tagInputRef.current.value = '';
                  }
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    const existingTags = currentData?.tags || [];
                    if (!existingTags.includes(value)) {
                      const updatedTags = [...existingTags, value];
                      isMultipleUpload
                        ? handleMultiInputChange('tags', updatedTags)
                        : handleInputChange('tags', updatedTags);
                    }
                    if (tagInputRef.current) {
                      tagInputRef.current.value = '';
                    }
                  }
                } else if (
                  e.key === 'Backspace' &&
                  e.currentTarget.value === ''
                ) {
                  // 如果输入框为空且按了退格键，删除最后一个标签
                  const existingTags = currentData?.tags || [];
                  if (existingTags.length > 0) {
                    const updatedTags = existingTags.slice(0, -1);
                    isMultipleUpload
                      ? handleMultiInputChange('tags', updatedTags)
                      : handleInputChange('tags', updatedTags);
                  }
                }
              }}
              placeholder={
                isMultipleUpload
                  ? translate('image.upload.tagsPlaceholderMultiple')
                  : translate('image.upload.tagsPlaceholder')
              }
              className="image-upload-form-input"
            />
          </div>

          <div className="image-upload-button-group">
            <button
              type="button"
              onClick={handleCancel}
              className="image-upload-button image-upload-button-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="image-upload-button image-upload-button-primary"
            >
              {loading ? (
                <>
                  <div className="image-upload-spinner"></div>
                  <span>{translate('image.upload.uploading')}</span>
                </>
              ) : (
                <>
                  <Upload className="image-upload-button-icon" />
                  <span>
                    {isMultipleUpload
                      ? `${translate('image.upload.batchUploadButton')} (${files.length} 张)`
                      : translate('image.upload.uploadButton')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
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

      {/* 批量上传进度显示 - 集成到主弹窗内 */}
      {showProgress && batchUploadProgress ? (
        <div className="image-upload-progress-container">
          <div className="image-upload-progress-header">
            <h3 className="image-upload-progress-title">
              {translate('image.upload.batchProgress') || '上传进度'}
            </h3>
            <div className="image-upload-progress-count">
              {batchUploadProgress.completed + batchUploadProgress.failed} /{' '}
              {batchUploadProgress.total}
            </div>
          </div>

          {/* 总体进度 */}
          <div className="image-upload-progress-overall">
            <div className="image-upload-progress-overall-header">
              <span>
                {translate('image.upload.overallProgress') || '总体进度'}
              </span>
              <span>
                {Math.round(
                  ((batchUploadProgress.completed +
                    batchUploadProgress.failed) /
                    batchUploadProgress.total) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="image-upload-progress-bar">
              <div
                className="image-upload-progress-bar-fill"
                style={{
                  width: `${((batchUploadProgress.completed + batchUploadProgress.failed) / batchUploadProgress.total) * 100}%`,
                }}
              />
            </div>
            <div className="image-upload-progress-stats">
              <span>
                {translate('image.upload.success') || '成功'}:{' '}
                {batchUploadProgress.completed}
              </span>
              <span>
                {translate('image.upload.failed') || '失败'}:{' '}
                {batchUploadProgress.failed}
              </span>
            </div>
          </div>

          {/* 当前上传文件 */}
          {batchUploadProgress.current && (
            <div className="image-upload-progress-current">
              <div className="image-upload-progress-current-content">
                <Loader2 className="image-upload-progress-current-spinner" />
                <span className="image-upload-progress-current-text">
                  {translate('image.upload.uploadingCurrent') || '正在上传'}:{' '}
                  {batchUploadProgress.current}
                </span>
              </div>
            </div>
          )}

          {/* 文件列表 */}
          <div className="image-upload-progress-list">
            {batchUploadProgress.items.map((item, index) => (
              <div key={item.id} className="image-upload-progress-item">
                <div className="image-upload-progress-item-icon">
                  {item.status === 'success' && (
                    <CheckCircle className="image-upload-progress-item-icon success" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="image-upload-progress-item-icon error" />
                  )}
                  {item.status === 'uploading' && (
                    <Loader2 className="image-upload-progress-item-icon uploading" />
                  )}
                </div>
                <div className="image-upload-progress-item-info">
                  <p className="image-upload-progress-item-name">
                    {multiUploadData?.files[index]?.name ||
                      `${translate('image.upload.file') || '文件'} ${index + 1}`}
                  </p>
                  <p className="image-upload-progress-item-message">
                    {item.message}
                    {item.status === 'success' && item.width && item.height && (
                      <span className="image-upload-progress-item-dimensions">
                        {' '}
                        ({item.width} × {item.height})
                      </span>
                    )}
                  </p>
                </div>
                <div className="image-upload-progress-item-progress">
                  {item.progress}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`image-upload-dropzone ${isDragActive ? 'active' : 'inactive'}`}
        >
          <input {...getInputProps({})} />
          <div className="image-upload-content">
            <div
              className={`image-upload-icon-container ${isDragActive ? 'active' : 'inactive'}`}
            >
              {enableCrop ? (
                <Crop
                  className={`image-upload-icon ${isDragActive ? 'active' : 'inactive'}`}
                />
              ) : (
                <Upload
                  className={`image-upload-icon ${isDragActive ? 'active' : 'inactive'}`}
                />
              )}
            </div>
            <div style={{ width: '100%' }}>
              <p
                className={`image-upload-text ${isDragActive ? 'active' : 'inactive'}`}
              >
                {isDragActive
                  ? translate('image.upload.dragActive') || '松开鼠标上传图片'
                  : enableCrop
                    ? translate('image.upload.dragInactiveWithCrop') ||
                      '拖拽图片到此处或点击选择'
                    : translate('image.upload.dragInactive') ||
                      '拖拽图片到此处或点击选择'}
              </p>
              <p className="image-upload-description">
                {translate('image.upload.supportedFormats') ||
                  '支持 JPG, PNG, GIF, BMP, WebP, SVG 等主流图片格式'}
                {enableCrop && (
                  <span className="image-upload-crop-hint">
                    {' · '}
                    {translate('image.upload.cropHint') || '支持裁剪'}
                  </span>
                )}
              </p>
              <div className="image-upload-formats">
                {['JPG', 'PNG', 'GIF', 'BMP', 'WebP', 'SVG'].map(format => (
                  <span key={format} className="image-upload-format-tag">
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUpload;

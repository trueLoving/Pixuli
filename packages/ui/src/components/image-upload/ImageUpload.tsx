import {
  AlertCircle,
  CheckCircle,
  Crop,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defaultTranslate } from '../../locales';
import type {
  BatchUploadProgress,
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
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadImage,
  onUploadMultipleImages,
  loading,
  batchUploadProgress,
  t,
  enableCrop = false,
  cropOptions,
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        if (acceptedFiles.length === 1) {
          // 单张图片上传
          const file = acceptedFiles[0];
          if (enableCrop) {
            // 启用裁剪功能，先显示裁剪界面
            setCropFile(file);
            setCropFileIndex(-1);
            setShowCropModal(true);
          } else {
            setUploadData({
              file,
              name: file.name,
              description: '',
              tags: [],
            });
            setIsMultiple(false);
            setShowForm(true);
            showInfo(
              `${translate('image.upload.selectedSingle')}: ${file.name}`
            );
          }
        } else {
          // 多张图片上传
          if (enableCrop) {
            // 多张图片时，先处理第一张图片的裁剪
            setCropFile(acceptedFiles[0]);
            setCropFileIndex(0);
            setMultiUploadData({
              files: acceptedFiles,
              name: '',
              description: '',
              tags: [],
            });
            setIsMultiple(true);
            setShowCropModal(true);
          } else {
            setMultiUploadData({
              files: acceptedFiles,
              name: '',
              description: '',
              tags: [],
            });
            setIsMultiple(true);
            setShowForm(true);
            showInfo(
              `${translate('image.upload.selectedMultiple')} ${acceptedFiles.length} 张图片`
            );
          }
        }
      }
    },
    [enableCrop, translate]
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
      const loadingToast = showLoading(
        `${translate('image.upload.uploadingSingle')} "${uploadData.name || uploadData.file.name}"...`
      );
      try {
        await onUploadImage(uploadData);
        updateLoadingToSuccess(
          loadingToast,
          `${translate('image.upload.uploadSuccessSingle')} "${uploadData.name || uploadData.file.name}" 上传成功！`
        );
        setUploadData(null);
        setShowForm(false);
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
        );
      }
    }
  };

  const handleInputChange = (
    field: keyof ImageUploadData,
    value: string | string[]
  ) => {
    if (uploadData) {
      setUploadData({ ...uploadData, [field]: value });
    }
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (multiUploadData) {
      const loadingToast = showLoading(
        `${translate('image.upload.uploadingMultiple')} ${multiUploadData.files.length} 张图片...`
      );
      try {
        await onUploadMultipleImages(multiUploadData);
        updateLoadingToSuccess(
          loadingToast,
          `${translate('image.upload.uploadSuccessMultiple')} ${multiUploadData.files.length} 张图片！`
        );
        setMultiUploadData(null);
        setShowForm(false);
        setIsMultiple(false);
      } catch (error) {
        updateLoadingToError(
          loadingToast,
          `${translate('image.upload.uploadFailedMultiple')}: ${error instanceof Error ? error.message : '未知错误'}`
        );
      }
    }
  };

  const handleMultiInputChange = (
    field: keyof MultiImageUploadData,
    value: string | string[]
  ) => {
    if (multiUploadData) {
      setMultiUploadData({ ...multiUploadData, [field]: value });
    }
  };

  const handleCancel = () => {
    showInfo(translate('image.upload.cancelled'));
    setUploadData(null);
    setMultiUploadData(null);
    setShowForm(false);
    setIsMultiple(false);
    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
  };

  // 处理裁剪完成
  const handleCropComplete = (croppedFile: File) => {
    if (cropFileIndex === -1) {
      // 单张图片裁剪完成
      setUploadData({
        file: croppedFile,
        name: croppedFile.name,
        description: '',
        tags: [],
      });
      setIsMultiple(false);
      setShowForm(true);
    } else {
      // 多张图片中的第一张裁剪完成
      if (multiUploadData) {
        const newFiles = [...multiUploadData.files];
        newFiles[cropFileIndex] = croppedFile;
        setMultiUploadData({
          ...multiUploadData,
          files: newFiles,
        });
        setShowForm(true);
      }
    }

    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
    showInfo(
      `${translate('image.upload.cropComplete') || '裁剪完成'}: ${croppedFile.name}`
    );
  };

  // 处理跳过裁剪
  const handleSkipCrop = (originalFile: File) => {
    if (cropFileIndex === -1) {
      // 单张图片跳过裁剪
      setUploadData({
        file: originalFile,
        name: originalFile.name,
        description: '',
        tags: [],
      });
      setIsMultiple(false);
      setShowForm(true);
    } else {
      // 多张图片中的第一张跳过裁剪
      if (multiUploadData) {
        const newFiles = [...multiUploadData.files];
        newFiles[cropFileIndex] = originalFile;
        setMultiUploadData({
          ...multiUploadData,
          files: newFiles,
        });
        setShowForm(true);
      }
    }

    setShowCropModal(false);
    setCropFile(null);
    setCropFileIndex(-1);
    showInfo(
      `${translate('image.upload.skipCrop') || '跳过裁剪'}: ${originalFile.name}`
    );
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

  // 批量上传进度显示
  if (batchUploadProgress) {
    return (
      <div className="image-upload-progress-modal">
        <div className="image-upload-progress-content">
          <div className="image-upload-progress-header">
            <h2 className="image-upload-progress-title">
              {translate('image.upload.batchProgress')}
            </h2>
            <div className="image-upload-progress-count">
              {batchUploadProgress.completed + batchUploadProgress.failed} /{' '}
              {batchUploadProgress.total}
            </div>
          </div>

          {/* 总体进度 */}
          <div className="image-upload-progress-overall">
            <div className="image-upload-progress-overall-header">
              <span>{translate('image.upload.overallProgress')}</span>
              <span>
                {Math.round(
                  ((batchUploadProgress.completed +
                    batchUploadProgress.failed) /
                    batchUploadProgress.total) *
                    100
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
                {translate('image.upload.success')}:{' '}
                {batchUploadProgress.completed}
              </span>
              <span>
                {translate('image.upload.failed')}: {batchUploadProgress.failed}
              </span>
            </div>
          </div>

          {/* 当前上传文件 */}
          {batchUploadProgress.current && (
            <div className="image-upload-progress-current">
              <div className="image-upload-progress-current-content">
                <Loader2 className="image-upload-progress-current-spinner" />
                <span className="image-upload-progress-current-text">
                  {translate('image.upload.uploadingCurrent')}:{' '}
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
                      `${translate('image.upload.file')} ${index + 1}`}
                  </p>
                  <p className="image-upload-progress-item-message">
                    {item.message}
                  </p>
                </div>
                <div className="image-upload-progress-item-progress">
                  {item.progress}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 统一上传表单
  if (showForm && (uploadData || multiUploadData)) {
    const isMultipleUpload = isMultiple && multiUploadData;
    const files = isMultipleUpload ? multiUploadData.files : [uploadData!.file];
    const currentData = isMultipleUpload ? multiUploadData : uploadData;

    return (
      <div className="image-upload-modal-overlay">
        <div
          className={`image-upload-modal-content ${isMultipleUpload ? 'multiple' : 'single'}`}
        >
          <div className="image-upload-modal-header">
            <h2 className="image-upload-modal-title">
              {isMultipleUpload
                ? `${translate('image.upload.batchUploadTitle')} (${files.length} 张)`
                : translate('image.upload.addNewImage')}
            </h2>
            <button onClick={handleCancel} className="image-upload-modal-close">
              <X className="image-upload-modal-close-icon" />
            </button>
          </div>

          <form
            onSubmit={isMultipleUpload ? handleMultiSubmit : handleSubmit}
            className="image-upload-form"
          >
            {/* 文件列表 */}
            <div className="image-upload-file-list">
              {files.map((file, index) => (
                <div key={index} className="image-upload-file-item">
                  <ImageIcon className="image-upload-file-icon" />
                  <div className="image-upload-file-info">
                    <p className="image-upload-file-name">{file.name}</p>
                    <p className="image-upload-file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>

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
              <input
                type="text"
                value={
                  Array.isArray(currentData?.tags)
                    ? currentData.tags.join(', ')
                    : ''
                }
                onChange={e => {
                  const tags = e.target.value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag);
                  isMultipleUpload
                    ? handleMultiInputChange('tags', tags)
                    : handleInputChange('tags', tags);
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
          <div>
            <p
              className={`image-upload-text ${isDragActive ? 'active' : 'inactive'}`}
            >
              {isDragActive
                ? translate('image.upload.dragActive')
                : enableCrop
                  ? translate('image.upload.dragInactiveWithCrop') ||
                    '拖拽图片到此处或点击选择图片（支持裁剪）'
                  : translate('image.upload.dragInactive')}
            </p>
            <p className="image-upload-description">
              {translate('image.upload.supportedFormats')}
              {enableCrop && (
                <span className="image-upload-crop-hint">
                  {' '}
                  ({translate('image.upload.cropHint') || '支持裁剪'})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageUpload;

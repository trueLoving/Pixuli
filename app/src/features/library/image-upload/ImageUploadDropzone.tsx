import { Camera, Crop, Images, Upload } from 'lucide-react';
import React from 'react';
import type { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import type { NativeImagePickers } from './nativePickers';
import './ImageUploadDropzone.css';

export interface ImageUploadDropzoneProps {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  isDragActive: boolean;
  enableCrop?: boolean;
  nativePickers?: NativeImagePickers;
  translate: (key: string) => string;
  onNativePick: (source: 'camera' | 'gallery') => void;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  enableCrop = false,
  nativePickers,
  translate,
  onNativePick,
}) => (
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
          {enableCrop ? (
            <span className="image-upload-crop-hint">
              {' · '}
              {translate('image.upload.cropHint') || '支持裁剪'}
            </span>
          ) : null}
        </p>
        <div className="image-upload-formats">
          {['JPG', 'PNG', 'GIF', 'BMP', 'WebP', 'SVG'].map(format => (
            <span key={format} className="image-upload-format-tag">
              {format}
            </span>
          ))}
        </div>
        {nativePickers ? (
          <div className="image-upload-native-actions">
            <button
              type="button"
              className="image-upload-native-button"
              onClick={e => {
                e.stopPropagation();
                onNativePick('camera');
              }}
            >
              <Camera className="image-upload-native-icon" />
              <span>{translate('image.upload.pickFromCamera') || '拍照'}</span>
            </button>
            <button
              type="button"
              className="image-upload-native-button"
              onClick={e => {
                e.stopPropagation();
                onNativePick('gallery');
              }}
            >
              <Images className="image-upload-native-icon" />
              <span>{translate('image.upload.pickFromGallery') || '相册'}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

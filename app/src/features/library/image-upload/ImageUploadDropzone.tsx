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
    className={`image-upload-dropzone${isDragActive ? ' is-active' : ''}`}
  >
    <input {...getInputProps({})} />
    <div className="image-upload-content">
      <div className="image-upload-icon-container" aria-hidden>
        {enableCrop ? (
          <Crop className="image-upload-icon" />
        ) : (
          <Upload className="image-upload-icon" />
        )}
      </div>
      <div className="image-upload-copy">
        <p className="image-upload-text">
          {isDragActive
            ? translate('image.upload.dragActive')
            : translate('image.upload.dragInactive')}
        </p>
        <p className="image-upload-description">
          {translate('image.upload.supportedFormats')}
          {enableCrop ? (
            <span className="image-upload-crop-hint">
              {' · '}
              {translate('image.upload.cropHint')}
            </span>
          ) : null}
        </p>
        {nativePickers ? (
          <div className="image-upload-native-actions">
            <button
              type="button"
              className="image-upload-native-button"
              onClick={event => {
                event.stopPropagation();
                onNativePick('camera');
              }}
            >
              <Camera className="image-upload-native-icon" />
              <span>{translate('image.upload.pickFromCamera')}</span>
            </button>
            <button
              type="button"
              className="image-upload-native-button"
              onClick={event => {
                event.stopPropagation();
                onNativePick('gallery');
              }}
            >
              <Images className="image-upload-native-icon" />
              <span>{translate('image.upload.pickFromGallery')}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

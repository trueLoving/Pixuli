import { Camera, Crop, Images, Upload } from 'lucide-react';
import React from 'react';
import type { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import type { NativeImagePickers } from './nativePickers';
import './AssetUploadDropzone.css';

export interface AssetUploadDropzoneProps {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  isDragActive: boolean;
  enableCrop?: boolean;
  nativePickers?: NativeImagePickers;
  translate: (key: string) => string;
  onNativePick: (source: 'camera' | 'gallery') => void;
}

export const AssetUploadDropzone: React.FC<AssetUploadDropzoneProps> = ({
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
    className={`asset-upload-dropzone${isDragActive ? ' is-active' : ''}`}
  >
    <input {...getInputProps({})} />
    <div className="asset-upload-content">
      <div className="asset-upload-icon-container" aria-hidden>
        {enableCrop ? (
          <Crop className="asset-upload-icon" />
        ) : (
          <Upload className="asset-upload-icon" />
        )}
      </div>
      <div className="asset-upload-copy">
        <p className="asset-upload-text">
          {isDragActive
            ? translate('image.upload.dragActive')
            : translate('image.upload.dragInactive')}
        </p>
        <p className="asset-upload-description">
          {translate('image.upload.supportedFormats')}
          {enableCrop ? (
            <span className="asset-upload-crop-hint">
              {' · '}
              {translate('image.upload.cropHint')}
            </span>
          ) : null}
        </p>
        {nativePickers ? (
          <div className="asset-upload-native-actions">
            <button
              type="button"
              className="asset-upload-native-button"
              onClick={event => {
                event.stopPropagation();
                onNativePick('camera');
              }}
            >
              <Camera className="asset-upload-native-icon" />
              <span>{translate('image.upload.pickFromCamera')}</span>
            </button>
            <button
              type="button"
              className="asset-upload-native-button"
              onClick={event => {
                event.stopPropagation();
                onNativePick('gallery');
              }}
            >
              <Images className="asset-upload-native-icon" />
              <span>{translate('image.upload.pickFromGallery')}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

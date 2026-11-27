import { Camera, Images, Upload } from 'lucide-react';
import React from 'react';
import type { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import './AssetUploadDropzone.css';

export interface AssetUploadDropzoneProps {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  isDragActive: boolean;
  ingestEnabled: boolean;
  /** 由 Kind ingest.accept 推导，如 `JPG · PNG · PDF` */
  ingestTypesLabel?: string;
  showCamera?: boolean;
  showGallery?: boolean;
  translate: (key: string) => string;
  onNativePick: (source: 'camera' | 'gallery') => void;
}

export const AssetUploadDropzone: React.FC<AssetUploadDropzoneProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  ingestEnabled,
  ingestTypesLabel = '',
  showCamera = false,
  showGallery = false,
  translate,
  onNativePick,
}) => (
  <div
    {...getRootProps()}
    className={`asset-upload-dropzone${isDragActive ? ' is-active' : ''}${
      ingestEnabled ? '' : ' is-disabled'
    }`}
  >
    <input {...getInputProps({})} />
    <div className="asset-upload-content">
      <div className="asset-upload-icon-container" aria-hidden>
        <Upload className="asset-upload-icon" />
      </div>
      <div className="asset-upload-copy">
        <p className="asset-upload-text">
          {!ingestEnabled
            ? translate('image.upload.noKindIngest')
            : isDragActive
              ? translate('image.upload.dragActive')
              : translate('image.upload.dragInactive')}
        </p>
        {ingestEnabled && ingestTypesLabel ? (
          <p className="asset-upload-description">
            {translate('image.upload.supportedFormats').replace(
              '{types}',
              ingestTypesLabel,
            )}
          </p>
        ) : null}
        {ingestEnabled && (showCamera || showGallery) ? (
          <div className="asset-upload-native-actions">
            {showCamera ? (
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
            ) : null}
            {showGallery ? (
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
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

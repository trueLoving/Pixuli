import React from 'react';
import { defaultTranslate } from '@/i18n/locales';
import type {
  BatchUploadProgress,
  ImageCompressionOptions,
  ImageCropOptions,
  AssetUploadData,
  MultiAssetUploadData,
} from '@pixuli/core/types';
import type { NativeImagePickers } from './nativePickers';
import ImageCropModal from './ImageCropModal';
import { AssetUploadBatchProgress } from './AssetUploadBatchProgress';
import { AssetUploadConfirmForm } from './AssetUploadConfirmForm';
import { AssetUploadDropzone } from './AssetUploadDropzone';
import { useAssetUploadFlow } from './useAssetUploadFlow';

interface AssetUploadProps {
  onUploadAsset: (data: AssetUploadData) => Promise<unknown>;
  onUploadMultipleAssets: (data: MultiAssetUploadData) => Promise<unknown>;
  loading: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  t?: (key: string) => string;
  enableCrop?: boolean;
  cropOptions?: ImageCropOptions;
  enableCompression?: boolean;
  compressionOptions?: ImageCompressionOptions;
  nativePickers?: NativeImagePickers;
  defaultFolder?: string;
  initialFiles?: File[];
  onInitialFilesConsumed?: () => void;
}

const AssetUpload: React.FC<AssetUploadProps> = props => {
  const translate = props.t || defaultTranslate;
  const flow = useAssetUploadFlow({ ...props, translate });

  if (flow.showFormContent && flow.currentData) {
    return (
      <AssetUploadConfirmForm
        files={flow.files}
        isMultipleUpload={flow.isMultipleUpload}
        currentData={flow.currentData}
        fileDimensions={flow.fileDimensions}
        previewUrls={flow.previewUrls}
        enableCrop={flow.enableCrop}
        enableCompression={flow.enableCompression}
        userWantsCrop={flow.userWantsCrop}
        userWantsCompress={flow.userWantsCompress}
        calculatingCompression={flow.calculatingCompression}
        showCompressionConfig={flow.showCompressionConfig}
        userCompressionConfig={flow.userCompressionConfig}
        compressionPreview={flow.compressionPreview}
        onCropToggle={flow.setUserWantsCrop}
        onCompressionToggle={flow.handleCompressionToggle}
        onToggleCompressionConfig={() =>
          flow.setShowCompressionConfig(open => !open)
        }
        onCompressionConfigChange={flow.handleCompressionConfigChange}
        loading={flow.loading}
        destinationFolder={flow.destinationFolder}
        translate={flow.translate}
        tagInputRef={flow.tagInputRef}
        onSubmit={
          flow.isMultipleUpload ? flow.handleMultiSubmit : flow.handleSubmit
        }
        onCancel={flow.handleCancel}
        onRemoveFile={flow.removeFileAt}
        onAppendFiles={files => {
          void flow.appendFiles(files);
        }}
        onFieldChange={flow.handleFormFieldChange}
      />
    );
  }

  return (
    <>
      {flow.showCropModal && flow.cropFile ? (
        <ImageCropModal
          src={URL.createObjectURL(flow.cropFile)}
          fileName={flow.cropFile.name}
          originalFile={flow.cropFile}
          onCropComplete={file => {
            void flow.handleCropComplete(file);
          }}
          onSkipCrop={file => {
            void flow.handleSkipCrop(file);
          }}
          onCancel={flow.handleCropCancel}
          t={flow.translate}
          aspectRatio={flow.cropOptions?.aspectRatio}
          minWidth={flow.cropOptions?.minWidth}
          minHeight={flow.cropOptions?.minHeight}
          maxWidth={flow.cropOptions?.maxWidth}
          maxHeight={flow.cropOptions?.maxHeight}
        />
      ) : null}

      {flow.showProgress && flow.batchUploadProgress ? (
        <AssetUploadBatchProgress
          batchUploadProgress={flow.batchUploadProgress}
          translate={flow.translate}
          fileNameAt={index => flow.multiUploadData?.files[index]?.name}
        />
      ) : (
        <AssetUploadDropzone
          getRootProps={flow.getRootProps}
          getInputProps={flow.getInputProps}
          isDragActive={flow.isDragActive}
          enableCrop={flow.enableCrop}
          nativePickers={flow.nativePickers}
          translate={flow.translate}
          onNativePick={source => {
            void flow.handleNativePick(source);
          }}
        />
      )}
    </>
  );
};

export default AssetUpload;

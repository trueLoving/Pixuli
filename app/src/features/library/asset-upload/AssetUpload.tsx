import React from 'react';
import { defaultTranslate } from '@/i18n/locales';
import type {
  BatchUploadProgress,
  AssetUploadData,
  MultiAssetUploadData,
} from '@pixuli/core/types';
import type { NativeImagePickers } from './nativePickers';
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
          ingestEnabled={Boolean(flow.ingestAccept)}
          ingestTypesLabel={flow.ingestTypesLabel}
          showCamera={Boolean(flow.nativeSourceButtons?.camera)}
          showGallery={Boolean(flow.nativeSourceButtons?.gallery)}
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

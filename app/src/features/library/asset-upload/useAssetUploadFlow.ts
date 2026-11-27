import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type {
  BatchUploadProgress,
  AssetUploadData,
  MultiAssetUploadData,
  WebAssetUploadData,
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
} from './assetUploadUtils';
import {
  filterFilesAcceptedByRegisteredKinds,
  getAvailableIngestSources,
  getRegisteredKindIngestAccept,
  getRegisteredKindIngestTypesLabel,
} from './kindIngestAccept';
import { useAssetUploadCapture } from './useAssetUploadCapture';

export interface UseAssetUploadFlowOptions {
  onUploadAsset: (data: AssetUploadData) => Promise<unknown>;
  onUploadMultipleAssets: (data: MultiAssetUploadData) => Promise<unknown>;
  loading: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  translate: (key: string) => string;
  nativePickers?: NativeImagePickers;
  defaultFolder?: string;
  initialFiles?: File[];
  onInitialFilesConsumed?: () => void;
}

export function useAssetUploadFlow({
  onUploadAsset,
  onUploadMultipleAssets,
  loading,
  batchUploadProgress,
  translate,
  nativePickers,
  defaultFolder,
  initialFiles,
  onInitialFilesConsumed,
}: UseAssetUploadFlowOptions) {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [uploadData, setUploadData] = useState<WebAssetUploadData | null>(null);
  const [multiUploadData, setMultiUploadData] =
    useState<MultiAssetUploadData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);
  const [fileDimensions, setFileDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const tagInputRef = useRef<HTMLInputElement>(null);

  const {
    rememberCaptureMetadata,
    getCaptureMetadata,
    buildCaptureMetadataList,
  } = useAssetUploadCapture();

  const ingestAccept = useMemo(() => getRegisteredKindIngestAccept(), []);
  const ingestTypesLabel = useMemo(
    () => getRegisteredKindIngestTypesLabel(),
    [],
  );
  /** Kind 声明 ∩ 平台能力 */
  const availableSources = useMemo(() => getAvailableIngestSources(), []);
  const nativeSourceButtons = useMemo(() => {
    if (!nativePickers) return null;
    return {
      camera: availableSources.includes('camera')
        ? nativePickers.pickFromCamera
        : undefined,
      gallery: availableSources.includes('gallery')
        ? nativePickers.pickFromGallery
        : undefined,
    };
  }, [nativePickers, availableSources]);

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
    async (finalFile: File, meta: WebAssetUploadData) => {
      const fileName = finalFile.name;
      const loadingToast = showLoading(
        `${translate('image.upload.uploadingSingle')} "${fileName}"...`,
      );
      try {
        await onUploadAsset({
          file: finalFile,
          name: fileName,
          description: meta.description || '',
          tags: meta.tags || [],
          targetFolder: resolveDefaultFolder(defaultFolder),
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
      onUploadAsset,
      translate,
      defaultFolder,
      getCaptureMetadata,
      dimensionsTextFor,
      clearSingleDimensions,
    ],
  );

  const performMultiUpload = useCallback(
    async (files: File[], meta: MultiAssetUploadData) => {
      const loadingToast = showLoading(
        `${translate('image.upload.uploadingMultiple')} ${files.length} ${translate('image.upload.file')}...`,
      );
      try {
        await onUploadMultipleAssets({
          files,
          name: '',
          description: meta.description || '',
          tags: meta.tags || [],
          targetFolder: resolveDefaultFolder(defaultFolder),
          captureMetadataList: buildCaptureMetadataList(files),
        });
        updateLoadingToSuccess(
          loadingToast,
          translate('image.upload.successToastMultiple').replace(
            '{count}',
            String(files.length),
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
      onUploadMultipleAssets,
      translate,
      defaultFolder,
      buildCaptureMetadataList,
    ],
  );

  const selectFiles = useCallback(
    async (
      incoming: File[],
      meta?: { description: string; tags: string[] },
    ) => {
      const { accepted, rejected } =
        filterFilesAcceptedByRegisteredKinds(incoming);
      if (rejected.length > 0) {
        showInfo(
          translate('image.upload.unsupportedByKind').replace(
            '{count}',
            String(rejected.length),
          ),
        );
      }
      if (accepted.length === 0) return;

      const dimensionsMap: Record<string, { width: number; height: number }> =
        {};
      for (const file of accepted) {
        try {
          dimensionsMap[file.name] = await getImageDimensions(file);
        } catch {
          dimensionsMap[file.name] = { width: 0, height: 0 };
        }
      }

      const description = meta?.description ?? '';
      const tags = meta?.tags ?? [];
      const targetFolder = resolveDefaultFolder(defaultFolder);
      if (!meta) {
        setFileDimensions(dimensionsMap);
      } else {
        setFileDimensions(current => ({ ...current, ...dimensionsMap }));
      }

      if (accepted.length === 1) {
        const file = accepted[0];
        setMultiUploadData(null);
        setUploadData({
          file,
          name: file.name,
          description,
          tags,
          targetFolder,
        });
        setIsMultiple(false);
      } else {
        setUploadData(null);
        setMultiUploadData({
          files: accepted,
          name: '',
          description,
          tags,
          targetFolder,
        });
        setIsMultiple(true);
      }
      setShowForm(true);
    },
    [defaultFolder, translate],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => selectFiles(acceptedFiles),
    [selectFiles],
  );

  const appendFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;
      const existing = uploadData
        ? [uploadData.file]
        : (multiUploadData?.files ?? []);
      return selectFiles([...existing, ...incoming], {
        description:
          uploadData?.description ?? multiUploadData?.description ?? '',
        tags: uploadData?.tags ?? multiUploadData?.tags ?? [],
      });
    },
    [uploadData, multiUploadData, selectFiles],
  );

  const removeFileAt = useCallback(
    (index: number) => {
      const existing = uploadData
        ? [uploadData.file]
        : (multiUploadData?.files ?? []);
      const next = existing.filter((_, fileIndex) => fileIndex !== index);
      if (next.length === 0) {
        setUploadData(null);
        setMultiUploadData(null);
        setShowForm(false);
        setIsMultiple(false);
        return;
      }
      void selectFiles(next, {
        description:
          uploadData?.description ?? multiUploadData?.description ?? '',
        tags: uploadData?.tags ?? multiUploadData?.tags ?? [],
      });
    },
    [uploadData, multiUploadData, selectFiles],
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
    accept: ingestAccept,
    multiple: true,
    disabled: !ingestAccept,
    noClick: !ingestAccept,
    noDrag: !ingestAccept,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData) return;
    await performSingleUpload(uploadData.file, uploadData);
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiUploadData) return;
    await performMultiUpload(multiUploadData.files, multiUploadData);
  };

  const handleInputChange = (
    field: keyof WebAssetUploadData,
    value: string | string[],
  ) => {
    if (uploadData) setUploadData({ ...uploadData, [field]: value });
  };

  const handleMultiInputChange = (
    field: keyof MultiAssetUploadData,
    value: string | string[],
  ) => {
    if (multiUploadData) {
      setMultiUploadData({ ...multiUploadData, [field]: value });
    }
  };

  const handleCancel = useCallback(() => {
    setUploadData(null);
    setMultiUploadData(null);
    setShowForm(false);
    setIsMultiple(false);
  }, []);

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

  const handleFormFieldChange = (
    field: keyof WebAssetUploadData | keyof MultiAssetUploadData,
    value: string | string[],
  ) => {
    if (isMultipleUpload) {
      handleMultiInputChange(field as keyof MultiAssetUploadData, value);
      return;
    }
    handleInputChange(field as keyof WebAssetUploadData, value);
  };

  return {
    loading,
    nativePickers,
    nativeSourceButtons,
    translate,
    batchUploadProgress,
    multiUploadData,
    showProgress,
    showFormContent,
    isMultipleUpload,
    files,
    currentData,
    fileDimensions,
    previewUrls,
    tagInputRef,
    getRootProps,
    getInputProps,
    isDragActive,
    ingestAccept,
    ingestTypesLabel,
    handleSubmit,
    handleMultiSubmit,
    handleCancel,
    appendFiles,
    removeFileAt,
    handleNativePick,
    handleFormFieldChange,
    destinationFolder: resolveDefaultFolder(defaultFolder),
  };
}

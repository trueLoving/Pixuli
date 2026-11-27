import { useCallback, useRef } from 'react';
import type { AssetCaptureMetadata } from '@pixuli/core/types';

/** 上传流程中按 File 对象暂存采集元数据（WeakMap 避免泄漏） */
export function useAssetUploadCapture() {
  const captureMetadataByFileRef = useRef(
    new WeakMap<File, AssetCaptureMetadata>(),
  );

  const rememberCaptureMetadata = useCallback(
    (file: File, metadata?: AssetCaptureMetadata) => {
      if (metadata) {
        captureMetadataByFileRef.current.set(file, metadata);
      }
    },
    [],
  );

  const transferCaptureMetadata = useCallback((from: File, to: File) => {
    const metadata = captureMetadataByFileRef.current.get(from);
    if (metadata) {
      captureMetadataByFileRef.current.set(to, metadata);
      captureMetadataByFileRef.current.delete(from);
    }
  }, []);

  const getCaptureMetadata = useCallback(
    (file: File): AssetCaptureMetadata | undefined =>
      captureMetadataByFileRef.current.get(file),
    [],
  );

  const buildCaptureMetadataList = useCallback(
    (files: File[]) => files.map(file => getCaptureMetadata(file)),
    [getCaptureMetadata],
  );

  return {
    rememberCaptureMetadata,
    transferCaptureMetadata,
    getCaptureMetadata,
    buildCaptureMetadataList,
  };
}

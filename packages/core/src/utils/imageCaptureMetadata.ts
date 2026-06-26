import type {
  ImageCaptureMetadata,
  ImageExifSummary,
  ImageGeoLocation,
} from '../types/imageCapture';
import type { ImageItem } from '../types/image';

export interface BuildImageCaptureMetadataInput {
  source: ImageCaptureMetadata['source'];
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  localPath?: string;
  fileLastModified?: number;
  takenAt?: string;
  location?: ImageGeoLocation;
  exif?: ImageExifSummary;
  capturedAt?: string;
}

export function buildImageCaptureMetadata(
  input: BuildImageCaptureMetadataInput,
): ImageCaptureMetadata {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const takenAt =
    input.takenAt ??
    (input.fileLastModified
      ? new Date(input.fileLastModified).toISOString()
      : capturedAt);

  const metadata: ImageCaptureMetadata = {
    source: input.source,
    takenAt,
    capturedAt,
    fileName: input.fileName,
  };

  if (input.mimeType) metadata.mimeType = input.mimeType;
  if (input.fileSize != null) metadata.fileSize = input.fileSize;
  if (input.width != null) metadata.width = input.width;
  if (input.height != null) metadata.height = input.height;
  if (input.localPath) metadata.localPath = input.localPath;
  if (input.location) metadata.location = input.location;
  if (input.exif && Object.keys(input.exif).length > 0) {
    metadata.exif = input.exif;
  }

  return metadata;
}

/** Provider sidecar JSON 公共字段（含可选 `capture`） */
export function buildProviderSidecarPayload(
  metadata: ImageItem,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: metadata.id,
    name: metadata.name,
    description: metadata.description ?? '',
    tags: metadata.tags ?? [],
    size: metadata.size ?? 0,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    updatedAt: metadata.updatedAt,
    createdAt: metadata.createdAt,
  };

  if (metadata.captureMetadata) {
    payload.capture = metadata.captureMetadata;
  }

  return payload;
}

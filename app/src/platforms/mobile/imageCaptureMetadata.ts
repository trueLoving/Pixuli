import type {
  ImageCaptureMetadata,
  ImageCaptureSource,
  ImageExifSummary,
  ImageGeoLocation,
} from '@pixuli/core/types';
import { buildImageCaptureMetadata } from '@pixuli/core/utils';

type ExifrGps = {
  latitude?: number;
  longitude?: number;
  altitude?: number;
};

type ExifrParseResult = {
  DateTimeOriginal?: Date | string;
  CreateDate?: Date | string;
  ModifyDate?: Date | string;
  Make?: string;
  Model?: string;
  Orientation?: number;
  ExposureTime?: number;
  FNumber?: number;
  ISO?: number;
  ISOSpeedRatings?: number;
  FocalLength?: number;
  latitude?: number;
  longitude?: number;
  GPSLatitude?: number;
  GPSLongitude?: number;
  GPSAltitude?: number;
};

function toIsoTimestamp(value: Date | string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  const normalized = value.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function pickLocation(parsed: ExifrParseResult): ImageGeoLocation | undefined {
  const latitude = parsed.latitude ?? parsed.GPSLatitude;
  const longitude = parsed.longitude ?? parsed.GPSLongitude;
  if (latitude == null || longitude == null) {
    return undefined;
  }
  const location: ImageGeoLocation = { latitude, longitude };
  const altitude = parsed.GPSAltitude;
  if (altitude != null) {
    location.altitude = altitude;
  }
  return location;
}

function pickExifSummary(
  parsed: ExifrParseResult,
): ImageExifSummary | undefined {
  const summary: ImageExifSummary = {};
  if (parsed.Make) summary.make = String(parsed.Make);
  if (parsed.Model) summary.model = String(parsed.Model);
  if (parsed.Orientation != null) summary.orientation = parsed.Orientation;
  if (parsed.ExposureTime != null) {
    summary.exposureTime = String(parsed.ExposureTime);
  }
  if (parsed.FNumber != null) summary.fNumber = parsed.FNumber;
  const iso = parsed.ISO ?? parsed.ISOSpeedRatings;
  if (iso != null) summary.iso = iso;
  if (parsed.FocalLength != null) summary.focalLength = parsed.FocalLength;
  return Object.keys(summary).length > 0 ? summary : undefined;
}

/** 从 File/Blob 解析 EXIF（WebView 可用）；失败时回退文件信息。 */
export async function parseExifFromBlob(blob: Blob): Promise<{
  takenAt?: string;
  location?: ImageGeoLocation;
  exif?: ImageExifSummary;
}> {
  try {
    const exifr = await import('exifr');
    const parsed = (await exifr.parse(blob, {
      gps: true,
      tiff: true,
      exif: true,
    })) as ExifrParseResult | null;
    if (!parsed) {
      return {};
    }
    const takenAt =
      toIsoTimestamp(parsed.DateTimeOriginal) ??
      toIsoTimestamp(parsed.CreateDate) ??
      toIsoTimestamp(parsed.ModifyDate);
    return {
      takenAt,
      location: pickLocation(parsed),
      exif: pickExifSummary(parsed),
    };
  } catch {
    return {};
  }
}

export async function buildCaptureMetadataFromFile(
  file: File,
  options: {
    source: ImageCaptureSource;
    localPath?: string;
    width?: number;
    height?: number;
  },
): Promise<ImageCaptureMetadata> {
  const parsed = await parseExifFromBlob(file);
  return buildImageCaptureMetadata({
    source: options.source,
    fileName: file.name,
    mimeType: file.type || undefined,
    fileSize: file.size,
    width: options.width,
    height: options.height,
    localPath: options.localPath,
    fileLastModified: file.lastModified,
    takenAt: parsed.takenAt,
    location: parsed.location,
    exif: parsed.exif,
  });
}

/** Capacitor `@capacitor/camera` 返回的 EXIF 子集映射 */
export function mapCapacitorExif(raw: Record<string, unknown> | undefined): {
  takenAt?: string;
  location?: ImageGeoLocation;
  exif?: ImageExifSummary;
} {
  if (!raw) {
    return {};
  }

  const takenAt =
    toIsoTimestamp(raw.DateTimeOriginal as Date | string | undefined) ??
    toIsoTimestamp(raw.DateTime as Date | string | undefined);

  const gps = raw.GPS as ExifrGps | undefined;
  const location =
    gps?.latitude != null && gps?.longitude != null
      ? {
          latitude: gps.latitude,
          longitude: gps.longitude,
          ...(gps.altitude != null ? { altitude: gps.altitude } : {}),
        }
      : undefined;

  const exif: ImageExifSummary = {};
  if (raw.Make) exif.make = String(raw.Make);
  if (raw.Model) exif.model = String(raw.Model);
  if (raw.Orientation != null) {
    exif.orientation = Number(raw.Orientation);
  }

  return {
    takenAt,
    location,
    exif: Object.keys(exif).length > 0 ? exif : undefined,
  };
}

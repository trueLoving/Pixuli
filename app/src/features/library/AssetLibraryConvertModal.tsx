import type { ImageItem } from '@pixuli/core/types';
import type { OutputMimeType } from '@/features/tools/imageProcessor';
import { readAssetBytes } from '@/features/library/assetDownloadService';
import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import ReactCrop, {
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  IMAGE_CONVERT_PRESETS,
  type ImageConvertPresetId,
  type ImageConvertRequest,
  type ImageCropRect,
} from './imageConvertTarget';
import {
  libraryProcessModesForItems,
  type LibraryProcessMode,
} from './libraryProcess';
import './AssetLibraryBatchEditModal.css';

const FORMATS: OutputMimeType[] = ['image/webp', 'image/jpeg', 'image/png'];

const FORMAT_LABEL: Record<OutputMimeType, string> = {
  'image/webp': 'WebP',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
};

export interface AssetLibraryConvertModalProps {
  isOpen: boolean;
  items: ImageItem[];
  t: (key: string) => string;
  onClose: () => void;
  onConvert: (request: ImageConvertRequest) => Promise<void>;
  onCrop: (item: ImageItem, crop: ImageCropRect) => Promise<{ saved: number }>;
}

export const AssetLibraryConvertModal: React.FC<
  AssetLibraryConvertModalProps
> = ({ isOpen, items, t, onClose, onConvert, onCrop }) => {
  const [mode, setMode] = useState<LibraryProcessMode>('convert');
  const [presetId, setPresetId] = useState<ImageConvertPresetId | null>(
    'webp-80',
  );
  const [format, setFormat] = useState<OutputMimeType>('image/webp');
  const [quality, setQuality] = useState(0.8);
  const [maxEdge, setMaxEdge] = useState('');
  const [busy, setBusy] = useState(false);
  const [cropIndex, setCropIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const available = libraryProcessModesForItems(items);
    setMode(
      available.includes('convert') ? 'convert' : (available[0] ?? 'convert'),
    );
    setPresetId('webp-80');
    setFormat('image/webp');
    setQuality(0.8);
    setMaxEdge('');
    setBusy(false);
    setCropIndex(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [isOpen, items]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, isOpen, onClose]);

  const modes = libraryProcessModesForItems(items);
  const cropItem = items[cropIndex] ?? null;

  useEffect(() => {
    if (!isOpen || mode !== 'crop' || !cropItem) return;
    let cancelled = false;
    let url = '';
    setPreviewUrl(null);
    setPreviewError(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    void readAssetBytes(cropItem)
      .then(bytes => {
        if (cancelled) return;
        url = URL.createObjectURL(
          new Blob([bytes.slice()], {
            type: cropItem.type?.startsWith('image/')
              ? cropItem.type
              : 'image/jpeg',
          }),
        );
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewError(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [cropItem, isOpen, mode]);

  if (!isOpen) return null;

  const applyPreset = (id: ImageConvertPresetId) => {
    const preset = IMAGE_CONVERT_PRESETS[id];
    setPresetId(id);
    setFormat(preset.format);
    setQuality(preset.quality);
    setMaxEdge(preset.maxEdge ? String(preset.maxEdge) : '');
  };

  const convertRequest = (): ImageConvertRequest => {
    const edge = Number(maxEdge);
    return {
      format,
      quality,
      maxEdge: Number.isFinite(edge) && edge > 0 ? edge : undefined,
    };
  };

  const naturalCrop = (): ImageCropRect | null => {
    const image = imgRef.current;
    if (
      !image ||
      !completedCrop ||
      image.width < 1 ||
      image.height < 1 ||
      completedCrop.width < 1 ||
      completedCrop.height < 1
    ) {
      return null;
    }
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    return {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    };
  };

  const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const next: Crop = { unit: '%', x: 10, y: 10, width: 80, height: 80 };
    setCrop(next);
    setCompletedCrop(convertToPixelCrop(next, image.width, image.height));
  };

  return (
    <div className="asset-library-batch-edit-overlay" role="presentation">
      <div
        className={`asset-library-batch-edit-content${mode === 'crop' ? ' asset-library-process-content--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-process-title"
      >
        <div className="asset-library-batch-edit-header">
          <h2
            id="library-process-title"
            className="asset-library-batch-edit-title"
          >
            {t('image.library.convertTitle')}
          </h2>
          <button
            type="button"
            className="asset-library-batch-edit-close"
            onClick={onClose}
            disabled={busy}
            aria-label={t('common.cancel')}
          >
            <X size={18} />
          </button>
        </div>
        <p className="asset-library-batch-edit-scope">
          {t('image.library.convertScope').replace(
            '{count}',
            String(items.length),
          )}
        </p>
        {modes.length > 1 ? (
          <div className="asset-library-process-modes" role="tablist">
            {modes.map(id => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                className={`asset-library-process-mode${mode === id ? ' is-active' : ''}`}
                onClick={() => setMode(id)}
                disabled={busy}
              >
                {t(
                  id === 'crop'
                    ? 'image.library.processCrop'
                    : 'image.library.processConvert',
                )}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="asset-library-batch-edit-form"
          onSubmit={event => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            const task =
              mode === 'convert'
                ? onConvert(convertRequest()).then(() => undefined)
                : (async () => {
                    const rect = naturalCrop();
                    if (!cropItem || !rect) return;
                    const result = await onCrop(cropItem, rect);
                    if (result.saved === 0) return;
                    if (cropIndex + 1 >= items.length) onClose();
                    else setCropIndex(index => index + 1);
                  })();
            void task.finally(() => setBusy(false));
          }}
        >
          {mode === 'convert' ? (
            <>
              <div className="asset-library-convert-presets">
                {(
                  [
                    ['webp-80', 'image.library.convertPresetWebp'],
                    ['long-1600', 'image.library.convertPresetEdge'],
                    ['png-original', 'image.library.convertPresetPng'],
                  ] as const
                ).map(([id, key]) => (
                  <button
                    key={id}
                    type="button"
                    className={`asset-library-convert-preset${presetId === id ? ' is-active' : ''}`}
                    onClick={() => applyPreset(id)}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
              <div className="asset-library-batch-edit-field">
                <label htmlFor="library-convert-format">
                  {t('image.library.convertFormat')}
                </label>
                <select
                  id="library-convert-format"
                  value={format}
                  onChange={event => {
                    setPresetId(null);
                    setFormat(event.target.value as OutputMimeType);
                  }}
                >
                  {FORMATS.map(item => (
                    <option key={item} value={item}>
                      {FORMAT_LABEL[item]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="asset-library-batch-edit-field">
                <label htmlFor="library-convert-quality">
                  {t('image.library.convertQuality')} (
                  {Math.round(quality * 100)}%)
                </label>
                <input
                  id="library-convert-quality"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={event => {
                    setPresetId(null);
                    setQuality(Number(event.target.value));
                  }}
                />
              </div>
              <div className="asset-library-batch-edit-field">
                <label htmlFor="library-convert-edge">
                  {t('image.library.convertMaxEdge')}
                </label>
                <input
                  id="library-convert-edge"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder={t('image.library.convertMaxEdgeNone')}
                  value={maxEdge}
                  onChange={event => {
                    setPresetId(null);
                    setMaxEdge(event.target.value);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="asset-library-process-crop">
              <p className="asset-library-batch-edit-scope">
                {items.length > 1
                  ? `${t('image.library.cropStep')
                      .replace('{index}', String(cropIndex + 1))
                      .replace(
                        '{count}',
                        String(items.length),
                      )} · ${cropItem?.name ?? ''}`
                  : (cropItem?.name ?? '')}
              </p>
              <p className="asset-library-batch-edit-scope">
                {previewError
                  ? t('image.library.cropUnreadable')
                  : t('image.library.cropHint')}
              </p>
              {previewUrl ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={pixelCrop => setCompletedCrop(pixelCrop)}
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt={cropItem?.name ?? ''}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              ) : null}
            </div>
          )}
          <div className="asset-library-batch-edit-actions">
            <button
              type="button"
              className="asset-library-chrome-btn"
              onClick={onClose}
              disabled={busy}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="asset-library-chrome-btn asset-library-chrome-btn--accent asset-library-batch-edit-save"
              disabled={
                busy ||
                items.length === 0 ||
                (mode === 'crop' && (previewError || !completedCrop))
              }
            >
              {busy
                ? mode === 'crop'
                  ? t('image.library.cropSaving')
                  : t('image.library.convertSaving')
                : mode === 'crop'
                  ? t('image.library.cropSave')
                  : t('image.library.convertSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

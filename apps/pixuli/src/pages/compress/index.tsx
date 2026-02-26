import {
  formatFileSize,
  webImageProcessorService,
  type ImageCompressionOptions,
  type ImageProcessResult,
} from '@packages/common/src';
import { Download, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';

type ResultItem = { file: File; result: ImageProcessResult };

export const CompressPage: React.FC = () => {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [processing, setProcessing] = useState(false);

  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState<number | ''>('');
  const [maxHeight, setMaxHeight] = useState<number | ''>('');
  const [outputFormat, setOutputFormat] = useState<
    'image/jpeg' | 'image/png' | 'image/webp'
  >('image/jpeg');
  const [minSizeKB, setMinSizeKB] = useState<number | ''>('');
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);

  const options: ImageCompressionOptions = {
    quality,
    maxWidth: maxWidth === '' ? undefined : maxWidth,
    maxHeight: maxHeight === '' ? undefined : maxHeight,
    maintainAspectRatio: keepAspectRatio,
    outputFormat,
    minSizeToCompress:
      minSizeKB === '' ? undefined : (minSizeKB as number) * 1024,
  };

  const resultsRef = useRef<ResultItem[]>([]);
  resultsRef.current = results;

  const revokeResults = useCallback((items: ResultItem[]) => {
    items.forEach(({ result }) => {
      if (result.uri?.startsWith('blob:')) URL.revokeObjectURL(result.uri);
    });
  }, []);

  useEffect(() => {
    return () => revokeResults(resultsRef.current);
  }, [revokeResults]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setFiles(Array.from(list));
    setResults([]);
    revokeResults(results);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const list = e.dataTransfer.files;
      if (!list?.length) return;
      const images = Array.from(list).filter(f => f.type.startsWith('image/'));
      if (images.length) {
        revokeResults(resultsRef.current);
        setFiles(images);
        setResults([]);
      }
    },
    [revokeResults],
  );
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleCompress = async () => {
    if (!files.length) return;
    setProcessing(true);
    revokeResults(resultsRef.current);
    setResults([]);
    const newResults: ResultItem[] = [];
    try {
      for (const file of files) {
        const result = await webImageProcessorService.compress(file, options);
        newResults.push({ file, result });
      }
      setResults(newResults);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = useCallback(() => {
    revokeResults(resultsRef.current);
    setFiles([]);
    setResults([]);
  }, [revokeResults]);

  const handleDownload = (item: ResultItem) => {
    const a = document.createElement('a');
    a.href = item.result.uri;
    a.download = item.result.file.name;
    a.click();
  };

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
          {t('compressPage.title')}
        </h1>

        <div
          className="mb-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800/50"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            id="compress-file-input"
            onChange={onFileChange}
          />
          <label
            htmlFor="compress-file-input"
            className="cursor-pointer text-gray-600 dark:text-gray-400"
          >
            <ImageIcon className="mx-auto mb-2 h-12 w-12" />
            <p>{t('compressPage.dropHint')}</p>
            {files.length > 0 && (
              <p className="mt-2 text-sm">
                {files.length} {t('sourceManager.imageCount')}
              </p>
            )}
          </label>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            选项
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('compressPage.quality')} ({(quality * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('compressPage.maxWidth')}
              </label>
              <input
                type="number"
                min="1"
                placeholder={t('compressPage.maxWidthPlaceholder')}
                value={maxWidth}
                onChange={e =>
                  setMaxWidth(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('compressPage.maxHeight')}
              </label>
              <input
                type="number"
                min="1"
                placeholder={t('compressPage.maxHeightPlaceholder')}
                value={maxHeight}
                onChange={e =>
                  setMaxHeight(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('compressPage.outputFormat')}
              </label>
              <select
                value={outputFormat}
                onChange={e =>
                  setOutputFormat(
                    e.target.value as 'image/jpeg' | 'image/png' | 'image/webp',
                  )
                }
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('compressPage.minSizeToCompress')}
              </label>
              <input
                type="number"
                min="0"
                placeholder={t('compressPage.minSizePlaceholder')}
                value={minSizeKB}
                onChange={e =>
                  setMinSizeKB(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="keep-aspect"
                checked={keepAspectRatio}
                onChange={e => setKeepAspectRatio(e.target.checked)}
                className="rounded"
              />
              <label
                htmlFor="keep-aspect"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                {t('compressPage.keepAspectRatio')}
              </label>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={handleCompress}
            disabled={!files.length || processing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('compressPage.compressing')}
              </>
            ) : (
              t('compressPage.compressBtn')
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Trash2 className="h-4 w-4" />
            {t('compressPage.clear')}
          </button>
        </div>

        {!files.length && !results.length && (
          <p className="text-center text-sm text-gray-500">
            {t('compressPage.noFiles')}
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              结果
            </h2>
            <ul className="space-y-3">
              {results.map((item, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <img
                    src={item.result.uri}
                    alt={item.result.file.name}
                    className="h-20 w-20 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium text-gray-800 dark:text-gray-200">
                      {item.result.file.name}
                    </p>
                    <p className="text-gray-500">
                      {t('compressPage.originalSize')}:{' '}
                      {formatFileSize(item.result.originalSize)} →{' '}
                      {t('compressPage.processedSize')}:{' '}
                      {formatFileSize(item.result.processedSize)} (
                      {((1 - item.result.compressionRatio) * 100).toFixed(1)}%{' '}
                      {t('compressPage.ratio')})
                    </p>
                    <p className="text-gray-500">
                      {t('compressPage.dimensions')}: {item.result.width} ×{' '}
                      {item.result.height}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <Download className="h-4 w-4" />
                    {t('compressPage.download')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompressPage;

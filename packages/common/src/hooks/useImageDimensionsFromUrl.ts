import { useState, useEffect, useCallback } from 'react';

interface ImageDimensions {
  width: number;
  height: number;
}

interface UseImageDimensionsFromUrlOptions {
  enabled?: boolean;
  timeout?: number;
}

interface UseImageDimensionsFromUrlReturn {
  dimensions: ImageDimensions | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useImageDimensionsFromUrl(
  imageUrl: string | null,
  options: UseImageDimensionsFromUrlOptions = {}
): UseImageDimensionsFromUrlReturn {
  const { enabled = true, timeout = 10000 } = options;

  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDimensions = useCallback(async () => {
    if (!imageUrl || !enabled) {
      setDimensions(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const img = new Image();

      const promise = new Promise<ImageDimensions>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('获取图片尺寸超时'));
        }, timeout);

        img.onload = () => {
          clearTimeout(timeoutId);
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };

        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('图片加载失败'));
        };

        // 设置跨域属性
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
      });

      const result = await promise;
      setDimensions(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '获取图片尺寸失败';
      setError(errorMessage);
      // 只在非测试环境中输出警告
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Failed to get dimensions for ${imageUrl}:`, err);
      }
    } finally {
      setLoading(false);
    }
  }, [imageUrl, enabled, timeout]);

  useEffect(() => {
    fetchDimensions();
  }, [fetchDimensions]);

  return {
    dimensions,
    loading,
    error,
    refetch: fetchDimensions,
  };
}

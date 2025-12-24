import { ImageItem } from '../../../../types/image';
import { defaultTranslate } from '../../../../locales';
import { slideShowLocales } from '../locales';
import { getRealGiteeUrl } from '../../../../utils/imageUtils';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Info,
  List,
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  Square,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SlideShowSettings from './SlideShowSettings';
import './SlideShowPlayer.css';
import {
  DEFAULT_SLIDE_SHOW_CONFIG,
  SlideShowConfig,
  TransitionEffect,
} from './types';
import PptxGenJS from 'pptxgenjs';

interface SlideShowPlayerProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调（可选，嵌入模式下可能不需要） */
  onClose?: () => void;
  /** 图片列表 */
  images: ImageItem[];
  /** 翻译函数 */
  t?: (key: string) => string;
  /** 是否嵌入模式（在容器中显示，而不是全屏） */
  embedded?: boolean;
  /** 全屏模式切换回调 */
  onFullscreenToggle?: (isFullscreen: boolean) => void;
}

const SlideShowPlayer: React.FC<SlideShowPlayerProps> = ({
  isOpen,
  onClose,
  images,
  t,
  embedded = false,
  onFullscreenToggle,
}) => {
  const translate = (key: string, params?: Record<string, any>) => {
    const transFn =
      t || ((k: string) => defaultTranslate(k, slideShowLocales['zh-CN']));
    let text = transFn(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  // 配置状态
  const [config, setConfig] = useState<SlideShowConfig>(
    DEFAULT_SLIDE_SHOW_CONFIG,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showImageInfo, setShowImageInfo] = useState(false);
  const [isImageInfoClosing, setIsImageInfoClosing] = useState(false);
  const [showImageList, setShowImageList] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'ppt'>('html');
  const [isExporting, setIsExporting] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // 播放状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  // 过渡效果状态
  const [transitioning, setTransitioning] = useState(false);

  // 背景音乐
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 定时器
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // 图片列表滚动容器引用
  const imageListRef = useRef<HTMLDivElement | null>(null);
  const currentImageItemRef = useRef<HTMLDivElement | null>(null);

  // 过滤后的图片列表（根据播放模式）
  const getFilteredImages = useCallback(() => {
    if (images.length === 0) return [];
    if (config.playMode === 'random') {
      // 随机模式：打乱顺序
      const shuffled = [...images].sort(() => Math.random() - 0.5);
      return shuffled;
    }
    return images;
  }, [images, config.playMode]);

  const filteredImages = getFilteredImages();

  // 播放下一张
  const playNext = useCallback(() => {
    if (filteredImages.length === 0) return;

    setTransitioning(true);
    setProgress(0);

    setTimeout(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= filteredImages.length) {
        if (config.loop) {
          nextIndex = 0;
        } else {
          // 不循环，停止播放
          setIsPlaying(false);
          setIsPaused(false);
          return;
        }
      }
      setCurrentIndex(nextIndex);
      setTransitioning(false);
    }, config.transitionDuration);
  }, [
    currentIndex,
    filteredImages.length,
    config.loop,
    config.transitionDuration,
  ]);

  // 播放上一张
  const playPrevious = useCallback(() => {
    if (filteredImages.length === 0) return;

    setTransitioning(true);
    setProgress(0);

    setTimeout(() => {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (config.loop) {
          prevIndex = filteredImages.length - 1;
        } else {
          return;
        }
      }
      setCurrentIndex(prevIndex);
      setTransitioning(false);
    }, config.transitionDuration);
  }, [
    currentIndex,
    filteredImages.length,
    config.loop,
    config.transitionDuration,
  ]);

  // 开始播放
  const handlePlay = useCallback(() => {
    if (filteredImages.length === 0) return;
    setIsPlaying(true);
    setIsPaused(false);

    // 播放背景音乐
    if (config.backgroundMusic && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [filteredImages.length, config.backgroundMusic]);

  // 暂停播放
  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // 暂停背景音乐
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // 停止播放
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // 停止背景音乐
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      // 通知父组件进入全屏模式
      if (onFullscreenToggle) {
        onFullscreenToggle(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
      // 通知父组件退出全屏模式
      if (onFullscreenToggle) {
        onFullscreenToggle(false);
      }
    }
  }, [isFullscreen, onFullscreenToggle]);

  // 自动播放逻辑
  useEffect(() => {
    if (isPlaying && !isPaused && filteredImages.length > 0) {
      // 清除之前的定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // 设置进度条更新
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 100 / (config.interval * 10);
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, config.interval / 10);

      // 设置自动切换
      intervalRef.current = setInterval(() => {
        playNext();
      }, config.interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, isPaused, filteredImages.length, config.interval, playNext]);

  // 自动播放
  useEffect(() => {
    if (isOpen && config.autoPlay && filteredImages.length > 0) {
      handlePlay();
    }
  }, [isOpen, config.autoPlay, filteredImages.length, handlePlay]);

  // 全屏监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          playNext();
          break;
        case ' ':
          e.preventDefault();
          if (isPlaying && !isPaused) {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isOpen,
    isFullscreen,
    isPlaying,
    isPaused,
    onClose,
    toggleFullscreen,
    playPrevious,
    playNext,
    handlePlay,
    handlePause,
  ]);

  // 背景音乐处理
  useEffect(() => {
    if (config.backgroundMusic) {
      const audio = new Audio(config.backgroundMusic);
      audio.volume = config.musicVolume;
      audio.loop = true;
      audioRef.current = audio;

      return () => {
        audio.pause();
        audio.src = '';
      };
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    }
  }, [config.backgroundMusic, config.musicVolume]);

  // 关闭时清理
  useEffect(() => {
    if (!isOpen) {
      handleStop();
      setCurrentIndex(0);
      setProgress(0);
      setShowImageInfo(false);
      setIsImageInfoClosing(false);
      setShowImageList(false);
      setUrlCopied(false);
    }
  }, [isOpen, handleStop]);

  // 处理元数据面板关闭（带动画）
  const handleCloseImageInfo = useCallback(() => {
    setIsImageInfoClosing(true);
    setTimeout(() => {
      setShowImageInfo(false);
      setIsImageInfoClosing(false);
    }, 300); // 与 CSS 动画时长一致
  }, []);

  // 复制 URL（使用真实 URL）
  const handleCopyUrl = useCallback(async () => {
    const image = filteredImages[currentIndex];
    if (!image) return;
    // 获取真实 URL（如果是代理 URL，则转换为真实 URL）
    const realUrl = getRealGiteeUrl(image.url);
    try {
      await navigator.clipboard.writeText(realUrl);
      setUrlCopied(true);
      setTimeout(() => {
        setUrlCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = realUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setUrlCopied(true);
        setTimeout(() => {
          setUrlCopied(false);
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  }, [filteredImages, currentIndex]);

  // 当当前图片改变时，自动滚动到对应的列表项
  useEffect(() => {
    if (showImageList && currentImageItemRef.current && imageListRef.current) {
      const container = imageListRef.current;
      const item = currentImageItemRef.current;

      // 计算需要滚动的距离
      const scrollTop = container.scrollTop;
      const itemTop = item.offsetTop;
      const itemHeight = item.offsetHeight;
      const containerHeight = container.clientHeight;

      // 如果当前项不在可视区域内，则滚动到中心位置
      if (
        itemTop < scrollTop ||
        itemTop + itemHeight > scrollTop + containerHeight
      ) {
        container.scrollTo({
          top: itemTop - containerHeight / 2 + itemHeight / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [currentIndex, showImageList]);

  // 点击列表中的图片切换到该图片
  const handleImageItemClick = useCallback(
    (index: number) => {
      if (index !== currentIndex) {
        setTransitioning(true);
        setProgress(0);
        setTimeout(() => {
          setCurrentIndex(index);
          setTransitioning(false);
        }, config.transitionDuration);
      }
    },
    [currentIndex, config.transitionDuration],
  );

  // 应用过渡效果样式
  const getTransitionClass = (effect: TransitionEffect) => {
    switch (effect) {
      case 'fade':
        return 'slide-show-transition-fade';
      case 'slide':
        return 'slide-show-transition-slide-left';
      case 'zoom':
        return 'slide-show-transition-zoom';
      case 'blur':
        return 'slide-show-transition-blur';
      case 'rotate':
        return 'slide-show-transition-rotate';
      default:
        return '';
    }
  };

  // 将图片 URL 转换为 base64
  const imageUrlToBase64 = useCallback(async (url: string): Promise<string> => {
    try {
      // 检测是否在 Electron 环境中
      const isElectron =
        typeof window !== 'undefined' &&
        ((window as any).githubAPI || (window as any).giteeAPI);

      if (isElectron) {
        // 在 Electron 环境中，使用 IPC 获取图片数据以避免跨域问题
        try {
          const isGitee = url.includes('gitee.com');
          const isGitHub =
            url.includes('github.com') || url.includes('githubusercontent.com');

          if (isGitee && (window as any).giteeAPI?.giteeGetImageData) {
            const result = await (window as any).giteeAPI.giteeGetImageData({
              url,
            });
            return result.data;
          } else if (
            isGitHub &&
            (window as any).githubAPI?.githubGetImageData
          ) {
            const result = await (window as any).githubAPI.githubGetImageData({
              url,
            });
            return result.data;
          }
        } catch (ipcError) {
          console.warn(
            'IPC image fetch failed, falling back to fetch:',
            ipcError,
          );
          // 如果 IPC 失败，回退到 fetch
        }
      }

      // 使用 fetch 获取图片（Web 端或 IPC 失败时的回退方案）
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
        );
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      // 如果转换失败，返回原始 URL（对于 HTML 导出，这会导致图片无法显示，但至少不会崩溃）
      throw error;
    }
  }, []);

  // 导出 HTML 格式
  const exportHTML = useCallback(
    async (
      imagesWithBase64: Array<{
        base64: string;
        name: string;
        size: number;
        width: number;
        height: number;
      }>,
    ) => {
      const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>幻灯片 - ${new Date().toLocaleDateString()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
      overflow: hidden;
    }
    .slide-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .slide-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .slide-info {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      background: rgba(0, 0, 0, 0.6);
      padding: 15px;
      border-radius: 8px;
      font-size: 14px;
    }
    .slide-counter {
      position: absolute;
      bottom: 20px;
      right: 20px;
      color: white;
      background: rgba(0, 0, 0, 0.6);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
    }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
    }
    .control-btn {
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .control-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="slide-container">
    <img id="slideImage" class="slide-image" src="" alt="Slide">
    <div class="slide-info" id="slideInfo"></div>
    <div class="slide-counter" id="slideCounter"></div>
    <div class="controls">
      <button class="control-btn" onclick="previousSlide()">上一张</button>
      <button class="control-btn" onclick="togglePlay()" id="playBtn">播放</button>
      <button class="control-btn" onclick="nextSlide()">下一张</button>
    </div>
  </div>
  <script>
    const images = ${JSON.stringify(imagesWithBase64)};
    let currentIndex = 0;
    let isPlaying = ${config.autoPlay ? 'true' : 'false'};
    let intervalId = null;
    const interval = ${config.interval * 1000};

    function updateSlide() {
      const img = document.getElementById('slideImage');
      const info = document.getElementById('slideInfo');
      const counter = document.getElementById('slideCounter');

      if (images[currentIndex]) {
        img.src = images[currentIndex].base64;
        info.innerHTML = \`<strong>\${images[currentIndex].name}</strong><br>
          大小: \${(images[currentIndex].size / 1024).toFixed(2)} KB<br>
          尺寸: \${images[currentIndex].width} × \${images[currentIndex].height}\`;
        counter.textContent = \`\${currentIndex + 1} / \${images.length}\`;
      }
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % images.length;
      updateSlide();
    }

    function previousSlide() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateSlide();
    }

    function togglePlay() {
      const btn = document.getElementById('playBtn');
      if (isPlaying) {
        clearInterval(intervalId);
        isPlaying = false;
        btn.textContent = '播放';
      } else {
        intervalId = setInterval(nextSlide, interval);
        isPlaying = true;
        btn.textContent = '暂停';
      }
    }

    // 键盘控制
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') previousSlide();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    });

    // 初始化
    updateSlide();
    if (isPlaying) {
      togglePlay();
    }
  </script>
</body>
</html>`;

      // 创建Blob并下载
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `幻灯片_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [config.autoPlay, config.interval],
  );

  // 导出 PPT 格式
  const exportPPT = useCallback(
    async (
      imagesWithBase64: Array<{
        base64: string;
        name: string;
        width: number;
        height: number;
      }>,
    ) => {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';

      for (const image of imagesWithBase64) {
        const slide = pptx.addSlide();

        // 计算图片尺寸以保持宽高比并适应幻灯片
        const slideWidth = 10; // 英寸
        const slideHeight = 7.5; // 英寸
        const imageAspectRatio = image.width / image.height;
        const slideAspectRatio = slideWidth / slideHeight;

        let imgWidth = slideWidth;
        let imgHeight = slideHeight;
        let x = 0;
        let y = 0;

        if (imageAspectRatio > slideAspectRatio) {
          // 图片更宽，以宽度为准
          imgHeight = slideWidth / imageAspectRatio;
          y = (slideHeight - imgHeight) / 2;
        } else {
          // 图片更高，以高度为准
          imgWidth = slideHeight * imageAspectRatio;
          x = (slideWidth - imgWidth) / 2;
        }

        // pptxgenjs 需要完整的 data URL 格式
        slide.addImage({
          data: image.base64,
          x: x,
          y: y,
          w: imgWidth,
          h: imgHeight,
        });

        // 添加图片名称作为标题
        if (image.name) {
          slide.addText(image.name, {
            x: 0.5,
            y: 0.2,
            w: slideWidth - 1,
            h: 0.5,
            fontSize: 18,
            color: '363636',
            align: 'center',
          });
        }
      }

      await pptx.writeFile({
        fileName: `幻灯片_${new Date().toISOString().split('T')[0]}.pptx`,
      });
    },
    [],
  );

  // 导出幻灯片
  const handleExport = useCallback(async () => {
    if (filteredImages.length === 0) return;

    setIsExporting(true);
    try {
      // 转换所有图片为 base64，允许部分失败
      const imagesWithBase64 = await Promise.allSettled(
        filteredImages.map(async img => {
          try {
            const base64 = await imageUrlToBase64(img.url);
            return {
              base64,
              name: img.name,
              size: img.size,
              width: img.width,
              height: img.height,
            };
          } catch (error) {
            console.error(
              `Failed to convert image ${img.name} to base64:`,
              error,
            );
            throw error;
          }
        }),
      );

      // 过滤出成功转换的图片
      const successfulImages = imagesWithBase64
        .filter(
          (
            result,
          ): result is PromiseFulfilledResult<{
            base64: string;
            name: string;
            size: number;
            width: number;
            height: number;
          }> => result.status === 'fulfilled',
        )
        .map(result => result.value);

      // 检查是否有成功的图片
      if (successfulImages.length === 0) {
        throw new Error('所有图片转换失败，无法导出');
      }

      // 如果有部分失败，提示用户
      const failedCount = imagesWithBase64.length - successfulImages.length;
      if (failedCount > 0) {
        console.warn(
          `${failedCount} 张图片转换失败，将导出 ${successfulImages.length} 张图片`,
        );
      }

      if (exportFormat === 'html') {
        await exportHTML(successfulImages);
      } else if (exportFormat === 'ppt') {
        await exportPPT(successfulImages);
      }

      // 显示成功消息
      if (failedCount === 0) {
        // 所有图片都成功，可以显示成功消息（如果需要）
      } else {
        alert(
          `导出完成，但 ${failedCount} 张图片转换失败，已导出 ${successfulImages.length} 张图片`,
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(translate('slideShow.export.failed', { error: String(error) }));
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  }, [
    filteredImages,
    exportFormat,
    imageUrlToBase64,
    exportHTML,
    exportPPT,
    translate,
  ]);

  if (!isOpen) return null;

  if (filteredImages.length === 0) {
    return (
      <div className="slide-show-player">
        <button
          onClick={onClose}
          className="slide-show-close-button"
          title={translate('slideShow.close')}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="slide-show-no-images">
          <X className="slide-show-no-images-icon" />
          <p className="slide-show-no-images-text">
            {translate('slideShow.player.noImages')}
          </p>
        </div>
      </div>
    );
  }

  const currentImage = filteredImages[currentIndex];

  return (
    <>
      <div
        className={`slide-show-player ${isFullscreen ? 'fullscreen' : ''} ${embedded ? 'embedded' : ''}`}
        style={
          {
            '--transition-duration': `${config.transitionDuration}ms`,
          } as React.CSSProperties
        }
      >
        {/* 顶部按钮组 */}
        <div className="slide-show-top-buttons">
          {/* 图片列表按钮 */}
          <button
            onClick={() => setShowImageList(!showImageList)}
            className={`slide-show-info-button ${
              showImageList ? 'active' : ''
            }`}
            title={translate('slideShow.player.imageList')}
          >
            <List className="w-5 h-5" />
          </button>

          {/* 图片信息按钮 */}
          <button
            onClick={() => setShowImageInfo(!showImageInfo)}
            className="slide-show-info-button"
            title={translate('slideShow.player.imageInfo')}
          >
            <Info className="w-5 h-5" />
          </button>

          {/* 全屏按钮（嵌入模式时显示） */}
          {embedded && (
            <button
              onClick={toggleFullscreen}
              className="slide-show-info-button"
              title={
                isFullscreen
                  ? translate('slideShow.exitFullscreen')
                  : translate('slideShow.fullscreen')
              }
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          )}

          {/* 关闭按钮（仅在非嵌入模式时显示） */}
          {!embedded && onClose && (
            <button
              onClick={onClose}
              className="slide-show-close-button"
              title={translate('slideShow.close')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 图片列表面板 */}
        {showImageList && (
          <div className="slide-show-image-list-panel">
            <div className="slide-show-image-list-panel-header">
              <div className="slide-show-image-list-title">
                {translate('slideShow.player.imageList')}
              </div>
              <button
                onClick={() => setShowImageList(false)}
                className="slide-show-image-list-close"
                title={translate('slideShow.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="slide-show-image-list-content" ref={imageListRef}>
              {filteredImages.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  ref={index === currentIndex ? currentImageItemRef : null}
                  className={`slide-show-image-list-item ${
                    index === currentIndex ? 'active' : ''
                  }`}
                  onClick={() => handleImageItemClick(index)}
                  title={image.name}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="slide-show-image-list-thumbnail"
                    loading="lazy"
                    onError={e => {
                      // 如果图片加载失败，显示占位符
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="slide-show-image-list-item-overlay">
                    <span className="slide-show-image-list-item-number">
                      {index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 图片信息面板 */}
        {showImageInfo && currentImage && (
          <div
            className={`slide-show-image-info-panel ${
              isImageInfoClosing ? 'slide-show-image-info-panel-closing' : ''
            }`}
          >
            <div className="slide-show-image-info-panel-header">
              <div className="slide-show-image-info-title">
                {translate('slideShow.player.imageInfo')}
              </div>
              <button
                onClick={handleCloseImageInfo}
                className="slide-show-image-info-close"
                title={translate('slideShow.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="slide-show-image-info-panel-content">
              <div className="slide-show-image-info-item">
                <span className="slide-show-image-info-label">
                  {translate('slideShow.player.imageName')}:
                </span>
                <span className="slide-show-image-info-value">
                  {currentImage.name}
                </span>
              </div>
              <div className="slide-show-image-info-item">
                <span className="slide-show-image-info-label">
                  {translate('slideShow.player.imageSize')}:
                </span>
                <span className="slide-show-image-info-value">
                  {(currentImage.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="slide-show-image-info-item">
                <span className="slide-show-image-info-label">
                  {translate('slideShow.player.imageDimensions')}:
                </span>
                <span className="slide-show-image-info-value">
                  {currentImage.width} × {currentImage.height}
                </span>
              </div>
              <div className="slide-show-image-info-item">
                <span className="slide-show-image-info-label">
                  {translate('slideShow.player.imageUrl')}:
                </span>
                <div className="slide-show-image-info-url-container">
                  <span className="slide-show-image-info-url-value">
                    {getRealGiteeUrl(currentImage.url)}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="slide-show-image-info-copy-button"
                    title={translate('slideShow.player.copyUrl')}
                  >
                    {urlCopied ? (
                      <span className="slide-show-image-info-copy-success">
                        {translate('slideShow.player.urlCopied')}
                      </span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="slide-show-image-info-item">
                <span className="slide-show-image-info-label">
                  {translate('slideShow.player.currentImage')}:
                </span>
                <span className="slide-show-image-info-value">
                  {translate('slideShow.player.totalImages', {
                    total: filteredImages.length,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 图片容器 */}
        <div
          className={`slide-show-image-container ${
            showImageList ? 'with-image-list' : ''
          }`}
        >
          <div className="slide-show-image-wrapper">
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className={`slide-show-current-image ${getTransitionClass(
                config.transitionEffect,
              )}`}
              style={{
                opacity:
                  transitioning && config.transitionEffect === 'fade' ? 0 : 1,
                transform:
                  config.transitionEffect === 'zoom'
                    ? transitioning
                      ? 'scale(0.8)'
                      : 'scale(1)'
                    : config.transitionEffect === 'slide'
                      ? transitioning
                        ? 'translateX(-100%)'
                        : 'translateX(0)'
                      : config.transitionEffect === 'rotate'
                        ? transitioning
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)'
                        : 'none',
                filter:
                  config.transitionEffect === 'blur'
                    ? transitioning
                      ? 'blur(10px)'
                      : 'blur(0)'
                    : 'none',
              }}
            />
          </div>
        </div>

        {/* 控制栏 */}
        <div className="slide-show-controls">
          {/* 进度条 */}
          {isPlaying && (
            <div className="slide-show-progress">
              <div
                className="slide-show-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* 控制按钮 */}
          <div className="slide-show-control-buttons">
            {isPlaying && !isPaused ? (
              <button
                onClick={handlePause}
                className="slide-show-control-button"
                title={translate('slideShow.pause')}
              >
                <Pause className="w-4 h-4" />
                <span>{translate('slideShow.pause')}</span>
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="slide-show-control-button"
                title={translate('slideShow.play')}
              >
                <Play className="w-4 h-4" />
                <span>{translate('slideShow.play')}</span>
              </button>
            )}

            <button
              onClick={handleStop}
              className="slide-show-control-button"
              title={translate('slideShow.stop')}
            >
              <Square className="w-4 h-4" />
              <span>{translate('slideShow.stop')}</span>
            </button>

            <button
              onClick={playPrevious}
              className="slide-show-control-button"
              title={translate('slideShow.previous')}
              disabled={!config.loop && currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{translate('slideShow.previous')}</span>
            </button>

            <button
              onClick={playNext}
              className="slide-show-control-button"
              title={translate('slideShow.next')}
              disabled={
                !config.loop && currentIndex === filteredImages.length - 1
              }
            >
              <ChevronRight className="w-4 h-4" />
              <span>{translate('slideShow.next')}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="slide-show-control-button"
              title={
                isFullscreen
                  ? translate('slideShow.exitFullscreen')
                  : translate('slideShow.fullscreen')
              }
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
              <span>
                {isFullscreen
                  ? translate('slideShow.exitFullscreen')
                  : translate('slideShow.fullscreen')}
              </span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="slide-show-control-button"
              title={translate('slideShow.player.controls.settings')}
            >
              <Settings className="w-4 h-4" />
              <span>{translate('slideShow.player.controls.settings')}</span>
            </button>

            <button
              onClick={() => setShowExportDialog(true)}
              className="slide-show-control-button"
              title={translate('slideShow.player.controls.export')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
              <span>{translate('slideShow.player.controls.export')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 设置模态框 */}
      {showSettings && (
        <SlideShowSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          config={config}
          onConfigChange={setConfig}
          t={translate}
        />
      )}

      {/* 导出对话框 */}
      {showExportDialog && (
        <div className="slide-show-export-dialog-overlay">
          <div className="slide-show-export-dialog">
            <div className="slide-show-export-dialog-header">
              <h3>{translate('slideShow.export.title')}</h3>
              <button
                onClick={() => setShowExportDialog(false)}
                className="slide-show-export-dialog-close"
                disabled={isExporting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="slide-show-export-dialog-content">
              <div className="slide-show-export-format-group">
                <label>{translate('slideShow.export.format')}</label>
                <div className="slide-show-export-format-options">
                  <label className="slide-show-export-format-option">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="html"
                      checked={exportFormat === 'html'}
                      onChange={e =>
                        setExportFormat(e.target.value as 'html' | 'ppt')
                      }
                      disabled={isExporting}
                    />
                    <span>{translate('slideShow.export.formatHTML')}</span>
                  </label>
                  <label className="slide-show-export-format-option">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="ppt"
                      checked={exportFormat === 'ppt'}
                      onChange={e =>
                        setExportFormat(e.target.value as 'html' | 'ppt')
                      }
                      disabled={isExporting}
                    />
                    <span>{translate('slideShow.export.formatPPT')}</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="slide-show-export-dialog-footer">
              <button
                onClick={() => setShowExportDialog(false)}
                className="slide-show-export-dialog-button cancel"
                disabled={isExporting}
              >
                {translate('slideShow.export.cancel')}
              </button>
              <button
                onClick={handleExport}
                className="slide-show-export-dialog-button primary"
                disabled={isExporting}
              >
                {isExporting
                  ? translate('slideShow.export.exporting')
                  : translate('slideShow.export.export')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SlideShowPlayer;

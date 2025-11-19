import { ImageItem, defaultTranslate, slideShowLocales } from '../../index';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
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

interface SlideShowPlayerProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 图片列表 */
  images: ImageItem[];
  /** 翻译函数 */
  t?: (key: string) => string;
}

const SlideShowPlayer: React.FC<SlideShowPlayerProps> = ({
  isOpen,
  onClose,
  images,
  t,
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
    DEFAULT_SLIDE_SHOW_CONFIG
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showImageInfo, setShowImageInfo] = useState(false);

  // 播放状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  // 过渡效果状态
  const [transitioning, setTransitioning] = useState(false);
  const [nextIndex, setNextIndex] = useState<number | null>(null);

  // 背景音乐
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // 定时器
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      setIsMusicPlaying(true);
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
      setIsMusicPlaying(false);
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
      setIsMusicPlaying(false);
    }
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

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
    }
  }, [isOpen, handleStop]);

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

  // 导出幻灯片
  const handleExport = useCallback(() => {
    if (filteredImages.length === 0) return;

    // 创建HTML内容
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
    const images = ${JSON.stringify(
      filteredImages.map(img => ({
        url: img.url,
        name: img.name,
        size: img.size,
        width: img.width,
        height: img.height,
      }))
    )};
    let currentIndex = 0;
    let isPlaying = ${config.autoPlay ? 'true' : 'false'};
    let intervalId = null;
    const interval = ${config.interval};

    function updateSlide() {
      const img = document.getElementById('slideImage');
      const info = document.getElementById('slideInfo');
      const counter = document.getElementById('slideCounter');

      if (images[currentIndex]) {
        img.src = images[currentIndex].url;
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
  }, [filteredImages, config.autoPlay, config.interval]);

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
        className={`slide-show-player ${isFullscreen ? 'fullscreen' : ''}`}
        style={
          {
            '--transition-duration': `${config.transitionDuration}ms`,
          } as React.CSSProperties
        }
      >
        {/* 顶部按钮组 */}
        <div className="slide-show-top-buttons">
          {/* 图片信息按钮 */}
          <button
            onClick={() => setShowImageInfo(!showImageInfo)}
            className="slide-show-info-button"
            title={translate('slideShow.player.imageInfo')}
          >
            <Info className="w-5 h-5" />
          </button>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="slide-show-close-button"
            title={translate('slideShow.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 图片信息面板 */}
        {showImageInfo && currentImage && (
          <div className="slide-show-image-info-panel">
            <div className="slide-show-image-info-panel-header">
              <div className="slide-show-image-info-title">
                {translate('slideShow.player.imageInfo')}
              </div>
              <button
                onClick={() => setShowImageInfo(false)}
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
        <div className="slide-show-image-container">
          <div className="slide-show-image-wrapper">
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className={`slide-show-current-image ${getTransitionClass(
                config.transitionEffect
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
              onClick={handleExport}
              className="slide-show-control-button"
              title={translate('slideShow.player.controls.export')}
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
    </>
  );
};

export default SlideShowPlayer;

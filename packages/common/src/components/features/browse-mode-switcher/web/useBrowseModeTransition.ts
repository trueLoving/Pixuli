import { useState, useCallback, useRef, useEffect } from 'react';
import type { BrowseMode } from './BrowseModeSwitcher';

export interface UseBrowseModeTransitionReturn {
  browseMode: BrowseMode;
  isTransitioning: boolean;
  fileModeClass: string;
  slideModeClass: string;
  handleBrowseModeChange: (newMode: BrowseMode) => void;
}

/**
 * 浏览模式切换动画 Hook
 * 提供平滑的模式切换动画效果
 */
export function useBrowseModeTransition(
  initialMode: BrowseMode = 'file',
): UseBrowseModeTransitionReturn {
  const [browseMode, setBrowseMode] = useState<BrowseMode>(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fileModeClass, setFileModeClass] = useState(
    'browse-mode-file-container',
  );
  const [slideModeClass, setSlideModeClass] = useState(
    'browse-mode-slide-container',
  );
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 清理所有定时器
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const handleBrowseModeChange = useCallback(
    (newMode: BrowseMode) => {
      if (newMode === browseMode || isTransitioning) return;

      setIsTransitioning(true);

      // 文件模式 -> 幻灯片模式
      if (browseMode === 'file' && newMode === 'slide') {
        // 先淡出文件模式
        setFileModeClass('browse-mode-file-container fade-out');
        // 300ms 后切换模式并淡入幻灯片
        const timeout1 = setTimeout(() => {
          setBrowseMode('slide');
          setSlideModeClass('browse-mode-slide-container fade-in');
          const timeout2 = setTimeout(() => {
            setIsTransitioning(false);
            setFileModeClass('browse-mode-file-container');
          }, 300);
          timeoutRefs.current.push(timeout2);
        }, 300);
        timeoutRefs.current.push(timeout1);
      }
      // 幻灯片模式 -> 文件模式
      else if (browseMode === 'slide' && newMode === 'file') {
        // 先淡出幻灯片
        setSlideModeClass('browse-mode-slide-container fade-out');
        // 300ms 后切换模式并淡入文件
        const timeout1 = setTimeout(() => {
          setBrowseMode('file');
          setFileModeClass('browse-mode-file-container fade-in');
          const timeout2 = setTimeout(() => {
            setIsTransitioning(false);
            setSlideModeClass('browse-mode-slide-container');
            setFileModeClass('browse-mode-file-container');
          }, 300);
          timeoutRefs.current.push(timeout2);
        }, 300);
        timeoutRefs.current.push(timeout1);
      }
      // 其他模式切换（无动画，直接切换）
      else {
        setBrowseMode(newMode);
        setIsTransitioning(false);
      }
    },
    [browseMode, isTransitioning],
  );

  return {
    browseMode,
    isTransitioning,
    fileModeClass,
    slideModeClass,
    handleBrowseModeChange,
  };
}

import { useState, useCallback } from 'react';
import type {
  BrowseMode,
  SidebarView,
  SidebarUtilityTool,
} from '@packages/common/src';
import { useImageStore } from '../stores/imageStore';

/**
 * UI 状态管理 hooks
 */
export function useUIState() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSourceTypeMenu, setShowSourceTypeMenu] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [browseMode, setBrowseMode] = useState<BrowseMode>('file');
  const [currentView, setCurrentView] = useState<SidebarView>('photos');
  const [currentUtilityTool, setCurrentUtilityTool] =
    useState<SidebarUtilityTool | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>('photos'); // 统一的菜单激活状态
  const [isFullscreenMode, setIsFullscreenMode] = useState(false); // 全屏模式状态（隐藏 Header 和 Sidebar）
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 浏览模式切换动画状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fileModeClass, setFileModeClass] = useState(
    'browse-mode-file-container',
  );
  const [slideModeClass, setSlideModeClass] = useState(
    'browse-mode-slide-container',
  );

  const handleOpenConfigModal = useCallback(() => {
    setShowConfigModal(true);
  }, []);

  const handleCloseConfigModal = useCallback(() => {
    setShowConfigModal(false);
    setEditingSourceId(null);
  }, []);

  const handleOpenKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(true);
  }, []);

  const handleCloseKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(false);
  }, []);

  const handleOpenVersionInfo = useCallback(() => {
    setShowVersionInfo(true);
  }, []);

  const handleCloseVersionInfo = useCallback(() => {
    setShowVersionInfo(false);
  }, []);

  const handleAddSource = useCallback(() => {
    setShowSourceTypeMenu(true);
  }, []);

  const handleSelectSourceType = useCallback((type: 'github' | 'gitee') => {
    setEditingSourceId(null);
    useImageStore.setState({ storageType: type });
    setShowSourceTypeMenu(false);
    setShowConfigModal(true);
  }, []);

  const handleCloseSourceTypeMenu = useCallback(() => {
    setShowSourceTypeMenu(false);
  }, []);

  // 处理浏览模式切换（带动画）
  const handleBrowseModeChange = useCallback(
    (newMode: BrowseMode) => {
      if (newMode === browseMode || isTransitioning) return;

      setIsTransitioning(true);

      // 文件模式 -> 幻灯片模式
      if (browseMode === 'file' && newMode === 'slide') {
        // 先淡出文件模式
        setFileModeClass('browse-mode-file-container fade-out');
        // 300ms 后切换模式并淡入幻灯片
        setTimeout(() => {
          setBrowseMode('slide');
          setSlideModeClass('browse-mode-slide-container fade-in');
          setTimeout(() => {
            setIsTransitioning(false);
            setFileModeClass('browse-mode-file-container');
          }, 300);
        }, 300);
      }
      // 幻灯片模式 -> 文件模式
      else if (browseMode === 'slide' && newMode === 'file') {
        // 先淡出幻灯片
        setSlideModeClass('browse-mode-slide-container fade-out');
        // 300ms 后切换模式并淡入文件
        setTimeout(() => {
          setBrowseMode('file');
          setFileModeClass('browse-mode-file-container fade-in');
          setTimeout(() => {
            setIsTransitioning(false);
            setSlideModeClass('browse-mode-slide-container');
            setFileModeClass('browse-mode-file-container');
          }, 300);
        }, 300);
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
    // 状态
    showConfigModal,
    showSourceTypeMenu,
    editingSourceId,
    setEditingSourceId,
    showKeyboardHelp,
    showVersionInfo,
    browseMode,
    setBrowseMode,
    currentView,
    setCurrentView,
    currentUtilityTool,
    setCurrentUtilityTool,
    activeMenu,
    setActiveMenu,
    isFullscreenMode,
    setIsFullscreenMode,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    // 动画相关
    isTransitioning,
    fileModeClass,
    slideModeClass,
    // 处理函数
    handleOpenConfigModal,
    handleCloseConfigModal,
    handleOpenKeyboardHelp,
    handleCloseKeyboardHelp,
    handleOpenVersionInfo,
    handleCloseVersionInfo,
    handleAddSource,
    handleSelectSourceType,
    handleCloseSourceTypeMenu,
    handleBrowseModeChange,
  };
}

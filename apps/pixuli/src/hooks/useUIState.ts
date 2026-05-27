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

  const handleBrowseModeChange = useCallback(
    (newMode: BrowseMode) => {
      if (newMode === browseMode) return;
      setBrowseMode(newMode);
    },
    [browseMode],
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

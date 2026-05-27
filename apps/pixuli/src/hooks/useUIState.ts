import { useState, useCallback } from 'react';
import type { SidebarView, SidebarUtilityTool } from '@packages/common/src';
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
  const [currentView, setCurrentView] = useState<SidebarView>('photos');
  const [currentUtilityTool, setCurrentUtilityTool] =
    useState<SidebarUtilityTool | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>('photos');
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  return {
    showConfigModal,
    showSourceTypeMenu,
    editingSourceId,
    setEditingSourceId,
    showKeyboardHelp,
    showVersionInfo,
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
    handleOpenConfigModal,
    handleCloseConfigModal,
    handleOpenKeyboardHelp,
    handleCloseKeyboardHelp,
    handleOpenVersionInfo,
    handleCloseVersionInfo,
    handleAddSource,
    handleSelectSourceType,
    handleCloseSourceTypeMenu,
  };
}

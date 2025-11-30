import { useState, useCallback } from 'react';
import type {
  BrowseMode,
  SidebarView,
  SidebarFilter,
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
  const [currentFilter, setCurrentFilter] = useState<SidebarFilter>('all');
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
    currentFilter,
    setCurrentFilter,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sidebarCollapsed,
    setSidebarCollapsed,
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
  };
}

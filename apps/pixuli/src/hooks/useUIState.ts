import { useState, useCallback } from 'react';
import type { SidebarView, SidebarUtilityTool } from '@pixuli/ui';
import { useUIStore } from '../stores/uiStore';

/**
 * UI 状态管理 hooks（遗留；主应用已迁移至 useUIStore）
 */
export function useUIState() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
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

  const handleOpenOperationLog = useCallback(() => {
    useUIStore.getState().openOperationLog();
  }, []);

  const handleCloseOperationLog = useCallback(() => {
    useUIStore.getState().closeSettingsModal();
  }, []);

  const handleAddSource = useCallback(() => {
    useUIStore.getState().openSettingsModalForAddSource();
  }, []);

  const handleOpenKeyboardHelp = useCallback(() => {
    useUIStore.getState().openKeyboardHelp();
  }, []);

  const handleOpenVersionInfo = useCallback(() => {
    useUIStore.getState().openVersionInfo();
  }, []);

  return {
    showConfigModal,
    editingSourceId,
    setEditingSourceId,
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
    handleOpenOperationLog,
    handleCloseOperationLog,
    handleAddSource,
    handleOpenKeyboardHelp,
    handleOpenVersionInfo,
  };
}

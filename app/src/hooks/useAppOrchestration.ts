import { useImageStore } from '@/features/library/imageStore';
import type { SidebarSourceItem } from '@/features/settings/sidebarSourceTypes';
import { useSelectedSourceSync } from '@/features/settings/useSelectedSourceSync';
import { useSourceManagement } from '@/features/settings/useSourceManagement';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useWorkspaceBindingSync } from '@/features/workspace/useWorkspaceBindingSync';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import {
  useAppInitialization,
  useCapacitorBackButton,
  useKeyboardShortcuts,
} from '@/hooks';
import { useI18n } from '@/i18n/useI18n';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useUIStore } from '@/stores/uiStore';
import { useCallback, useEffect, useMemo } from 'react';

export type AppMainLayoutProps = {
  sidebarSources: SidebarSourceItem[];
  selectedSourceId: string | null;
  onSourceSelect: (sourceId: string) => void;
  onSourceEdit: (sourceId: string) => void;
  onSourceDelete: (sourceId: string) => void;
  hasConfig: boolean;
  onAddSource: () => void;
};

export type AppRoutesOrchestrationProps = {
  isFullscreenMode: boolean;
  setIsFullscreenMode: (isFullscreen: boolean) => void;
};

/** App 壳层编排：workspace init、源/配置、快捷键与同步 */
export function useAppOrchestration(): {
  mainLayoutProps: AppMainLayoutProps;
  routesProps: AppRoutesOrchestrationProps;
} {
  const { t } = useI18n();
  const { loadImages } = useImageStore();
  const initializeWorkspace = useWorkspaceStore(state => state.initialize);
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const { sources, selectedSourceId } = useSourceStore();

  useEffect(() => {
    if (!isWorkspaceAvailable()) {
      return;
    }
    void initializeWorkspace().then(() => {
      if (useWorkspaceStore.getState().isLocalActive()) {
        void loadImages();
      }
    });
  }, [initializeWorkspace, loadImages]);

  const {
    showSettingsModal,
    isFullscreenMode,
    setIsFullscreenMode,
    openConfigModal,
    closeSettingsModal,
    openSettingsModalForAddSource,
    openConfigModalForEdit,
    openOperationLog,
  } = useUIStore();

  const sourceManagement = useSourceManagement();
  const {
    selectedSource,
    sidebarSources,
    handleDeleteSource,
    handleSourceSelect,
  } = sourceManagement;

  const hasConfig = isWorkspaceAvailable() ? localActive : sources.length > 0;

  const handleLoadImages = useCallback(async () => {
    try {
      await loadImages();
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, [loadImages]);

  const handleEditSourceWithId = useMemo(
    () => (sourceId: string) => {
      openConfigModalForEdit(sourceId);
    },
    [openConfigModalForEdit],
  );

  const handleDeleteSourceWithT = useMemo(
    () => (sourceId: string) => {
      handleDeleteSource(sourceId, t);
    },
    [handleDeleteSource, t],
  );

  useSelectedSourceSync(selectedSource ?? null, () => {
    if (isWorkspaceAvailable()) {
      return;
    }
    if (sources.length > 0 && selectedSource) {
      void handleLoadImages();
    }
  });

  useWorkspaceBindingSync();
  useAppInitialization(hasConfig, handleLoadImages);
  useCapacitorBackButton();
  useKeyboardShortcuts(
    t,
    showSettingsModal,
    closeSettingsModal,
    openOperationLog,
    handleLoadImages,
    openConfigModal,
  );

  return {
    mainLayoutProps: {
      sidebarSources,
      selectedSourceId,
      onSourceSelect: handleSourceSelect,
      onSourceEdit: handleEditSourceWithId,
      onSourceDelete: handleDeleteSourceWithT,
      hasConfig,
      onAddSource: openSettingsModalForAddSource,
    },
    routesProps: {
      isFullscreenMode,
      setIsFullscreenMode,
    },
  };
}

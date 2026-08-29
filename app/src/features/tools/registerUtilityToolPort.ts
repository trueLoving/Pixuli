import { useUIStore } from '@/stores/uiStore';
import { registerUtilityToolPort } from '@/features/tools/utilityToolPort';

registerUtilityToolPort({
  openUtilityTool(tool) {
    useUIStore.getState().setCurrentUtilityTool(tool);
    useUIStore.getState().setCurrentView('library');
    useUIStore.getState().setActiveMenu(tool);
  },
  getCurrentTool() {
    return useUIStore.getState().currentUtilityTool;
  },
});

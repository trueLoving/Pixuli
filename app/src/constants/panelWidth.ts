/** 三栏面板宽度（px）— 与 uiStore / usePanelResize 共用，避免 store 依赖 hook 模块 */

export function clampPanelWidth(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export const EXPLORER_WIDTH_DEFAULT = 224;
export const EXPLORER_WIDTH_MIN = 192;
export const EXPLORER_WIDTH_MAX = 480;

export const INSPECTOR_WIDTH_DEFAULT = 320;
export const INSPECTOR_WIDTH_MIN = 280;
export const INSPECTOR_WIDTH_MAX = 480;

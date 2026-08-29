export type UtilityToolId = 'compress' | 'convert';

/** inspector / library / 侧栏 → tools overlay：打开增强工具（避免跨域直接写 uiStore） */
export interface UtilityToolPort {
  openUtilityTool(tool: UtilityToolId): void;
  getCurrentTool(): UtilityToolId | null;
}

const inactivePort: UtilityToolPort = {
  openUtilityTool: () => undefined,
  getCurrentTool: () => null,
};

let utilityToolPort: UtilityToolPort | null = null;

export function registerUtilityToolPort(port: UtilityToolPort): void {
  utilityToolPort = port;
}

export function getUtilityToolPort(): UtilityToolPort {
  return utilityToolPort ?? inactivePort;
}

export function openUtilityTool(tool: UtilityToolId): void {
  getUtilityToolPort().openUtilityTool(tool);
}

export function getCurrentUtilityTool(): UtilityToolId | null {
  return getUtilityToolPort().getCurrentTool();
}

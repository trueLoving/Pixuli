import { registerLanShareHandlers } from './lanShareService';
import { registerPluginHandlers } from './pluginsService';
import { registerWorkspaceHandlers } from './workspaceService';

export function registerServiceHandlers() {
  registerWorkspaceHandlers();
  registerLanShareHandlers();
  registerPluginHandlers();
}

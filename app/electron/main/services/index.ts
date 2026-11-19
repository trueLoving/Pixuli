import { registerLanShareHandlers } from './lanShareService';
import { registerWorkspaceHandlers } from './workspaceService';

export function registerServiceHandlers() {
  registerWorkspaceHandlers();
  registerLanShareHandlers();
}

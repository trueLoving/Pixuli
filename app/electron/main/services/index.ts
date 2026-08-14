import { registerAiHandlers } from './aiService';
import { registerFileHandlers } from './fileService';
import { registerWorkspaceHandlers } from './workspaceService';

export function registerServiceHandlers() {
  registerAiHandlers();
  registerFileHandlers();
  registerWorkspaceHandlers();
}

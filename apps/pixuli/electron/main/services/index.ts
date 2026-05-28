import { registerAiHandlers } from './aiService';
import { registerFileHandlers } from './fileService';

export function registerServiceHandlers() {
  registerAiHandlers();
  registerFileHandlers();
}

import { registerAiHandlers } from './aiService';
import { registerFileHandlers } from './fileService';
import { registerPixuliHandlers } from './pixuliService';

export function registerServiceHandlers() {
  registerAiHandlers();
  registerFileHandlers();
  registerPixuliHandlers();
}

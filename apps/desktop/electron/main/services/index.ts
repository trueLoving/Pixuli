import { registerAiHandlers } from './aiService';
import { registerFileHandlers } from './fileService';
import { registerPixuliHandlers } from './pixuliService';
import { registerWasmHandlers } from './wasmService';

export function registerServiceHandlers() {
  // Initialize AI handlers
  registerAiHandlers();

  // Initialize File service
  registerFileHandlers();

  // Initialize Pixuli service
  registerPixuliHandlers();

  // Initialize WASM handlers
  registerWasmHandlers();
}

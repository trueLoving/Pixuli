import { registerAiHandlers } from './aiService';
import { registerFileHandlers } from './fileService';
import { registerPixuliHandlers } from './pixuliService';
// TODO: 暂时移除 WASM 依赖，等稳定后再开放使用
// import { registerWasmHandlers } from './wasmService';

export function registerServiceHandlers() {
  // Initialize AI handlers
  registerAiHandlers();

  // Initialize File service
  registerFileHandlers();

  // Initialize Pixuli service
  registerPixuliHandlers();

  // TODO: 暂时移除 WASM handlers，等稳定后再开放使用
  // Initialize WASM handlers
  // registerWasmHandlers();
}

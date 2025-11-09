import { registerAiHandlers } from './aiService';
import { registerFileHandlers } from './fileService';
import { registerGithubHandlers } from './githubService';
import { registerPixuliHandlers } from './pixuliService';
import { registerUpyunHandlers } from './upyunService';
import { registerWasmHandlers } from './wasmService';

export function registerServiceHandlers() {
  // Initialize AI handlers
  registerAiHandlers();

  // Initialize File service
  registerFileHandlers();

  // Initialize GitHub service
  registerGithubHandlers();

  // Initialize Pixuli service
  registerPixuliHandlers();

  // Initialize Upyun service
  registerUpyunHandlers();

  // Initialize WASM handlers
  registerWasmHandlers();
}

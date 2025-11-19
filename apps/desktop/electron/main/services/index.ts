import { registerAiHandlers } from './aiService';
import { registerFileHandlers } from './fileService';
import { registerGiteeHandlers } from './giteeService';
import { registerGithubHandlers } from './githubService';
import { registerPixuliHandlers } from './pixuliService';
import { registerWasmHandlers } from './wasmService';

export function registerServiceHandlers() {
  // Initialize AI handlers
  registerAiHandlers();

  // Initialize File service
  registerFileHandlers();

  // Initialize GitHub service
  registerGithubHandlers();

  // Initialize Gitee service
  registerGiteeHandlers();

  // Initialize Pixuli service
  registerPixuliHandlers();

  // Initialize WASM handlers
  registerWasmHandlers();
}

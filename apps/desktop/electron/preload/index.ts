import { contextBridge, ipcRenderer } from 'electron';
import { loading } from './loading';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});

// --------- Expose WASM API to the Renderer process ---------
contextBridge.exposeInMainWorld('wasmAPI', {
  plus100: (input: number) => ipcRenderer.invoke('wasm:plus100', input),
  compressToWebp: (imageData: number[], options?: any) =>
    ipcRenderer.invoke('wasm:compress-to-webp', imageData, options),
  batchCompressToWebp: (imagesData: number[][], options?: any) =>
    ipcRenderer.invoke('wasm:batch-compress-to-webp', imagesData, options),
  getImageInfo: (imageData: number[]) =>
    ipcRenderer.invoke('wasm:get-image-info', imageData),
  convertImageFormat: (imageData: number[], options: any) =>
    ipcRenderer.invoke('wasm:convert-image-format', imageData, options),
  batchConvertImageFormat: (imagesData: number[][], options: any) =>
    ipcRenderer.invoke('wasm:batch-convert-image-format', imagesData, options),
  // AI 分析功能
  analyzeImage: (imageData: number[], options?: any) =>
    ipcRenderer.invoke('wasm:analyze-image', imageData, options),
  batchAnalyzeImages: (imagesData: number[][], options?: any) =>
    ipcRenderer.invoke('wasm:batch-analyze-images', imagesData, options),
  checkModelAvailability: (modelPath: string) =>
    ipcRenderer.invoke('wasm:check-model-availability', modelPath),
});

// --------- Expose AI API to the Renderer process ---------
contextBridge.exposeInMainWorld('aiAPI', {
  // Qwen LLM分析
  analyzeImageWithQwen: (request: any) =>
    ipcRenderer.invoke('ai:analyze-image-qwen', request),
  // Ollama 图片分析
  analyzeImageWithOllama: (request: any) =>
    ipcRenderer.invoke('ai:analyze-image-ollama', request),
  // Shimmy 图片分析
  analyzeImageWithShimmy: (request: any) =>
    ipcRenderer.invoke('ai:analyze-image-shimmy', request),
  // Qwen分析器检查
  checkQwenAnalyzer: () => ipcRenderer.invoke('ai:check-qwen-analyzer'),
  // Ollama 连接检查
  checkOllamaConnection: (baseUrl?: string) =>
    ipcRenderer.invoke('ai:check-ollama-connection', baseUrl),
  // 获取 Ollama 可用模型列表
  getOllamaModels: (baseUrl?: string) =>
    ipcRenderer.invoke('ai:get-ollama-models', baseUrl),
  // Shimmy 检查
  checkShimmy: (shimmyPath?: string) =>
    ipcRenderer.invoke('ai:check-shimmy', shimmyPath),
  // 选择 Qwen 模型文件
  selectModelFile: () => ipcRenderer.invoke('ai:select-model-file'),
});

// --------- Expose Clipboard API to the Renderer process ---------
contextBridge.exposeInMainWorld('clipboardAPI', {
  writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
  readText: () => ipcRenderer.invoke('clipboard:readText'),
});

// --------- Expose File API to the Renderer process ---------
contextBridge.exposeInMainWorld('fileAPI', {
  saveFile: (fileName: string, content: string, mimeType?: string) =>
    ipcRenderer.invoke('file:save', fileName, content, mimeType),
});

// --------- Expose Electron API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  onReceiveMessage: (callback: (message: string) => void) => {
    return ipcRenderer.on('main-process-message', (event, message) => {
      callback(message);
    });
  },
  saveFile: (fileName: string, content: string, mimeType?: string) =>
    ipcRenderer.invoke('file:save', fileName, content, mimeType),
});

// --------- Preload Loading Animation -------------------------
loading();

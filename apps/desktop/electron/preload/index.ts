import { contextBridge, ipcRenderer } from 'electron';
import { loading } from './loading';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
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

// --------- Expose Electron API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Github API
  githubUpload: (params: any) => ipcRenderer.invoke('github:upload', params),
  githubDelete: (params: any) => ipcRenderer.invoke('github:delete', params),
  githubGetList: (params: any) => ipcRenderer.invoke('github:getList', params),
  githubUpdateMetadata: (params: any) =>
    ipcRenderer.invoke('github:updateMetadata', params),
  githubSetAuth: (token: string) => ipcRenderer.invoke('github:setAuth', token),

  // Upyun API
  upyunUpload: (params: any) => ipcRenderer.invoke('upyun:upload', params),
  upyunDelete: (params: any) => ipcRenderer.invoke('upyun:delete', params),
  upyunGetList: (params: any) => ipcRenderer.invoke('upyun:list', params),
  upyunTest: (config: any) => ipcRenderer.invoke('upyun:test', config),
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
});

// --------- Preload Loading Animation -------------------------
loading();

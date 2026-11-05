import { contextBridge, ipcRenderer } from 'electron';
import { loading } from '../../src/boot/loading';

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

contextBridge.exposeInMainWorld('workspaceAPI', {
  getRoot: () => ipcRenderer.invoke('workspace:getRoot'),
  pickRoot: () => ipcRenderer.invoke('workspace:pickRoot'),
  setRoot: (rootPath: string) =>
    ipcRenderer.invoke('workspace:setRoot', rootPath),
  readFile: (relativePath: string) =>
    ipcRenderer.invoke('workspace:readFile', relativePath),
  writeFile: (relativePath: string, data: Uint8Array) =>
    ipcRenderer.invoke('workspace:writeFile', relativePath, data),
  deleteFile: (relativePath: string) =>
    ipcRenderer.invoke('workspace:deleteFile', relativePath),
  listFiles: (relativeDir: string, recursive?: boolean) =>
    ipcRenderer.invoke('workspace:listFiles', relativeDir, recursive),
  exists: (relativePath: string) =>
    ipcRenderer.invoke('workspace:exists', relativePath),
});

loading();

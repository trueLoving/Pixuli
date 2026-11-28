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

contextBridge.exposeInMainWorld('lanShareAPI', {
  getStatus: () => ipcRenderer.invoke('lanShare:getStatus'),
  start: (preferredPort?: number) =>
    ipcRenderer.invoke('lanShare:start', preferredPort),
  stop: () => ipcRenderer.invoke('lanShare:stop'),
  rotateToken: () => ipcRenderer.invoke('lanShare:rotateToken'),
  prepareLibrarySync: () => ipcRenderer.invoke('lanShare:prepareLibrarySync'),
});

contextBridge.exposeInMainWorld('pixuliDeepLink', {
  onOpen: (callback: (url: string) => void) => {
    const listener = (_event: unknown, url: string) => {
      if (typeof url === 'string') callback(url);
    };
    ipcRenderer.on('pixuli:deep-link', listener);
    return () => {
      ipcRenderer.off('pixuli:deep-link', listener);
    };
  },
  getPending: () =>
    ipcRenderer.invoke('pixuli:getPendingDeepLink') as Promise<string | null>,
});

contextBridge.exposeInMainWorld('pluginsAPI', {
  getRoot: () => ipcRenderer.invoke('plugins:getRoot'),
  discover: () => ipcRenderer.invoke('plugins:discover'),
  readText: (relativePath: string) =>
    ipcRenderer.invoke('plugins:readText', relativePath),
  installFromDirectory: () =>
    ipcRenderer.invoke('plugins:installFromDirectory'),
  uninstall: (pluginId: string) =>
    ipcRenderer.invoke('plugins:uninstall', pluginId),
});

loading();

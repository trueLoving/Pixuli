interface IpcRendererBridge {
  on(
    channel: string,
    listener: (event: unknown, ...args: unknown[]) => void,
  ): unknown;
  off(channel: string, ...args: unknown[]): unknown;
  send(channel: string, ...args: unknown[]): void;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
}

interface Window {
  ipcRenderer?: IpcRendererBridge;
}

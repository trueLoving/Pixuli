interface LanShareStatus {
  running: boolean;
  port: number | null;
  token: string | null;
  urls: string[];
  rootPath: string | null;
  readOnly: true;
}

interface LanShareStartResult {
  ok: boolean;
  status: LanShareStatus;
  error?: string;
}

interface LanShareLibrarySyncResult {
  ok: boolean;
  status: LanShareStatus;
  error?: string;
  ticketId?: string;
  itemCount?: number;
  /** 各网卡对应的 pixuli:// 一键同步深链（strategy=replace + 根目录） */
  deepLinks?: string[];
}

interface LanShareAPI {
  getStatus: () => Promise<LanShareStatus>;
  start: (preferredPort?: number) => Promise<LanShareStartResult>;
  stop: () => Promise<{ ok: boolean; status: LanShareStatus }>;
  rotateToken: () => Promise<{ ok: boolean; status: LanShareStatus }>;
  prepareLibrarySync: () => Promise<LanShareLibrarySyncResult>;
}

interface Window {
  lanShareAPI?: LanShareAPI;
}

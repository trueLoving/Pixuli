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

interface LanShareAPI {
  getStatus: () => Promise<LanShareStatus>;
  start: (preferredPort?: number) => Promise<LanShareStartResult>;
  stop: () => Promise<{ ok: boolean; status: LanShareStatus }>;
  rotateToken: () => Promise<{ ok: boolean; status: LanShareStatus }>;
}

interface Window {
  lanShareAPI?: LanShareAPI;
}

import type { StorageCapabilities } from '@pixuli/core/plugins';

/**
 * 规划中的连接器展示数据。不是已注册插件，禁止拿去 create()。
 * 能力位只用于画廊/访问面文案，接入真实 Provider 后应改走 manifest。
 */
export interface UpcomingConnector {
  id: string;
  name: string;
  capabilities: StorageCapabilities;
}

const baseCaps = {
  list: true,
  upload: true,
  delete: true,
  updateMetadata: true,
} as const;

export const UPCOMING_CONNECTORS: UpcomingConnector[] = [
  {
    id: 'onedrive',
    name: 'OneDrive',
    capabilities: {
      ...baseCaps,
      sync: true,
      shareLink: true,
      timedAccess: true,
    },
  },
  {
    id: 'gcs',
    name: 'Google Cloud',
    capabilities: {
      ...baseCaps,
      sync: true,
      publicUrl: true,
      timedAccess: true,
      maxUploadBytes: 5 * 1024 * 1024 * 1024,
    },
  },
];

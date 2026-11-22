import { create } from 'zustand';
import {
  isTransferImportStrategy,
  type TransferImportStrategy,
} from './importStrategy';

const TARGET_FOLDER_KEY = 'pixuli.transferImport.targetFolder';
const STRATEGY_KEY = 'pixuli.transferImport.strategy';

let pendingSeedFile: File | null = null;

export function takePendingTransferSeedFile(): File | null {
  const file = pendingSeedFile;
  pendingSeedFile = null;
  return file;
}

export function peekPendingTransferSeedFile(): File | null {
  return pendingSeedFile;
}

export interface OpenTransferImportOptions {
  sourceUrl?: string;
  file?: File | null;
  strategy?: TransferImportStrategy;
  targetFolder?: string;
  librarySync?: boolean;
}

interface TransferImportState {
  open: boolean;
  /** 从 Host 票据 URL 拉取 zip（深链） */
  sourceUrl: string | null;
  /** 深链/一键同步预填策略 */
  preferredStrategy: TransferImportStrategy | null;
  preferredTargetFolder: string | null;
  librarySync: boolean;
  requestId: number;
  openImport: (opts?: OpenTransferImportOptions) => void;
  closeImport: () => void;
}

export const useTransferImportStore = create<TransferImportState>(set => ({
  open: false,
  sourceUrl: null,
  preferredStrategy: null,
  preferredTargetFolder: null,
  librarySync: false,
  requestId: 0,
  openImport: (opts = {}) => {
    if (opts.file) {
      pendingSeedFile = opts.file;
    }
    set(state => ({
      open: true,
      sourceUrl: opts.sourceUrl?.trim() || null,
      preferredStrategy: opts.strategy ?? null,
      preferredTargetFolder:
        opts.targetFolder === undefined ? null : opts.targetFolder,
      librarySync: Boolean(opts.librarySync),
      requestId: state.requestId + 1,
    }));
  },
  closeImport: () => {
    pendingSeedFile = null;
    set({
      open: false,
      sourceUrl: null,
      preferredStrategy: null,
      preferredTargetFolder: null,
      librarySync: false,
    });
  },
}));

export function readRememberedImportFolder(): string | null {
  try {
    const raw = localStorage.getItem(TARGET_FOLDER_KEY);
    return raw == null ? null : raw;
  } catch {
    return null;
  }
}

export function rememberImportFolder(folder: string): void {
  try {
    localStorage.setItem(TARGET_FOLDER_KEY, folder);
  } catch {
    // ignore
  }
}

export function readRememberedImportStrategy(): TransferImportStrategy {
  try {
    const raw = localStorage.getItem(STRATEGY_KEY);
    if (raw && isTransferImportStrategy(raw)) return raw;
  } catch {
    // ignore
  }
  return 'skip';
}

export function rememberImportStrategy(strategy: TransferImportStrategy): void {
  try {
    localStorage.setItem(STRATEGY_KEY, strategy);
  } catch {
    // ignore
  }
}

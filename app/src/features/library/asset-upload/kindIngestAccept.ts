import {
  collectPreferredIngestSources,
  formatIngestAcceptTypesLabel,
  ingestAcceptToInputAttr,
  mergeKindIngestAccept,
  type KindIngestSource,
} from '@pixuli/core/kinds';
import { kindRegistry } from '@/kinds/registry';
import { resolveAvailableIngestSources } from './platformIngestCapabilities';

/** 当前已注册 Kind 合并后的 dropzone accept；无 ingest 则为 undefined */
export function getRegisteredKindIngestAccept():
  | Record<string, string[]>
  | undefined {
  return mergeKindIngestAccept(kindRegistry.listManifests());
}

export function getRegisteredKindIngestInputAttr(): string {
  return ingestAcceptToInputAttr(getRegisteredKindIngestAccept());
}

/** 由 Kind accept 推导的可读类型文案，如 `JPG · PNG · PDF · MP4` */
export function getRegisteredKindIngestTypesLabel(): string {
  return formatIngestAcceptTypesLabel(getRegisteredKindIngestAccept());
}

/** 各 Kind 声明的来源并集（尚未与平台取交） */
export function getRegisteredPreferredIngestSources(): KindIngestSource[] {
  return collectPreferredIngestSources(kindRegistry.listManifests());
}

/** 最终可展示的采集入口：Kind 声明 ∩ 当前平台能力 */
export function getAvailableIngestSources(): KindIngestSource[] {
  return resolveAvailableIngestSources(getRegisteredPreferredIngestSources());
}

/** 二次门禁：必须有 Kind handler match 才可入库 */
export function isFileAcceptedByRegisteredKinds(file: File): boolean {
  return Boolean(
    kindRegistry.matchHandler({
      name: file.name,
      mimeType: file.type || undefined,
    }),
  );
}

export function filterFilesAcceptedByRegisteredKinds(files: File[]): {
  accepted: File[];
  rejected: File[];
} {
  const accepted: File[] = [];
  const rejected: File[] = [];
  for (const file of files) {
    if (isFileAcceptedByRegisteredKinds(file)) {
      accepted.push(file);
    } else {
      rejected.push(file);
    }
  }
  return { accepted, rejected };
}

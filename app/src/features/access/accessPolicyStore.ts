import {
  decodeJson,
  encodeJson,
  WORKSPACE_PATHS,
  type WorkspaceAdapter,
} from '@pixuli/core/vault';

const STORAGE_KEY = 'pixuli.access.v1';

export type PublishedAccessRecord = {
  sourceId: string;
  tier: 'public';
};

type AccessPolicyMap = Record<string, PublishedAccessRecord>;

let adapter: WorkspaceAdapter | null = null;
let cache: AccessPolicyMap = {};

function isPolicyMap(value: unknown): value is AccessPolicyMap {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readLocalMap(): AccessPolicyMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return isPolicyMap(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function persist(): Promise<void> {
  if (adapter) {
    try {
      await adapter.writeFile(WORKSPACE_PATHS.access, encodeJson(cache));
      return;
    } catch {
      // fall through to localStorage
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota
  }
}

export async function hydrateAccessPolicy(
  next: WorkspaceAdapter | null,
): Promise<void> {
  adapter = next;
  if (!next) {
    cache = readLocalMap();
    return;
  }
  try {
    if (await next.exists(WORKSPACE_PATHS.access)) {
      const raw = await next.readFile(WORKSPACE_PATHS.access);
      const parsed = decodeJson<unknown>(raw);
      cache = isPolicyMap(parsed) ? parsed : {};
      return;
    }
  } catch {
    // ignore
  }
  cache = readLocalMap();
  if (Object.keys(cache).length > 0) {
    await persist();
  }
}

export function resetAccessPolicy(): void {
  adapter = null;
  cache = {};
}

export function getPublishedAccess(
  imageId: string,
): PublishedAccessRecord | null {
  return cache[imageId] ?? null;
}

export function isAssetPublished(imageId: string, sourceId: string): boolean {
  const record = getPublishedAccess(imageId);
  return record?.sourceId === sourceId && record.tier === 'public';
}

export function markAssetPublished(imageId: string, sourceId: string): void {
  cache = { ...cache, [imageId]: { sourceId, tier: 'public' } };
  void persist();
}

export function revokeAssetPublish(imageId: string): void {
  const next = { ...cache };
  delete next[imageId];
  cache = next;
  void persist();
}

export function listPublishedAccess(): Array<
  { imageId: string } & PublishedAccessRecord
> {
  return Object.entries(cache).map(([imageId, record]) => ({
    imageId,
    ...record,
  }));
}

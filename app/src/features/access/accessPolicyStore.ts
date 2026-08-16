const STORAGE_KEY = 'pixuli.access.v1';

export type PublishedAccessRecord = {
  sourceId: string;
  tier: 'public';
};

type AccessPolicyMap = Record<string, PublishedAccessRecord>;

function readMap(): AccessPolicyMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as AccessPolicyMap;
  } catch {
    return {};
  }
}

function writeMap(map: AccessPolicyMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

export function getPublishedAccess(
  imageId: string,
): PublishedAccessRecord | null {
  return readMap()[imageId] ?? null;
}

export function isAssetPublished(imageId: string, sourceId: string): boolean {
  const record = getPublishedAccess(imageId);
  return record?.sourceId === sourceId && record.tier === 'public';
}

export function markAssetPublished(imageId: string, sourceId: string): void {
  const map = readMap();
  map[imageId] = { sourceId, tier: 'public' };
  writeMap(map);
}

export function revokeAssetPublish(imageId: string): void {
  const map = readMap();
  delete map[imageId];
  writeMap(map);
}

export function listPublishedAccess(): Array<
  { imageId: string } & PublishedAccessRecord
> {
  return Object.entries(readMap()).map(([imageId, record]) => ({
    imageId,
    ...record,
  }));
}

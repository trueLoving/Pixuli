import type { StoredSourceEntry } from '@pixuli/core/sources';

export type ConnectionPurpose = 'backup' | 'defaultSync' | 'publishChannel';

export function getConnectionPurpose(
  source: StoredSourceEntry,
): ConnectionPurpose {
  const value = source.config.connectionPurpose;
  if (
    value === 'backup' ||
    value === 'defaultSync' ||
    value === 'publishChannel'
  ) {
    return value;
  }
  return 'defaultSync';
}

export function isPublishChannel(source: StoredSourceEntry): boolean {
  return getConnectionPurpose(source) !== 'backup';
}

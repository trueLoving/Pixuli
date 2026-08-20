import { describe, expect, it } from 'vitest';
import { buildSyncResultOutcome, formatSyncOutcome } from '../syncOutcome';

const t = (key: string, params?: Record<string, string | number>) => {
  const map: Record<string, string> = {
    'workspace.syncPushed': `pushed ${params?.count ?? 0}`,
    'workspace.syncPulled': `pulled ${params?.count ?? 0}`,
    'workspace.syncConflicts': `conflicts ${params?.count ?? 0}`,
    'workspace.syncNoChanges': 'no changes',
    'workspace.syncFailed': 'sync failed',
    'workspace.syncMessageJoin': ' · ',
  };
  return map[key] ?? key;
};

describe('syncOutcome', () => {
  it('formats composite success messages', () => {
    const outcome = buildSyncResultOutcome({
      pushed: 2,
      pulled: 1,
      conflicts: { length: 0 },
    });
    expect(formatSyncOutcome(t, outcome)).toBe('pushed 2 · pulled 1');
  });

  it('returns info when nothing changed', () => {
    const outcome = buildSyncResultOutcome({
      pushed: 0,
      pulled: 0,
      conflicts: { length: 0 },
    });
    expect(outcome.kind).toBe('info');
    expect(formatSyncOutcome(t, outcome)).toBe('no changes');
  });
});

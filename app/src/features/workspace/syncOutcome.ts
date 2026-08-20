export type SyncOutcomePart = {
  key: string;
  params?: Record<string, number>;
};

export type SyncRunOutcome = {
  kind: 'success' | 'info' | 'error';
  parts: SyncOutcomePart[];
  /** 引擎/网络等无 i18n 键时的原文 */
  rawMessage?: string;
};

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function formatSyncOutcome(
  t: TranslateFn,
  outcome: SyncRunOutcome,
): string {
  if (outcome.rawMessage) {
    return outcome.rawMessage;
  }
  if (outcome.parts.length === 0) {
    return t('workspace.syncFailed');
  }
  const joiner = t('workspace.syncMessageJoin');
  return outcome.parts.map(part => t(part.key, part.params)).join(joiner);
}

export function buildSyncResultOutcome(result: {
  pushed: number;
  pulled: number;
  conflicts: { length: number };
}): SyncRunOutcome {
  const parts: SyncOutcomePart[] = [];
  if (result.pushed > 0) {
    parts.push({
      key: 'workspace.syncPushed',
      params: { count: result.pushed },
    });
  }
  if (result.pulled > 0) {
    parts.push({
      key: 'workspace.syncPulled',
      params: { count: result.pulled },
    });
  }
  if (result.conflicts.length > 0) {
    parts.push({
      key: 'workspace.syncConflicts',
      params: { count: result.conflicts.length },
    });
  }
  if (parts.length === 0) {
    return { kind: 'info', parts: [{ key: 'workspace.syncNoChanges' }] };
  }
  const kind =
    result.conflicts.length > 0 && result.pushed === 0 && result.pulled === 0
      ? 'info'
      : 'success';
  return { kind, parts };
}

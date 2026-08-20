import toast from 'react-hot-toast';
import {
  showInfo,
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatSyncOutcome, type SyncRunOutcome } from './syncOutcome';

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

function loadingMessageKey(
  direction: 'pull' | 'push' | 'both',
): 'workspace.pulling' | 'workspace.pushing' | 'workspace.syncing' {
  if (direction === 'pull') return 'workspace.pulling';
  if (direction === 'push') return 'workspace.pushing';
  return 'workspace.syncing';
}

export function notifySyncOutcome(
  toastId: string | number,
  outcome: SyncRunOutcome,
  t: TranslateFn,
): void {
  const id = String(toastId);
  const message = formatSyncOutcome(t, outcome);

  if (outcome.kind === 'error') {
    updateLoadingToError(id, message);
    return;
  }

  if (outcome.kind === 'info') {
    toast.dismiss(id);
    showInfo(message);
    return;
  }

  updateLoadingToSuccess(id, message);
}

export async function runSyncWithFeedback(
  direction: 'pull' | 'push' | 'both',
  t: TranslateFn,
): Promise<SyncRunOutcome> {
  const loadingKey = loadingMessageKey(direction);
  const toastId = showLoading(t(loadingKey), {
    messageKey: loadingKey,
    getMessage: () => t(loadingKey),
  });

  try {
    const outcome = await useWorkspaceStore.getState().runSync(direction);
    notifySyncOutcome(toastId, outcome, t);
    return outcome;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('workspace.syncFailed');
    updateLoadingToError(String(toastId), message);
    return {
      kind: 'error',
      parts: [{ key: 'workspace.syncFailed' }],
      rawMessage: message,
    };
  }
}

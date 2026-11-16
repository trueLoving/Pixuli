import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  countSyncIgnoreMatches,
  normalizeSyncIgnorePatterns,
  readSyncIgnorePatterns,
  writeSyncIgnorePatterns,
} from '@pixuli/core/vault';
import { getWorkspaceVault } from '@/features/workspace/workspaceRuntime';
import { notifySyncIgnoreChanged } from '@/features/workspace/syncIgnoreUi';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { showError, showSuccess } from '@/ui/feedback/toast';

interface SettingsSyncIgnoreSectionProps {
  t: (key: string) => string;
}

export const SettingsSyncIgnoreSection: React.FC<
  SettingsSyncIgnoreSectionProps
> = ({ t }) => {
  const isLocalActive = useWorkspaceStore(state => state.isLocalActive);
  const localActive = isLocalActive();
  const [patterns, setPatterns] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const refreshMatchCount = useCallback(
    async (next: string[]) => {
      if (!localActive) {
        setMatchCount(0);
        return;
      }
      try {
        const vault = getWorkspaceVault();
        const entries = await vault.list();
        setMatchCount(
          countSyncIgnoreMatches(
            entries.map(entry => entry.relativePath),
            next,
          ),
        );
      } catch {
        setMatchCount(0);
      }
    },
    [localActive],
  );

  const loadPatterns = useCallback(async () => {
    if (!localActive) {
      setPatterns([]);
      setMatchCount(0);
      return;
    }
    setLoading(true);
    try {
      const vault = getWorkspaceVault();
      const next = await readSyncIgnorePatterns(vault.adapter);
      setPatterns(next);
      await refreshMatchCount(next);
    } catch {
      setPatterns([]);
      setMatchCount(0);
    } finally {
      setLoading(false);
    }
  }, [localActive, refreshMatchCount]);

  useEffect(() => {
    void loadPatterns();
  }, [loadPatterns]);

  const persist = async (next: string[]) => {
    if (!localActive) return;
    setSaving(true);
    try {
      const vault = getWorkspaceVault();
      const saved = await writeSyncIgnorePatterns(vault.adapter, next);
      setPatterns(saved);
      notifySyncIgnoreChanged();
      await refreshMatchCount(saved);
      showSuccess(t('settings.syncIgnore.saved'));
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : t('settings.syncIgnore.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const next = normalizeSyncIgnorePatterns([...patterns, draft]);
    if (next.length === patterns.length) {
      setDraft('');
      return;
    }
    setDraft('');
    void persist(next);
  };

  const handleRemove = (pattern: string) => {
    void persist(patterns.filter(item => item !== pattern));
  };

  if (!localActive) {
    return (
      <section className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-5">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.syncIgnore.title')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('settings.syncIgnore.needWorkspace')}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.syncIgnore.title')}
        </h3>
        <p className="text-xs text-gray-500">{t('settings.syncIgnore.hint')}</p>
        <p className="text-xs text-gray-500">
          {t('settings.syncIgnore.remoteNote')}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder={t('settings.syncIgnore.placeholder')}
          className="min-h-11 w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 md:min-h-0"
          disabled={loading || saving}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading || saving || !draft.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0"
        >
          <Plus size={16} />
          {t('settings.syncIgnore.add')}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-600">
        {t('settings.syncIgnore.matchCount').replace(
          '{count}',
          String(matchCount),
        )}
      </p>

      {patterns.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          {loading ? t('common.loading') : t('settings.syncIgnore.empty')}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {patterns.map(pattern => (
            <li
              key={pattern}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <code className="min-w-0 truncate text-xs text-gray-800">
                {pattern}
              </code>
              <button
                type="button"
                onClick={() => handleRemove(pattern)}
                disabled={saving}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 md:min-h-0 md:min-w-0"
                title={t('settings.syncIgnore.remove')}
                aria-label={t('settings.syncIgnore.remove')}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

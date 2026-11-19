import { Copy, RefreshCw, Share2, Wifi } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LanShareQrCode } from '@/features/lan-share/LanShareQrCode';
import { isDesktop } from '@/platforms/platform';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { showError, showSuccess } from '@/ui/feedback/toast';

interface SettingsLanSharePanelProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

function isLanShareAvailable(): boolean {
  return (
    isDesktop() && typeof window !== 'undefined' && Boolean(window.lanShareAPI)
  );
}

export const SettingsLanSharePanel: React.FC<SettingsLanSharePanelProps> = ({
  t,
}) => {
  const mode = useWorkspaceStore(state => state.mode);
  const workspaceLocalActive = isWorkspaceAvailable() && mode === 'local';
  const available = isLanShareAvailable();
  const [status, setStatus] = useState<LanShareStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>('');

  const refresh = useCallback(async () => {
    if (!window.lanShareAPI) {
      setStatus(null);
      return;
    }
    setStatus(await window.lanShareAPI.getStatus());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const urls = status?.urls ?? [];
    if (urls.length === 0) {
      setSelectedUrl('');
      return;
    }
    setSelectedUrl(prev => (prev && urls.includes(prev) ? prev : urls[0]));
  }, [status?.urls]);

  const qrUrl = useMemo(
    () => selectedUrl || status?.urls?.[0] || '',
    [selectedUrl, status?.urls],
  );

  const handleStart = async () => {
    if (!window.lanShareAPI) return;
    setBusy(true);
    try {
      const result = await window.lanShareAPI.start();
      setStatus(result.status);
      if (!result.ok) {
        showError(result.error || t('settings.lanShare.startFailed'));
        return;
      }
      showSuccess(t('settings.lanShare.started'));
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!window.lanShareAPI) return;
    setBusy(true);
    try {
      const result = await window.lanShareAPI.stop();
      setStatus(result.status);
      showSuccess(t('settings.lanShare.stopped'));
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = async () => {
    if (!window.lanShareAPI) return;
    setBusy(true);
    try {
      const result = await window.lanShareAPI.rotateToken();
      setStatus(result.status);
      if (result.ok) {
        showSuccess(t('settings.lanShare.tokenRotated'));
      }
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showSuccess(t('settings.lanShare.copied'));
    } catch {
      showError(t('settings.lanShare.copyFailed'));
    }
  };

  if (!available) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.lanShare.title')}
        </h3>
        <p className="text-sm text-gray-500">
          {t('settings.lanShare.desktopOnly')}
        </p>
      </div>
    );
  }

  if (!workspaceLocalActive) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('settings.lanShare.title')}
        </h3>
        <p className="text-sm text-gray-500">
          {t('settings.lanShare.needsLocal')}
        </p>
      </div>
    );
  }

  const running = Boolean(status?.running);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Wifi size={16} aria-hidden />
          {t('settings.lanShare.title')}
        </h3>
        <p className="text-sm text-gray-500">{t('settings.lanShare.hint')}</p>
        <p className="text-xs text-gray-400">
          {t('settings.lanShare.readOnlyNote')}
        </p>
        <p className="text-xs text-gray-400">
          {t('settings.lanShare.clientHint')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {running ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleStop()}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            {t('settings.lanShare.stop')}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleStart()}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[color:var(--pix-violet)] px-3 text-sm text-white hover:opacity-90 disabled:opacity-60"
          >
            <Share2 size={14} aria-hidden />
            {t('settings.lanShare.start')}
          </button>
        )}
        <button
          type="button"
          disabled={busy || !running}
          onClick={() => void handleRotate()}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={14} aria-hidden />
          {t('settings.lanShare.rotateToken')}
        </button>
      </div>

      {running && status ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">
              {t('settings.lanShare.statusRunning')}
            </span>
            {status.port != null ? ` · :${status.port}` : null}
          </div>
          {status.token ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500">
                {t('settings.lanShare.token')}
              </span>
              <code className="rounded bg-white px-2 py-0.5 font-mono text-gray-900">
                {status.token}
              </code>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[color:var(--pix-violet-deep)]"
                onClick={() => void copyText(status.token!)}
              >
                <Copy size={14} aria-hidden />
                {t('settings.lanShare.copy')}
              </button>
            </div>
          ) : null}
          {status.urls.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('settings.lanShare.noLanAddress')}
            </p>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 rounded-md bg-white p-3">
                <p className="text-sm font-medium text-gray-800">
                  {t('settings.lanShare.qrTitle')}
                </p>
                <p className="text-center text-xs text-gray-500">
                  {t('settings.lanShare.qrHint')}
                </p>
                {qrUrl ? <LanShareQrCode url={qrUrl} label={qrUrl} /> : null}
                {status.urls.length > 1 ? (
                  <label className="flex w-full flex-col gap-1 text-xs text-gray-600">
                    <span>{t('settings.lanShare.qrSelectUrl')}</span>
                    <select
                      className="min-h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900"
                      value={qrUrl}
                      onChange={event => setSelectedUrl(event.target.value)}
                    >
                      {status.urls.map(url => (
                        <option key={url} value={url}>
                          {url}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-800">
                  {t('settings.lanShare.urls')}
                </div>
                <ul className="space-y-2">
                  {status.urls.map(url => (
                    <li
                      key={url}
                      className="flex flex-wrap items-start gap-2 break-all rounded-md bg-white px-2 py-2 text-sm text-gray-800"
                    >
                      <span className="min-w-0 flex-1 font-mono text-xs">
                        {url}
                      </span>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center gap-1 text-[color:var(--pix-violet-deep)]"
                        onClick={() => void copyText(url)}
                      >
                        <Copy size={14} aria-hidden />
                        {t('settings.lanShare.copy')}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <p className="text-xs text-gray-500">
            {t('settings.lanShare.clientHint')}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {t('settings.lanShare.statusStopped')}
        </p>
      )}
    </div>
  );
};

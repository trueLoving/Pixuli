import type { ConnectionPurpose } from '@/features/source-type/connectionPurpose';
import React, { useState } from 'react';

export interface OneDriveFieldValues {
  clientId: string;
  accessToken: string;
  refreshToken: string;
  path: string;
  expiresAt?: number;
}
import {
  beginOneDriveLogin,
  oneDriveRedirectUri,
  readOneDriveClientId,
} from '@/features/settings/connection-wizard/onedriveOAuth';

interface OneDriveConnectionFieldsProps {
  purpose: ConnectionPurpose;
  editSourceId?: string | null;
  t: (key: string) => string;
  redirectTo?: (url: string) => void;
}

function text(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  const value = t(key);
  return value && value !== key ? value : fallback;
}

export const OneDriveConnectionFields: React.FC<
  OneDriveConnectionFieldsProps
> = ({ purpose, editSourceId = null, t, redirectTo }) => {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    const clientId = readOneDriveClientId();
    if (!clientId) {
      setMessage(
        text(
          t,
          'settings.onedrive.missingClient',
          '当前安装还没有配置 OneDrive 应用，暂时不能打开登录页。',
        ),
      );
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const url = await beginOneDriveLogin({
        clientId,
        redirectUri: oneDriveRedirectUri(),
        purpose,
        editSourceId,
      });
      if (redirectTo) {
        redirectTo(url);
      } else {
        window.location.assign(url);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '无法打开登录页');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700">
        {text(
          t,
          'settings.onedrive.loginHint',
          '打开 Microsoft 登录并同意授权后，会自动回到这里并取得访问权限。不需要填写应用 ID 或令牌。',
        )}
      </p>
      <button
        type="button"
        className="rounded-md pix-btn-primary px-3 py-1.5 text-sm disabled:opacity-40"
        disabled={busy}
        onClick={() => void login()}
      >
        {text(t, 'settings.onedrive.login', '使用 Microsoft 账号登录')}
      </button>
      {message ? <p className="text-xs text-gray-600">{message}</p> : null}
    </div>
  );
};

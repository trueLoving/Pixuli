import { showSuccess } from '@/ui/feedback/toast';
import { useSourceStore } from '@/features/settings/sourceStore';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { finishOneDriveRedirect } from '@/features/settings/connection-wizard/onedriveOAuth';

export const OneDriveOAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const addSource = useSourceStore(state => state.addSource);
  const updateSource = useSourceStore(state => state.updateSource);
  const setSelectedSourceId = useSourceStore(
    state => state.setSelectedSourceId,
  );
  const [message, setMessage] = useState('正在完成 OneDrive 登录…');

  useEffect(() => {
    let cancelled = false;
    void finishOneDriveRedirect(window.location.search).then(result => {
      if (cancelled) return;
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      const config = {
        accessToken: result.tokens.accessToken,
        path: 'Pixuli',
        clientId: result.clientId,
        connectionPurpose: result.purpose,
        ...(result.tokens.refreshToken
          ? { refreshToken: result.tokens.refreshToken }
          : {}),
        expiresAt: result.tokens.expiresAt,
      };
      if (result.editSourceId) {
        updateSource(result.editSourceId, { pluginId: 'onedrive', config });
      } else {
        const entry = addSource({
          pluginId: 'onedrive',
          label: 'OneDrive',
          config,
        });
        if (result.purpose === 'defaultSync') {
          setSelectedSourceId(entry.id);
        }
      }
      showSuccess('已连接 OneDrive');
      navigate('/library', { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [addSource, navigate, setSelectedSourceId, updateSource]);

  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-sm text-gray-700">{message}</p>
    </div>
  );
};

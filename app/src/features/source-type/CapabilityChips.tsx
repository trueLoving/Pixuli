import {
  listCapabilityFlags,
  type ManifestCapabilityFlag,
  type StorageCapabilities,
  type StoragePluginManifest,
} from '@pixuli/core/plugins';
import React from 'react';

const FLAG_I18N: Record<ManifestCapabilityFlag, string> = {
  sync: 'settings.capabilitySync',
  publicUrl: 'settings.capabilityPublicUrl',
  shareLink: 'settings.capabilityShareLink',
  timedAccess: 'settings.capabilityTimedAccess',
  largeFile: 'settings.capabilityLargeFile',
};

export const CapabilityChips: React.FC<{
  manifest?: StoragePluginManifest;
  capabilities?: StorageCapabilities;
  t: (key: string) => string;
  muted?: boolean;
}> = ({ manifest, capabilities, t, muted }) => {
  const flags = manifest
    ? listCapabilityFlags(manifest)
    : capabilities
      ? listCapabilityFlags(capabilities)
      : [];
  if (flags.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {flags.map(flag => (
        <span
          key={flag}
          className={
            muted
              ? 'rounded border border-dashed border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500'
              : 'rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700'
          }
        >
          {t(FLAG_I18N[flag])}
        </span>
      ))}
    </div>
  );
};

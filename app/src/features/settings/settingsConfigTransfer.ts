import { buildSettingsExport, parseSettingsImport } from '@pixuli/core/sources';
import { exportJsonFile } from '@/features/settings/exportJsonFile';
import { useSourceStore } from '@/features/settings/sourceStore';
import { syncSourceEntryToImageStore } from '@/features/settings/syncSourceRepoToImageStore';

export async function exportSettingsConfig(): Promise<
  'file' | 'clipboard' | 'empty'
> {
  const { sources, selectedSourceId } = useSourceStore.getState();
  if (sources.length === 0) {
    return 'empty';
  }
  const payload = buildSettingsExport({ sources, selectedSourceId });
  return exportJsonFile(
    'pixuli-settings.json',
    JSON.stringify(payload, null, 2),
  );
}

export function importSettingsConfigText(
  text: string,
): { count: number } | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = parseSettingsImport(data);
  if (!parsed) {
    return null;
  }
  useSourceStore
    .getState()
    .replaceSources(parsed.sources, parsed.selectedSourceId);
  const selectedId = useSourceStore.getState().selectedSourceId;
  const selected = selectedId
    ? useSourceStore.getState().getSourceById(selectedId)
    : undefined;
  if (selected) {
    syncSourceEntryToImageStore(selected);
  }
  return { count: parsed.sources.length };
}

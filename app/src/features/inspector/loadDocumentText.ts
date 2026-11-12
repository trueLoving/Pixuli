import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';

/** 本机优先读盘；远端/blob 走 fetch（避免仅有 blob 时无法取正文） */
export async function loadDocumentText(
  localPath: string | null | undefined,
  src: string | null,
): Promise<string> {
  const path = localPath?.trim();
  if (path && isWorkspaceAvailable()) {
    const bytes = await getWorkspaceAdapter().readFile(path);
    return new TextDecoder('utf-8').decode(bytes);
  }

  if (!src) {
    throw new Error('no document source');
  }

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

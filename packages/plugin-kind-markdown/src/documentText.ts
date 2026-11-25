export type DocumentReadFile = (path: string) => Promise<Uint8Array>;

/** 本机优先读盘；远端/blob 走 fetch */
export async function loadDocumentText(
  localPath: string | null | undefined,
  src: string | null,
  options: {
    readFile?: DocumentReadFile;
    isLocalAvailable?: () => boolean;
  } = {},
): Promise<string> {
  const path = localPath?.trim();
  const { readFile, isLocalAvailable } = options;
  if (path && readFile && isLocalAvailable?.()) {
    const bytes = await readFile(path);
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

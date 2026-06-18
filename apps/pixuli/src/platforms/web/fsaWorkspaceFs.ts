import { normalizeRelativePath } from './opfsWorkspaceFs';

const FSA_ROOT_PREFIX = 'fsa://';
const FSA_DB_NAME = 'pixuli-workspace-fsa';
const FSA_STORE = 'handles';
const FSA_DB_VERSION = 1;

export function formatFsaRootPath(workspaceId: string): string {
  return `${FSA_ROOT_PREFIX}${workspaceId}`;
}

export function parseFsaRootPath(rootPath: string): string | null {
  if (!rootPath.startsWith(FSA_ROOT_PREFIX)) {
    return null;
  }
  const id = rootPath.slice(FSA_ROOT_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.showDirectoryPicker === 'function'
  );
}

function openFsaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FSA_DB_NAME, FSA_DB_VERSION);
    request.onerror = () =>
      reject(request.error ?? new Error('IDB open failed'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FSA_STORE)) {
        db.createObjectStore(FSA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function storeFsaDirectoryHandle(
  workspaceId: string,
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openFsaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FSA_STORE, 'readwrite');
    tx.objectStore(FSA_STORE).put(handle, workspaceId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB put failed'));
  });
  db.close();
}

export async function loadFsaDirectoryHandle(
  workspaceId: string,
): Promise<FileSystemDirectoryHandle | null> {
  const db = await openFsaDb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>(
    (resolve, reject) => {
      const tx = db.transaction(FSA_STORE, 'readonly');
      const req = tx.objectStore(FSA_STORE).get(workspaceId);
      req.onsuccess = () =>
        resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error('IDB get failed'));
    },
  );
  db.close();
  return handle;
}

export async function ensureFsaPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const options = { mode: 'readwrite' as const };
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }
  return (await handle.requestPermission(options)) === 'granted';
}

async function resolveParentInDir(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  create: boolean,
): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
  const normalized = normalizeRelativePath(relativePath);
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Invalid file path');
  }
  const fileName = parts.pop()!;
  let dir = root;
  for (const segment of parts) {
    dir = await dir.getDirectoryHandle(segment, { create });
  }
  return { dir, name: fileName };
}

async function walkDirectory(
  dir: FileSystemDirectoryHandle,
  currentRel: string,
  recursive: boolean,
  results: string[],
): Promise<void> {
  for await (const [name, handle] of dir.entries()) {
    const rel = currentRel ? `${currentRel}/${name}` : name;
    if (handle.kind === 'file') {
      results.push(rel);
      continue;
    }
    if (handle.kind === 'directory') {
      if (recursive) {
        await walkDirectory(handle, rel, true, results);
      } else {
        results.push(rel);
      }
    }
  }
}

export async function fsaEnsureWorkspace(
  root: FileSystemDirectoryHandle,
): Promise<void> {
  await root.getDirectoryHandle('images', { create: true });
  await root.getDirectoryHandle('.pixuli', { create: true });
}

export async function fsaWriteFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  data: Uint8Array,
): Promise<void> {
  const { dir, name } = await resolveParentInDir(root, relativePath, true);
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

export async function fsaReadFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<Uint8Array> {
  const { dir, name } = await resolveParentInDir(root, relativePath, false);
  const handle = await dir.getFileHandle(name);
  const file = await handle.getFile();
  return new Uint8Array(await file.arrayBuffer());
}

export async function fsaDeleteFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<void> {
  const { dir, name } = await resolveParentInDir(root, relativePath, false);
  await dir.removeEntry(name);
}

export async function fsaExists(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<boolean> {
  try {
    const { dir, name } = await resolveParentInDir(root, relativePath, false);
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

export async function fsaListFiles(
  root: FileSystemDirectoryHandle,
  relativeDir: string,
  recursive: boolean,
): Promise<string[]> {
  const normalizedDir = normalizeRelativePath(relativeDir);

  let targetDir: FileSystemDirectoryHandle;
  let baseRel: string;

  if (!normalizedDir) {
    targetDir = root;
    baseRel = '';
  } else {
    try {
      targetDir = await root.getDirectoryHandle(normalizedDir, {
        create: false,
      });
      baseRel = normalizedDir.replace(/\/$/, '');
    } catch {
      return [];
    }
  }

  const results: string[] = [];
  await walkDirectory(targetDir, baseRel, recursive, results);
  return results.sort();
}

export async function pickFsaDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const granted = await ensureFsaPermission(handle);
    return granted ? handle : null;
  } catch {
    return null;
  }
}

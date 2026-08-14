const OPFS_ROOT_PREFIX = 'opfs://';

export function formatOpfsRootPath(workspaceId: string): string {
  return `${OPFS_ROOT_PREFIX}${workspaceId}`;
}

export function parseOpfsRootPath(rootPath: string): string | null {
  if (!rootPath.startsWith(OPFS_ROOT_PREFIX)) {
    return null;
  }
  const id = rootPath.slice(OPFS_ROOT_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

export function isOpfsSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function'
  );
}

export function normalizeRelativePath(path: string): string {
  return path.replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
  if (!isOpfsSupported()) {
    throw new Error('OPFS is not supported in this browser');
  }
  return navigator.storage.getDirectory();
}

async function getWorkspaceDir(
  workspaceId: string,
  options?: { create?: boolean },
): Promise<FileSystemDirectoryHandle> {
  const root = await getOpfsRoot();
  return root.getDirectoryHandle(workspaceId, {
    create: options?.create ?? false,
  });
}

async function resolveParentDir(
  workspaceId: string,
  relativePath: string,
  create: boolean,
): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
  const normalized = normalizeRelativePath(relativePath);
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Invalid file path');
  }
  const fileName = parts.pop()!;
  let dir = await getWorkspaceDir(workspaceId, { create });
  for (const segment of parts) {
    dir = await dir.getDirectoryHandle(segment, { create });
  }
  return { dir, name: fileName };
}

export async function opfsWriteFile(
  workspaceId: string,
  relativePath: string,
  data: Uint8Array,
): Promise<void> {
  const { dir, name } = await resolveParentDir(workspaceId, relativePath, true);
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(data as BufferSource);
  await writable.close();
}

export async function opfsReadFile(
  workspaceId: string,
  relativePath: string,
): Promise<Uint8Array> {
  const { dir, name } = await resolveParentDir(
    workspaceId,
    relativePath,
    false,
  );
  const handle = await dir.getFileHandle(name);
  const file = await handle.getFile();
  return new Uint8Array(await file.arrayBuffer());
}

export async function opfsDeleteFile(
  workspaceId: string,
  relativePath: string,
): Promise<void> {
  const { dir, name } = await resolveParentDir(
    workspaceId,
    relativePath,
    false,
  );
  await dir.removeEntry(name);
}

export async function opfsExists(
  workspaceId: string,
  relativePath: string,
): Promise<boolean> {
  try {
    const { dir, name } = await resolveParentDir(
      workspaceId,
      relativePath,
      false,
    );
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
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
        await walkDirectory(
          handle as FileSystemDirectoryHandle,
          rel,
          true,
          results,
        );
      } else {
        results.push(rel);
      }
    }
  }
}

export async function opfsListFiles(
  workspaceId: string,
  relativeDir: string,
  recursive: boolean,
): Promise<string[]> {
  const normalizedDir = normalizeRelativePath(relativeDir);
  const workspaceDir = await getWorkspaceDir(workspaceId, { create: false });

  let targetDir: FileSystemDirectoryHandle;
  let baseRel: string;

  if (!normalizedDir) {
    targetDir = workspaceDir;
    baseRel = '';
  } else {
    try {
      targetDir = await workspaceDir.getDirectoryHandle(normalizedDir, {
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

export async function opfsEnsureWorkspace(workspaceId: string): Promise<void> {
  const dir = await getWorkspaceDir(workspaceId, { create: true });
  await dir.getDirectoryHandle('images', { create: true });
  await dir.getDirectoryHandle('.pixuli', { create: true });
}

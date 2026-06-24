const MOBILE_ROOT_PREFIX = 'mobile://';
const WORKSPACES_DIR = 'workspaces';

export function formatMobileRootPath(workspaceId: string): string {
  return `${MOBILE_ROOT_PREFIX}${workspaceId}`;
}

export function parseMobileRootPath(rootPath: string): string | null {
  if (!rootPath.startsWith(MOBILE_ROOT_PREFIX)) {
    return null;
  }
  const id = rootPath.slice(MOBILE_ROOT_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

export function normalizeRelativePath(path: string): string {
  return path.replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

function workspaceBasePath(workspaceId: string): string {
  return `${WORKSPACES_DIR}/${workspaceId}`;
}

function toStoragePath(workspaceId: string, relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  return `${workspaceBasePath(workspaceId)}/${normalized}`;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getFilesystem() {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  return { Filesystem, Directory };
}

export async function mobileEnsureWorkspace(
  workspaceId: string,
): Promise<void> {
  const { Filesystem, Directory } = await getFilesystem();
  await Filesystem.mkdir({
    path: workspaceBasePath(workspaceId),
    directory: Directory.Data,
    recursive: true,
  });
}

export async function mobileWriteFile(
  workspaceId: string,
  relativePath: string,
  data: Uint8Array,
): Promise<void> {
  const { Filesystem, Directory } = await getFilesystem();
  const path = toStoragePath(workspaceId, relativePath);
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash > 0) {
    await Filesystem.mkdir({
      path: path.slice(0, lastSlash),
      directory: Directory.Data,
      recursive: true,
    });
  }
  await Filesystem.writeFile({
    path,
    directory: Directory.Data,
    data: uint8ArrayToBase64(data),
  });
}

export async function mobileReadFile(
  workspaceId: string,
  relativePath: string,
): Promise<Uint8Array> {
  const { Filesystem, Directory } = await getFilesystem();
  const result = await Filesystem.readFile({
    path: toStoragePath(workspaceId, relativePath),
    directory: Directory.Data,
  });
  return base64ToUint8Array(String(result.data));
}

export async function mobileDeleteFile(
  workspaceId: string,
  relativePath: string,
): Promise<void> {
  const { Filesystem, Directory } = await getFilesystem();
  await Filesystem.deleteFile({
    path: toStoragePath(workspaceId, relativePath),
    directory: Directory.Data,
  });
}

export async function mobileExists(
  workspaceId: string,
  relativePath: string,
): Promise<boolean> {
  const { Filesystem, Directory } = await getFilesystem();
  try {
    await Filesystem.stat({
      path: toStoragePath(workspaceId, relativePath),
      directory: Directory.Data,
    });
    return true;
  } catch {
    return false;
  }
}

async function listDirRecursive(
  workspaceId: string,
  relativeDir: string,
): Promise<string[]> {
  const { Filesystem, Directory } = await getFilesystem();
  const base = workspaceBasePath(workspaceId);
  const dirPath = relativeDir
    ? `${base}/${normalizeRelativePath(relativeDir)}`
    : base;

  const entries = await Filesystem.readdir({
    path: dirPath,
    directory: Directory.Data,
  });

  const paths: string[] = [];
  for (const entry of entries.files) {
    const entryRelative = relativeDir
      ? `${normalizeRelativePath(relativeDir)}/${entry.name}`
      : entry.name;
    if (entry.type === 'directory') {
      paths.push(...(await listDirRecursive(workspaceId, entryRelative)));
    } else {
      paths.push(normalizeRelativePath(entryRelative));
    }
  }
  return paths;
}

export async function mobileListFiles(
  workspaceId: string,
  relativeDir: string,
  options?: { recursive?: boolean },
): Promise<string[]> {
  const normalizedDir = normalizeRelativePath(relativeDir);

  if (options?.recursive) {
    return listDirRecursive(workspaceId, normalizedDir);
  }

  const { Filesystem, Directory } = await getFilesystem();
  const dirPath = normalizedDir
    ? `${workspaceBasePath(workspaceId)}/${normalizedDir}`
    : workspaceBasePath(workspaceId);

  const entries = await Filesystem.readdir({
    path: dirPath,
    directory: Directory.Data,
  });

  const prefix = normalizedDir ? `${normalizedDir}/` : '';
  return entries.files
    .filter(entry => entry.type === 'file')
    .map(entry => normalizeRelativePath(`${prefix}${entry.name}`))
    .sort();
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensureFsaPermission } from '../fsaWorkspaceFs';

function mockHandle(options: {
  query: PermissionState | (() => Promise<PermissionState>);
  request?: PermissionState | (() => Promise<PermissionState>);
}): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name: 'pics',
    queryPermission: vi.fn(async () =>
      typeof options.query === 'function' ? options.query() : options.query,
    ),
    requestPermission: vi.fn(async () => {
      if (options.request == null) {
        throw new Error('requestPermission should not be called');
      }
      return typeof options.request === 'function'
        ? options.request()
        : options.request;
    }),
  } as unknown as FileSystemDirectoryHandle;
}

describe('ensureFsaPermission', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when query already granted', async () => {
    const handle = mockHandle({ query: 'granted' });
    await expect(ensureFsaPermission(handle)).resolves.toBe(true);
    expect(handle.requestPermission).not.toHaveBeenCalled();
  });

  it('does not request without allowRequest (auto-restore path)', async () => {
    const handle = mockHandle({ query: 'prompt' });
    await expect(ensureFsaPermission(handle)).resolves.toBe(false);
    expect(handle.requestPermission).not.toHaveBeenCalled();
  });

  it('requests when allowRequest and user gesture path', async () => {
    const handle = mockHandle({ query: 'prompt', request: 'granted' });
    await expect(
      ensureFsaPermission(handle, { allowRequest: true }),
    ).resolves.toBe(true);
    expect(handle.requestPermission).toHaveBeenCalledOnce();
  });

  it('times out hanging queryPermission and returns false', async () => {
    vi.useFakeTimers();
    const handle = mockHandle({
      query: () => new Promise(() => undefined),
    });
    const pending = ensureFsaPermission(handle, { timeoutMs: 100 });
    await vi.advanceTimersByTimeAsync(150);
    await expect(pending).resolves.toBe(false);
  });
});

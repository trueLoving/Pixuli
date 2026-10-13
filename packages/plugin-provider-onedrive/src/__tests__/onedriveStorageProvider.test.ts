import { describe, expect, it, vi } from 'vitest';
import type { PlatformAdapter } from '@pixuli/core/platform';
import {
  OneDriveStorageProvider,
  workspacePathFromDriveItem,
} from '../onedriveStorageProvider';

const adapter: PlatformAdapter = {
  getImageDimensions: async () => ({ width: 8, height: 4 }),
  fileToBase64: async () => '',
  getFileSize: async () => 4,
  getMimeType: async () => 'image/jpeg',
};

function jsonResponse(status: number, data: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  } as Response;
}

function createProvider(fetchFn: typeof fetch) {
  const provider = new OneDriveStorageProvider({
    platform: 'web',
    platformAdapter: adapter,
    fetch: fetchFn,
  });
  provider.configure({
    accessToken: 'token',
    refreshToken: 'refresh',
    clientId: 'client',
    path: 'Pixuli',
  });
  return provider;
}

describe('workspacePathFromDriveItem', () => {
  it('strips the mount folder', () => {
    expect(
      workspacePathFromDriveItem(
        {
          name: 'a.jpg',
          parentReference: { path: '/drive/root:/Pixuli/images' },
        },
        'Pixuli',
      ),
    ).toBe('images/a.jpg');
  });
});

describe('OneDriveStorageProvider', () => {
  it('lists images under the mount folder and skips metadata directories', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/children')) {
        return jsonResponse(200, {
          value: [
            {
              id: 'file-1',
              name: 'a.jpg',
              size: 12,
              file: { mimeType: 'image/jpeg' },
              lastModifiedDateTime: '2026-01-02T00:00:00Z',
              createdDateTime: '2026-01-01T00:00:00Z',
              '@microsoft.graph.downloadUrl': 'https://download.example/a',
            },
            { name: '.metadata', folder: {} },
          ],
        });
      }
      if (url.includes('/content')) {
        return jsonResponse(404, { error: { message: 'not found' } });
      }
      throw new Error(`unexpected ${url}`);
    });

    const images = await createProvider(fetchFn).listImages();
    expect(images).toHaveLength(1);
    expect(images[0]?.storagePath).toBe('a.jpg');
    expect(images[0]?.url).toBe('https://download.example/a');
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain(
      '/me/drive/root:/Pixuli:/children',
    );
  });

  it('uploads bytes with a simple PUT and writes the directory manifest', async () => {
    const urls: string[] = [];
    const fetchFn = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        urls.push(`${method} ${url}`);
        if (method === 'PUT' && url.includes('/a.jpg:/content')) {
          return jsonResponse(200, {
            id: 'file-1',
            name: 'a.jpg',
            size: 4,
            '@microsoft.graph.downloadUrl': 'https://download.example/a',
          });
        }
        if (method === 'GET' && url.includes('manifest.json')) {
          return jsonResponse(404, {});
        }
        if (method === 'PUT' && url.includes('manifest.json')) {
          return jsonResponse(200, { id: 'manifest' });
        }
        throw new Error(`unexpected ${init?.method} ${url}`);
      },
    );

    const image = await createProvider(fetchFn).uploadImage({
      file: new File([new Uint8Array([1, 2, 3, 4])], 'a.jpg', {
        type: 'image/jpeg',
      }),
      storagePath: 'images/a.jpg',
      description: 'hello',
      tags: ['trip'],
    });

    expect(image.storagePath).toBe('images/a.jpg');
    expect(image.description).toBe('hello');
    expect(urls.some(url => url.includes('images/a.jpg:/content'))).toBe(true);
    expect(
      urls.some(url => url.startsWith('PUT ') && url.includes('manifest.json')),
    ).toBe(true);
  });

  it('deletes by path and treats 404 as success', async () => {
    const fetchFn = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? 'GET';
        if (method === 'DELETE') return jsonResponse(404, {});
        if (method === 'GET') return jsonResponse(404, {});
        if (method === 'PUT') return jsonResponse(200, { id: 'manifest' });
        throw new Error('unexpected');
      },
    );

    await expect(
      createProvider(fetchFn).deleteImage('images/a.jpg'),
    ).resolves.toBeUndefined();
  });

  it('pulls delta changes and keeps the delta link as cursor', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/delta')) {
        return jsonResponse(200, {
          value: [
            {
              id: 'file-1',
              name: 'a.jpg',
              size: 3,
              file: { mimeType: 'image/jpeg' },
              parentReference: { path: '/drive/root:/Pixuli' },
              eTag: 'etag-1',
              lastModifiedDateTime: '2026-02-01T00:00:00Z',
              '@microsoft.graph.downloadUrl': 'https://download.example/a',
            },
            {
              name: 'gone.jpg',
              deleted: { state: 'deleted' },
              parentReference: { path: '/drive/root:/Pixuli' },
            },
          ],
          '@odata.deltaLink': 'https://graph.microsoft.com/v1.0/delta-next',
        });
      }
      return jsonResponse(404, {});
    });

    const provider = createProvider(fetchFn);
    const pulled = await provider.syncPull();
    expect(pulled.nextCursor).toBe(
      'https://graph.microsoft.com/v1.0/delta-next',
    );
    expect(pulled.items.map(item => item.action)).toEqual(['add', 'delete']);
    expect(pulled.items[0]?.metadata?.url).toBe('https://download.example/a');
    expect(await provider.getSyncCursor()).toBe(pulled.nextCursor);

    await provider.syncPull({ since: pulled.nextCursor });
    expect(
      fetchFn.mock.calls.some(call => String(call[0]) === pulled.nextCursor),
    ).toBe(true);
  });

  it('refreshes the access token after 401 and retries', async () => {
    let childrenCalls = 0;
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/oauth2/v2.0/token')) {
        return jsonResponse(200, {
          access_token: 'new-token',
          refresh_token: 'refresh-2',
          expires_in: 3600,
        });
      }
      if (url.includes('/children')) {
        childrenCalls += 1;
        if (childrenCalls === 1) return jsonResponse(401, {});
        return jsonResponse(200, { value: [] });
      }
      throw new Error(`unexpected ${url}`);
    });

    await expect(createProvider(fetchFn).listImages()).resolves.toEqual([]);
    expect(childrenCalls).toBe(2);
  });

  it('pushes an upload and a delete in one directory manifest', async () => {
    const methods: string[] = [];
    const fetchFn = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        methods.push(`${init?.method ?? 'GET'} ${url}`);
        if ((init?.method ?? 'GET') === 'GET') return jsonResponse(404, {});
        if (init?.method === 'DELETE') return jsonResponse(204, {});
        return jsonResponse(200, { id: 'item' });
      },
    );

    await createProvider(fetchFn).syncPush([
      {
        localRelativePath: 'a.jpg',
        remotePath: 'a.jpg',
        action: 'upload',
        file: new Uint8Array([1, 2]),
        metadata: { name: 'a.jpg', description: 'n' },
      },
      {
        localRelativePath: 'b.jpg',
        remotePath: 'b.jpg',
        action: 'delete',
      },
    ]);

    expect(
      methods.some(line => line.startsWith('PUT ') && line.includes('a.jpg')),
    ).toBe(true);
    expect(
      methods.some(
        line => line.startsWith('DELETE ') && line.includes('b.jpg'),
      ),
    ).toBe(true);
    expect(
      methods.filter(
        line => line.includes('manifest.json') && line.startsWith('PUT '),
      ).length,
    ).toBe(1);
  });
});

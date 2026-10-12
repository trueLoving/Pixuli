import { describe, expect, it } from 'vitest';
import type { SyncPushItem } from '../../plugins/types';
import { createEmptyManifest } from '../../utils/metadataManifest';
import {
  commitSyncPush,
  listRepoImageBlobs,
  workspacePathFromRepoPath,
  type GitDataRequest,
  type GitDataTransport,
} from '../gitDataBatch';

function createTransport(routes: {
  onRequest: (req: GitDataRequest) => unknown;
}) {
  const calls: GitDataRequest[] = [];
  const transport: GitDataTransport = {
    request: async req => {
      calls.push(req);
      return routes.onRequest(req);
    },
  };
  return { transport, calls };
}

const repo = { owner: 'octo', repo: 'pix', branch: 'main' };

describe('gitDataBatch', () => {
  it('strips configRoot from repository paths', () => {
    expect(workspacePathFromRepoPath('root', 'root/images/a.jpg')).toBe(
      'images/a.jpg',
    );
    expect(workspacePathFromRepoPath('', 'images/a.jpg')).toBe('images/a.jpg');
    expect(workspacePathFromRepoPath('root', 'other/a.jpg')).toBeNull();
  });

  it('commits one tree for several files in the same directory', async () => {
    const items: SyncPushItem[] = [
      {
        localRelativePath: 'images/a.jpg',
        remotePath: 'images/a.jpg',
        action: 'upload',
        file: new Uint8Array([1]),
        metadata: { name: 'a.jpg', description: 'one' },
      },
      {
        localRelativePath: 'images/b.jpg',
        remotePath: 'images/b.jpg',
        action: 'metadata',
        metadata: { name: 'b.jpg', tags: ['x'] },
      },
    ];
    const { transport, calls } = createTransport({
      onRequest: req => {
        if (req.path.endsWith('/git/refs/heads/main') && req.method === 'GET') {
          return { object: { sha: 'commit-1' } };
        }
        if (req.path.endsWith('/git/commits/commit-1')) {
          return { tree: { sha: 'tree-1' } };
        }
        if (req.path.endsWith('/git/blobs')) {
          return { sha: `blob-${calls.length}` };
        }
        if (req.path.endsWith('/git/trees')) {
          return { sha: 'tree-2' };
        }
        if (req.path.endsWith('/git/commits') && req.method === 'POST') {
          return { sha: 'commit-2' };
        }
        if (req.method === 'PATCH') {
          return { object: { sha: 'commit-2' } };
        }
        throw new Error(`unexpected ${req.method} ${req.path}`);
      },
    });

    const committed = await commitSyncPush(transport, repo, items, {
      toRepoPath: path => `mount/${path}`,
      readManifest: async () => createEmptyManifest(),
      now: '2026-10-12T00:00:00.000Z',
    });

    expect(committed).toBe(true);
    const blobs = calls.filter(call => call.path.endsWith('/git/blobs'));
    expect(blobs).toHaveLength(2);
    const tree = calls.find(call => call.path.endsWith('/git/trees'));
    const treeBody = tree?.body as {
      base_tree: string;
      tree: Array<{ path: string; sha: string | null }>;
    };
    expect(treeBody.base_tree).toBe('tree-1');
    expect(treeBody.tree.map(entry => entry.path).sort()).toEqual([
      'mount/images/.metadata/manifest.json',
      'mount/images/a.jpg',
    ]);
    expect(calls.filter(call => call.method === 'PATCH')).toHaveLength(1);
    expect(calls.filter(call => call.path.includes('/contents/'))).toHaveLength(
      0,
    );
  });

  it('returns false when the branch does not exist yet', async () => {
    const { transport, calls } = createTransport({
      onRequest: () => {
        throw new Error('Not Found');
      },
    });
    const committed = await commitSyncPush(
      transport,
      repo,
      [
        {
          localRelativePath: 'images/a.jpg',
          remotePath: 'images/a.jpg',
          action: 'upload',
          file: new Uint8Array([1]),
        },
      ],
      {
        toRepoPath: path => path,
        readManifest: async () => createEmptyManifest(),
      },
    );
    expect(committed).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it('asks the caller to walk directories when the git tree is truncated', async () => {
    const { transport } = createTransport({
      onRequest: req => {
        if (req.path.includes('/git/refs/')) {
          return { object: { sha: 'commit-1' } };
        }
        if (req.path.includes('/git/commits/')) {
          return { tree: { sha: 'tree-1' } };
        }
        return { truncated: true, tree: [] };
      },
    });
    const listed = await listRepoImageBlobs(
      transport,
      { ...repo, configRoot: 'root' },
      name => name.endsWith('.jpg'),
    );
    expect(listed).toBeNull();
  });

  it('lists images from one recursive tree', async () => {
    const { transport } = createTransport({
      onRequest: req => {
        if (req.path.includes('/git/refs/')) {
          return { object: { sha: 'commit-1' } };
        }
        if (req.path.includes('/git/commits/')) {
          return { tree: { sha: 'tree-1' } };
        }
        return {
          truncated: false,
          tree: [
            {
              path: 'root/images/a.jpg',
              type: 'blob',
              sha: 'sha-a',
              size: 4,
            },
            {
              path: 'root/images/.metadata/manifest.json',
              type: 'blob',
              sha: 'sha-m',
              size: 2,
            },
            {
              path: 'root/.pixuli/index.json',
              type: 'blob',
              sha: 'sha-i',
              size: 2,
            },
            { path: 'root/notes.txt', type: 'blob', sha: 'sha-t', size: 1 },
          ],
        };
      },
    });
    const listed = await listRepoImageBlobs(
      transport,
      { ...repo, configRoot: 'root' },
      name => name.endsWith('.jpg'),
    );
    expect(listed).toEqual([
      { workspacePath: 'images/a.jpg', sha: 'sha-a', size: 4 },
    ]);
  });
});

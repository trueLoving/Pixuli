import { describe, it, expect, vi } from 'vitest';
import { GitHubStorageService } from '../githubStorageService';
import { createMockResponse } from './helpers';

/** REF-309：兼容层保留最小冒烟，主测见 githubStorageProvider.test.ts */
describe('GitHubStorageService（兼容层）', () => {
  it('getImageList 委托 GitHubStorageProvider.listImages', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      createMockResponse(true, [
        {
          name: 'a.jpg',
          type: 'file',
          sha: 'sha1',
          download_url: 'https://example.com/a.jpg',
          html_url: 'https://github.com/o/r/blob/main/images/a.jpg',
          size: 1,
        },
      ]),
    );

    const service = new GitHubStorageService({
      owner: 'o',
      repo: 'r',
      branch: 'main',
      token: 't',
      path: 'images',
    });

    const list = await service.getImageList();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('a.jpg');
  });
});

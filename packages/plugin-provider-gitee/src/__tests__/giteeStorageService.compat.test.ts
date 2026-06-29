import { describe, it, expect, vi } from 'vitest';
import { GiteeStorageService } from '../giteeStorageService';
import { createMockResponse } from './helpers';

/** REF-309：兼容层保留最小冒烟，主测见 giteeStorageProvider.test.ts */
describe('GiteeStorageService（兼容层）', () => {
  it('getImageList 委托 GiteeStorageProvider.listImages', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      createMockResponse(true, [
        {
          name: 'a.jpg',
          type: 'file',
          sha: 'sha1',
          download_url: 'https://gitee.com/o/r/raw/main/images/a.jpg',
          size: 1,
        },
      ]),
    );

    const service = new GiteeStorageService({
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

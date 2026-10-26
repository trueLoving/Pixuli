import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadInBrowser,
  resolveDownloadAssetAction,
  sanitizeDownloadFileName,
} from './openAsset';

const file = {
  name: 'notes.pdf',
  url: 'blob:http://localhost/abc',
  localPath: 'docs/notes.pdf',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveDownloadAssetAction', () => {
  it('downloads through the browser on web and desktop', () => {
    expect(resolveDownloadAssetAction('web', file)).toEqual({
      type: 'browser',
      name: 'notes.pdf',
      url: file.url,
    });
    expect(resolveDownloadAssetAction('desktop', file)).toEqual({
      type: 'browser',
      name: 'notes.pdf',
      url: file.url,
    });
  });

  it('saves onto the device on mobile', () => {
    expect(resolveDownloadAssetAction('mobile', file)).toEqual({
      type: 'mobile',
      name: 'notes.pdf',
      url: file.url,
    });
  });

  it('does nothing without a file address', () => {
    expect(
      resolveDownloadAssetAction('web', { name: 'notes.pdf', url: '  ' }),
    ).toBeNull();
  });
});

describe('sanitizeDownloadFileName', () => {
  it('keeps a readable name and strips path characters', () => {
    expect(sanitizeDownloadFileName('《乌合之众》古斯塔夫·勒庞.pdf')).toBe(
      '《乌合之众》古斯塔夫·勒庞.pdf',
    );
    expect(sanitizeDownloadFileName('docs/notes.pdf')).toBe('docs_notes.pdf');
    expect(sanitizeDownloadFileName('   ')).toMatch(/^file-/);
  });
});

describe('downloadInBrowser', () => {
  it('downloads the file instead of opening a tab', () => {
    const click = vi.fn();
    const link = document.createElement('a');
    vi.spyOn(link, 'click').mockImplementation(click);
    vi.spyOn(document, 'createElement').mockReturnValue(link);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    downloadInBrowser('notes.pdf', file.url);

    expect(link.download).toBe('notes.pdf');
    expect(link.href).toContain('blob:http://localhost/abc');
    expect(click).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
  });
});

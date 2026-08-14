import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportJsonFile } from '../exportJsonFile';

vi.mock('../platform', () => ({
  isNativeMobile: vi.fn(() => false),
}));

vi.mock('../clipboard', () => ({
  copyTextToClipboard: vi.fn(),
}));

import { copyTextToClipboard } from '../clipboard';
import { isNativeMobile } from '../platform';

describe('exportJsonFile', () => {
  afterEach(() => {
    vi.mocked(isNativeMobile).mockReturnValue(false);
    vi.clearAllMocks();
  });

  it('downloads a file on web/desktop', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      configurable: true,
    });

    const click = vi.fn();
    const anchor = {
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement;
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(anchor);
    const appendChild = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => anchor);
    const removeChild = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => anchor);

    const result = await exportJsonFile('test.json', '{"a":1}');

    expect(result).toBe('file');
    expect(anchor.download).toBe('test.json');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');

    createElement.mockRestore();
    appendChild.mockRestore();
    removeChild.mockRestore();
  });

  it('copies to clipboard on native mobile', async () => {
    vi.mocked(isNativeMobile).mockReturnValue(true);

    const result = await exportJsonFile('test.json', '{"a":1}');

    expect(result).toBe('clipboard');
    expect(copyTextToClipboard).toHaveBeenCalledWith('{"a":1}');
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildReconnectHint,
  classifyFsaAccessError,
  isFsaRootPath,
} from '../fsaReconnect';

describe('fsaReconnect', () => {
  it('detects fsa root paths', () => {
    expect(isFsaRootPath('fsa://abc')).toBe(true);
    expect(isFsaRootPath('opfs://abc')).toBe(false);
  });

  it('classifies permission and missing-handle errors', () => {
    expect(classifyFsaAccessError('Folder permission denied')).toBe(
      'permission',
    );
    expect(
      classifyFsaAccessError(
        'Connected folder handle not found; pick the folder again',
      ),
    ).toBe('missing_handle');
    expect(classifyFsaAccessError('disk full')).toBeNull();
  });

  it('builds reconnect hint only for FSA access failures', () => {
    expect(
      buildReconnectHint('fsa://id', 'Photos', 'Folder permission denied'),
    ).toEqual({
      rootPath: 'fsa://id',
      folderLabel: 'Photos',
      reason: 'permission',
    });
    expect(
      buildReconnectHint('opfs://id', 'Photos', 'Folder permission denied'),
    ).toBeNull();
  });
});

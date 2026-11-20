import { describe, expect, it } from 'vitest';
import {
  isTransferImportStrategy,
  shouldSkipExistingEntry,
} from '../importStrategy';

describe('importStrategy', () => {
  it('validates strategy ids', () => {
    expect(isTransferImportStrategy('skip')).toBe(true);
    expect(isTransferImportStrategy('overwrite')).toBe(true);
    expect(isTransferImportStrategy('replace')).toBe(true);
    expect(isTransferImportStrategy('merge')).toBe(false);
  });

  it('only skip strategy leaves existing active entries alone', () => {
    expect(shouldSkipExistingEntry('skip', true)).toBe(true);
    expect(shouldSkipExistingEntry('skip', false)).toBe(false);
    expect(shouldSkipExistingEntry('overwrite', true)).toBe(false);
    expect(shouldSkipExistingEntry('replace', true)).toBe(false);
  });
});

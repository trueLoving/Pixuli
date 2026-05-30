import { describe, it, expect } from 'vitest';
import * as nativeServices from '../services/index.native';
import * as webServices from '../services';

describe('services index.native (REF-205)', () => {
  it('does not export webImageProcessor', () => {
    expect('webImageProcessorService' in nativeServices).toBe(false);
    expect('WebImageProcessorService' in nativeServices).toBe(false);
    expect('OutputMimeType' in nativeServices).toBe(false);
  });

  it('still exports storage and operation log services', () => {
    expect(nativeServices.OperationLogService).toBeDefined();
    expect(nativeServices.GitHubStorageService).toBeDefined();
    expect(nativeServices.GiteeStorageService).toBeDefined();
  });

  it('web services index still exports webImageProcessor', () => {
    expect(webServices.webImageProcessorService).toBeDefined();
    expect(webServices.WebImageProcessorService).toBeDefined();
  });
});

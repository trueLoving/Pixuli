import { describe, it, expect } from 'vitest';
import * as nativeServices from '../services/index.native';
import * as webServices from '../services';

/** 存储实现与单测在 @pixuli/provider-*（REF-309）；本包仅 re-export 兼容。 */
describe('pixuli-common services exports (REF-210)', () => {
  it('native services do not export webImageProcessor', () => {
    expect('webImageProcessorService' in nativeServices).toBe(false);
    expect('WebImageProcessorService' in nativeServices).toBe(false);
  });

  it('web services do not export webImageProcessor', () => {
    expect('webImageProcessorService' in webServices).toBe(false);
    expect('WebImageProcessorService' in webServices).toBe(false);
  });

  it('exports GitHub/Gitee storage services', () => {
    expect(nativeServices.GitHubStorageService).toBeDefined();
    expect(nativeServices.GiteeStorageService).toBeDefined();
    expect(webServices.GitHubStorageService).toBeDefined();
    expect(webServices.GiteeStorageService).toBeDefined();
  });
});

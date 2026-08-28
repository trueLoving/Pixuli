import { describe, expect, it } from 'vitest';
import { getBrandCopy, getBrandCopyForElectronLocale } from '../brandCopy';

describe('brandCopy', () => {
  it('returns zh-CN brand strings', () => {
    const brand = getBrandCopy('zh-CN');
    expect(brand.tagline).toBe('本地优先的资源工作区');
    expect(brand.name).toBe('Pixuli');
  });

  it('returns en-US brand strings', () => {
    const brand = getBrandCopy('en-US');
    expect(brand.tagline).toBe('Local-first resource workspace');
  });

  it('maps electron locale to brand copy', () => {
    expect(getBrandCopyForElectronLocale('zh-CN').tagline).toContain('资源');
    expect(getBrandCopyForElectronLocale('en-US').tagline).toContain(
      'Local-first',
    );
  });
});

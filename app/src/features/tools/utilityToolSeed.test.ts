import { describe, expect, it } from 'vitest';
import {
  setUtilityToolSeedFiles,
  takeUtilityToolSeedFiles,
} from './utilityToolSeed';

describe('utilityToolSeed', () => {
  it('returns seeded files once then clears', () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    setUtilityToolSeedFiles([file]);
    expect(takeUtilityToolSeedFiles()).toEqual([file]);
    expect(takeUtilityToolSeedFiles()).toEqual([]);
  });
});

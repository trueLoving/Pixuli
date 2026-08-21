import { describe, expect, it } from 'vitest';
import {
  EXPLORER_WIDTH_MAX,
  EXPLORER_WIDTH_MIN,
  clampPanelWidth,
} from '../usePanelResize';

describe('clampPanelWidth', () => {
  it('clamps to min and max', () => {
    expect(clampPanelWidth(100, EXPLORER_WIDTH_MIN, EXPLORER_WIDTH_MAX)).toBe(
      EXPLORER_WIDTH_MIN,
    );
    expect(clampPanelWidth(999, EXPLORER_WIDTH_MIN, EXPLORER_WIDTH_MAX)).toBe(
      EXPLORER_WIDTH_MAX,
    );
    expect(clampPanelWidth(250.6, EXPLORER_WIDTH_MIN, EXPLORER_WIDTH_MAX)).toBe(
      251,
    );
  });
});

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BrandPixelMark } from './BrandPixelMark';

describe('BrandPixelMark', () => {
  it('renders empty variant by default', () => {
    const { container } = render(<BrandPixelMark />);
    expect(container.querySelector('.brand-pixel-mark--empty')).toBeTruthy();
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders loading pixels for loading variant', () => {
    const { container } = render(<BrandPixelMark variant="loading" />);
    expect(container.querySelector('.brand-pixel-mark--loading')).toBeTruthy();
    expect(container.querySelectorAll('.brand-pixel-mark__pixel').length).toBe(
      5,
    );
  });

  it('renders filter glass for filter variant', () => {
    const { container } = render(<BrandPixelMark variant="filter" />);
    expect(container.querySelector('.brand-pixel-mark__glass')).toBeTruthy();
  });
});

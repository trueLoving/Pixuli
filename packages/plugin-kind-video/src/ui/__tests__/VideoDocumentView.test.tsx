import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VideoDocumentView } from '../VideoDocumentView';

vi.mock('../../videoEngine', () => ({
  captureVideoThumbnail: vi.fn(async () => null),
}));

describe('VideoDocumentView', () => {
  it('renders modal video element when src is present', () => {
    const { container } = render(
      <VideoDocumentView
        assetName="clip.mp4"
        src="https://example.com/clip.mp4"
        variant="modal"
        openExternalLabel="Open"
      />,
    );
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('https://example.com/clip.mp4');
  });

  it('renders inspector fallback when thumbnail is unavailable', () => {
    render(
      <VideoDocumentView
        assetName="clip.mp4"
        src="https://example.com/clip.mp4"
        variant="inspector"
      />,
    );
    expect(
      document.querySelector('.asset-inspector-preview--video-fallback'),
    ).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildZipDownloadFilename,
  uniqueZipEntryName,
} from '@/features/library/assetDownloadService';

describe('assetDownloadService', () => {
  describe('uniqueZipEntryName', () => {
    it('deduplicates repeated file names in zip entries', () => {
      const used = new Set<string>();
      expect(uniqueZipEntryName('photo.jpg', used)).toBe('photo.jpg');
      expect(uniqueZipEntryName('photo.jpg', used)).toBe('photo (2).jpg');
      expect(uniqueZipEntryName('photo.jpg', used)).toBe('photo (3).jpg');
    });

    it('handles names without extension', () => {
      const used = new Set<string>();
      expect(uniqueZipEntryName('README', used)).toBe('README');
      expect(uniqueZipEntryName('README', used)).toBe('README (2)');
    });
  });

  describe('buildZipDownloadFilename', () => {
    it('includes file count and date stamp', () => {
      expect(buildZipDownloadFilename(3)).toMatch(
        /^pixuli-3-files-\d{4}-\d{2}-\d{2}\.zip$/,
      );
    });
  });
});

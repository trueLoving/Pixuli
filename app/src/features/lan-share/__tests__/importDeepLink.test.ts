import { describe, expect, it } from 'vitest';
import {
  buildExportTicketHttpUrl,
  buildImportTransferDeepLink,
  parseImportTransferDeepLink,
} from '../importDeepLink';

describe('importDeepLink', () => {
  it('builds and parses deep links with ticket http src', () => {
    const ticket = buildExportTicketHttpUrl(
      'http://192.168.1.8:17890',
      'TICKET1',
      'TOK',
    );
    expect(ticket).toBe(
      'http://192.168.1.8:17890/api/export/ticket?id=TICKET1&token=TOK',
    );
    const deep = buildImportTransferDeepLink(ticket);
    expect(deep.startsWith('pixuli://import-transfer?src=')).toBe(true);
    expect(parseImportTransferDeepLink(deep)).toEqual({ sourceUrl: ticket });
  });

  it('rejects non-pixuli or missing src', () => {
    expect(parseImportTransferDeepLink('https://example.com')).toBeNull();
    expect(
      parseImportTransferDeepLink('pixuli://other?src=http://x'),
    ).toBeNull();
    expect(parseImportTransferDeepLink('pixuli://import-transfer')).toBeNull();
    expect(
      parseImportTransferDeepLink('pixuli://import-transfer?src=ftp://x'),
    ).toBeNull();
  });
});

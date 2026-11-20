import { describe, expect, it } from 'vitest';
import {
  buildExportTicketHttpUrl,
  buildImportTransferDeepLink,
  parseImportTransferDeepLink,
} from '../importDeepLink';

describe('importDeepLink', () => {
  it('builds structured deep links and parses ticket http url', () => {
    const ticket = buildExportTicketHttpUrl(
      'http://192.168.1.8:17890',
      'TICKET1',
      'TOK',
    );
    expect(ticket).toBe(
      'http://192.168.1.8:17890/api/export/ticket?id=TICKET1&token=TOK',
    );
    const deep = buildImportTransferDeepLink(ticket);
    expect(deep.startsWith('pixuli://import-transfer?')).toBe(true);
    expect(deep.includes('h=192.168.1.8')).toBe(true);
    expect(deep.includes('p=17890')).toBe(true);
    expect(deep.includes('id=TICKET1')).toBe(true);
    expect(deep.includes('t=TOK')).toBe(true);
    expect(parseImportTransferDeepLink(deep)).toEqual({ sourceUrl: ticket });
  });

  it('parses legacy src= deep links and recovers stripped token', () => {
    const legacy =
      'pixuli://import-transfer?src=' +
      encodeURIComponent(
        'http://192.168.1.8:17890/api/export/ticket?id=TICKET1',
      ) +
      '&token=TOK';
    expect(parseImportTransferDeepLink(legacy)).toEqual({
      sourceUrl:
        'http://192.168.1.8:17890/api/export/ticket?id=TICKET1&token=TOK',
    });
  });

  it('rejects non-pixuli or missing params', () => {
    expect(parseImportTransferDeepLink('https://example.com')).toBeNull();
    expect(
      parseImportTransferDeepLink('pixuli://other?h=x&id=1&t=2'),
    ).toBeNull();
    expect(parseImportTransferDeepLink('pixuli://import-transfer')).toBeNull();
    expect(
      parseImportTransferDeepLink('pixuli://import-transfer?src=ftp://x'),
    ).toBeNull();
  });
});

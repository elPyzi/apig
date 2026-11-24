import { describe, test, expect } from 'bun:test';
import { buildRawResponseBody } from '../build-raw-response';

describe('buildRawResponseBody', () => {
  test('ky drops the parse call even when the type argument nests', () => {
    const body = buildRawResponseBody(
      'api.get(`/items`).json<Array<Item>>()',
      'Array<Item>',
      'ky',
      false,
      'ZvyappyError',
    );

    expect(body).toContain('const res = await api.get(`/items`);');
  });

  test('wretch keeps the chain up to the parse call before taking .res()', () => {
    const body = buildRawResponseBody(
      'api.url(`/items`).json({}).post().json<Record<string, Array<Item>>>()',
      'Record<string, Array<Item>>',
      'wretch',
      false,
      'ZvyappyError',
    );

    expect(body).toContain(
      'const res = await api.url(`/items`).json({}).post().res();',
    );
  });

  test('axios headers are turned into Headers', () => {
    const body = buildRawResponseBody(
      'api.get<Item>(`/items`)',
      'Item',
      'axios',
      false,
      'ZvyappyError',
    );

    expect(body).toContain('headers: new Headers(Object.entries(r.headers)');
  });

  test('an axios error without a response still passes a status number', () => {
    const body = buildRawResponseBody(
      'api.get<Item>(`/items`)',
      'Item',
      'axios',
      true,
      'ZvyappyError',
    );

    expect(body).toContain('new ZvyappyError(ae.response?.status ?? 0,');
  });
});

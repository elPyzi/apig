import { describe, test, expect } from 'bun:test';
import { getAdapterByName, type AdapterCtx } from '@services/adapters';

const ctx = (overrides: Partial<AdapterCtx> = {}): AdapterCtx => ({
  url: '`/pets/${id}`',
  type: 'Pet',
  client: 'api',
  hasQuery: false,
  hasBody: false,
  hasHeaders: false,
  ...overrides,
});

describe('adapters', () => {
  describe('fetch', () => {
    const fetchAdapter = getAdapterByName('fetch');

    test('a plain GET passes no init object', () => {
      expect(fetchAdapter('get', ctx())).toBe(
        'fetch(`/pets/${id}`).then(r => r.json() as Promise<Pet>)',
      );
    });

    test('query params go through the toQuery helper', () => {
      const call = fetchAdapter('get', ctx({ hasQuery: true }));

      expect(call).toContain('${toQuery(params)}');
      expect(call).not.toContain('URLSearchParams');
    });

    test('a body method sets the JSON content type', () => {
      expect(fetchAdapter('post', ctx({ hasBody: true }))).toContain(
        `headers: { 'Content-Type': 'application/json' }`,
      );
    });

    test('caller headers are spread after the content type', () => {
      expect(
        fetchAdapter('post', ctx({ hasBody: true, hasHeaders: true })),
      ).toContain(
        `headers: { 'Content-Type': 'application/json', ...headers }`,
      );
    });

    test('a GET with headers only forwards them directly', () => {
      expect(fetchAdapter('get', ctx({ hasHeaders: true }))).toBe(
        'fetch(`/pets/${id}`, { headers }).then(r => r.json() as Promise<Pet>)',
      );
    });

    test('DELETE keeps its method and headers', () => {
      expect(fetchAdapter('delete', ctx({ hasHeaders: true }))).toContain(
        `{ method: 'DELETE', headers }`,
      );
    });
  });

  describe('axios', () => {
    const axios = getAdapterByName('axios');

    test('params and headers share one config object', () => {
      expect(axios('get', ctx({ hasQuery: true, hasHeaders: true }))).toBe(
        'api.get<Pet>(`/pets/${id}`, { params, headers })',
      );
    });

    test('a body method without config passes the body positionally', () => {
      expect(axios('post', ctx({ hasBody: true }))).toBe(
        'api.post<Pet>(`/pets/${id}`, body)',
      );
    });

    test('config without a body still needs the undefined placeholder', () => {
      expect(axios('post', ctx({ hasHeaders: true }))).toBe(
        'api.post<Pet>(`/pets/${id}`, undefined, { headers })',
      );
    });
  });

  describe('ky', () => {
    const ky = getAdapterByName('ky');

    test('body, query and headers land in the options object', () => {
      expect(
        ky('post', ctx({ hasBody: true, hasQuery: true, hasHeaders: true })),
      ).toBe(
        'api.post(`/pets/${id}`, { json: body, searchParams: params, headers }).json<Pet>()',
      );
    });

    test('a bare GET passes no options', () => {
      expect(ky('get', ctx())).toBe('api.get(`/pets/${id}`).json<Pet>()');
    });
  });

  describe('ofetch', () => {
    const ofetch = getAdapterByName('ofetch');

    test('method, body, query and headers land in one options object', () => {
      expect(
        ofetch('put', ctx({ hasBody: true, hasQuery: true, hasHeaders: true })),
      ).toBe(
        "api<Pet>(`/pets/${id}`, { method: 'PUT', body, query: params, headers })",
      );
    });
  });

  describe('wretch', () => {
    const wretch = getAdapterByName('wretch');

    test('builds the chain in query → headers → body → method order', () => {
      expect(
        wretch(
          'post',
          ctx({ hasBody: true, hasQuery: true, hasHeaders: true }),
        ),
      ).toBe(
        'api.url(`/pets/${id}`).query(params ?? {}).headers(headers).json(body).post().json<Pet>()',
      );
    });

    test('a write method always sends a body, even an empty one', () => {
      expect(wretch('post', ctx())).toContain('.json({})');
    });
  });

  test('an unknown client name falls back to fetch', () => {
    expect(getAdapterByName('nope' as 'fetch')('get', ctx())).toContain(
      'fetch(',
    );
  });
});

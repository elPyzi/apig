import { describe, test, expect } from 'bun:test';
import { specRequestHeaders } from '@libs/auth';

const SPEC = 'https://docs.example.com/api-docs';
// not a real credential — fake placeholder values for this test only
const auth = { username: 'test-user', password: 'test-pass' };

describe('specRequestHeaders', () => {
  test('sends basic auth to the spec itself', () => {
    expect(specRequestHeaders(SPEC, SPEC, auth)).toEqual({
      Authorization: `Basic ${Buffer.from('test-user:test-pass').toString('base64')}`,
    });
  });

  test('sends it to other files on the same origin', () => {
    expect(
      specRequestHeaders('https://docs.example.com/schemas.json', SPEC, auth),
    ).toHaveProperty('Authorization');
  });

  test('keeps it from an external $ref on another host', () => {
    expect(
      specRequestHeaders('https://cdn.other.com/common.json', SPEC, auth),
    ).toEqual({});
  });

  test('keeps it from the same host on another port or scheme', () => {
    expect(
      specRequestHeaders('http://docs.example.com/schemas.json', SPEC, auth),
    ).toEqual({});
    expect(
      specRequestHeaders('https://docs.example.com:8443/x.json', SPEC, auth),
    ).toEqual({});
  });

  test('sends nothing without auth or for a local spec', () => {
    expect(specRequestHeaders(SPEC, SPEC, undefined)).toEqual({});
    expect(specRequestHeaders(SPEC, './openapi.json', auth)).toEqual({});
  });
});

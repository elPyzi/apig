import { describe, test, expect } from 'bun:test';
import { msw, generateMsw } from '../msw';
import { baseConfig, emptyIR, makeOperation, makeIR } from './fixtures';
import { faker } from '../faker';
import { HTTP_METHODS } from '@models';

const configWithFaker = { ...baseConfig, plugins: [faker()] };

describe('msw', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = msw();
      expect(plugin.name).toBe('msw');
      expect(plugin.fileName).toBe('msw');
      expect(plugin.scope).toBe('root');
    });
  });

  describe('config validation', () => {
    test('throws when the faker plugin is missing', () => {
      expect(() => generateMsw(emptyIR, baseConfig)).toThrow(
        'msw plugin requires faker plugin',
      );
    });

    test('does not throw when the faker plugin is present', () => {
      expect(() => generateMsw(emptyIR, configWithFaker)).not.toThrow();
    });
  });

  describe('empty IR', () => {
    test('contains the banner and the msw import', () => {
      const result = generateMsw(emptyIR, configWithFaker);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain("import { http, HttpResponse } from 'msw'");
    });

    test('contains an empty handlers array', () => {
      const result = generateMsw(emptyIR, configWithFaker);
      expect(result.code).toContain('export const handlers = [');
      expect(result.exports).toContain('handlers');
    });

    test('typeExports is always empty', () => {
      expect(generateMsw(emptyIR, configWithFaker).typeExports).toEqual([]);
    });
  });

  describe('GET operations', () => {
    test('generates an http.get handler', () => {
      const ir = makeIR([
        makeOperation({ method: HTTP_METHODS.GET, path: '/users' }),
      ]);
      const result = generateMsw(ir, configWithFaker);
      expect(result.code).toContain('http.get(');
      expect(result.code).toContain('/users');
    });

    test('a GET handler with a response returns HttpResponse.json()', () => {
      const ir = makeIR([
        makeOperation({
          method: HTTP_METHODS.GET,
          path: '/users',
          response: { type: 'object', name: 'User' },
        }),
      ]);
      expect(generateMsw(ir, configWithFaker).code).toContain(
        'HttpResponse.json(',
      );
    });

    test('a GET handler without a response returns 204', () => {
      const ir = makeIR([
        makeOperation({
          method: HTTP_METHODS.GET,
          path: '/users',
          response: null,
        }),
      ]);
      expect(generateMsw(ir, configWithFaker).code).toContain(
        'new HttpResponse(null, { status: 204 })',
      );
    });
  });

  describe('POST/PUT/PATCH/DELETE operations', () => {
    test('POST → http.post handler', () => {
      const ir = makeIR([
        makeOperation({ method: HTTP_METHODS.POST, path: '/users' }),
      ]);
      expect(generateMsw(ir, configWithFaker).code).toContain('http.post(');
    });

    test('PUT → http.put handler', () => {
      const ir = makeIR([
        makeOperation({ method: HTTP_METHODS.PUT, path: '/users/1' }),
      ]);
      expect(generateMsw(ir, configWithFaker).code).toContain('http.put(');
    });

    test('DELETE → http.delete handler', () => {
      const ir = makeIR([
        makeOperation({ method: HTTP_METHODS.DELETE, path: '/users/1' }),
      ]);
      expect(generateMsw(ir, configWithFaker).code).toContain('http.delete(');
    });

    test('PATCH → http.patch handler', () => {
      const ir = makeIR([
        makeOperation({ method: HTTP_METHODS.PATCH, path: '/users/1' }),
      ]);
      expect(generateMsw(ir, configWithFaker).code).toContain('http.patch(');
    });
  });

  describe('several operations', () => {
    test('every operation is present in handlers', () => {
      const ir = makeIR([
        makeOperation({
          id: 'getUsers',
          method: HTTP_METHODS.GET,
          path: '/users',
        }),
        makeOperation({
          id: 'createUser',
          method: HTTP_METHODS.POST,
          path: '/users',
        }),
      ]);
      const code = generateMsw(ir, configWithFaker).code;
      expect(code).toContain('http.get(');
      expect(code).toContain('http.post(');
    });
  });

  describe('imports faker when there is a response', () => {
    test('does not import faker when there are no responses', () => {
      const ir = makeIR([makeOperation({ response: null })]);
      const code = generateMsw(ir, configWithFaker).code;
      expect(code).not.toContain('@faker-js/faker');
    });

    test('imports the generate function when the response schema has a name', () => {
      const ir = makeIR([
        makeOperation({
          response: { type: 'object', name: 'User' },
        }),
      ]);
      const code = generateMsw(ir, configWithFaker).code;
      expect(code).toContain('generateUser');
    });
  });

  describe('exports', () => {
    test('exports holds handlers', () => {
      const result = generateMsw(emptyIR, configWithFaker);
      expect(result.exports).toEqual(['handlers']);
    });
  });
});

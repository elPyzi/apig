import { describe, test, expect } from 'bun:test';
import { msw, generateMsw } from '../msw';
import { baseConfig, emptyIR, makeOperation, makeIR } from './fixtures';
import { HTTP_METHODS } from '@models';

const configWithFaker = { ...baseConfig, plugins: [{ name: 'faker' }] };

describe('msw', () => {
  describe('фабрика', () => {
    test('возвращает плагин с правильными мета', () => {
      const plugin = msw();
      expect(plugin.name).toBe('msw');
      expect(plugin.fileName).toBe('msw');
      expect(plugin.scope).toBe('root');
    });
  });

  describe('валидация конфигурации', () => {
    test('бросает ошибку если faker плагин не подключён', () => {
      expect(() => generateMsw(emptyIR, baseConfig)).toThrow(
        'msw plugin requires faker plugin',
      );
    });

    test('не бросает ошибку если faker плагин подключён', () => {
      expect(() => generateMsw(emptyIR, configWithFaker)).not.toThrow();
    });
  });

  describe('пустой IR', () => {
    test('содержит banner и импорт msw', () => {
      const result = generateMsw(emptyIR, configWithFaker);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain("import { http, HttpResponse } from 'msw'");
    });

    test('содержит пустой массив handlers', () => {
      const result = generateMsw(emptyIR, configWithFaker);
      expect(result.code).toContain('export const handlers = [');
      expect(result.exports).toContain('handlers');
    });

    test('typeExports всегда пустой', () => {
      expect(generateMsw(emptyIR, configWithFaker).typeExports).toEqual([]);
    });
  });

  describe('GET операции', () => {
    test('генерирует http.get handler', () => {
      const ir = makeIR([
        makeOperation({ method: HTTP_METHODS.GET, path: '/users' }),
      ]);
      const result = generateMsw(ir, configWithFaker);
      expect(result.code).toContain('http.get(');
      expect(result.code).toContain('/users');
    });

    test('GET handler с response возвращает HttpResponse.json()', () => {
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

    test('GET handler без response возвращает 204', () => {
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

  describe('POST/PUT/PATCH/DELETE операции', () => {
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

  describe('несколько операций', () => {
    test('все операции присутствуют в handlers', () => {
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

  describe('импорт faker при наличии ответа', () => {
    test('не импортирует faker если ответов нет', () => {
      const ir = makeIR([makeOperation({ response: null })]);
      const code = generateMsw(ir, configWithFaker).code;
      expect(code).not.toContain('@faker-js/faker');
    });

    test('импортирует generate-функцию при наличии response schema name', () => {
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
    test('exports содержит handlers', () => {
      const result = generateMsw(emptyIR, configWithFaker);
      expect(result.exports).toEqual(['handlers']);
    });
  });
});

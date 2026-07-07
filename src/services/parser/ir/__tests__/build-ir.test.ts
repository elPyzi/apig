import { describe, test, expect } from 'bun:test';
import { buildIR } from '../build-ir';
import { schemaNames, makeSpec, jsonResponse } from './fixtures';

describe('buildIR', () => {
  describe('пустой spec', () => {
    test('нет paths и schemas в пустые массивы', () => {
      const result = buildIR(makeSpec(), schemaNames);

      expect(result.operations).toEqual([]);
      expect(result.schemas).toEqual([]);
    });
  });

  describe('schemas из components', () => {
    test('компоненты превращаются в IRSchema', () => {
      const result = buildIR(
        makeSpec({}, { User: { type: 'object' }, Post: { type: 'object' } }),
        schemaNames,
      );

      expect(result.schemas).toHaveLength(2);
    });

    test('name схемы пробрасывается', () => {
      const result = buildIR(
        makeSpec({}, { User: { type: 'object' } }),
        schemaNames,
      );

      expect(result.schemas[0].name).toBe('User');
    });
  });

  describe('операции', () => {
    test('GET эндпоинт превращается в operation', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: {
              operationId: 'getUsers',
              responses: { '200': { description: 'OK' } },
            },
          },
        }),
        schemaNames,
      );

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].id).toBe('getUsers');
      expect(result.operations[0].method).toBe('GET');
      expect(result.operations[0].path).toBe('/users');
    });

    test('несколько методов на одном пути в разные операции', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: { operationId: 'getUsers', responses: {} },
            post: { operationId: 'createUser', responses: {} },
          },
        }),
        schemaNames,
      );

      expect(result.operations).toHaveLength(2);
      const methods = result.operations.map((o) => o.method);
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
    });

    test('несколько путей в несколько операций', () => {
      const result = buildIR(
        makeSpec({
          '/users': { get: { operationId: 'getUsers', responses: {} } },
          '/posts': { get: { operationId: 'getPosts', responses: {} } },
        }),
        schemaNames,
      );

      expect(result.operations).toHaveLength(2);
    });

    test('tag берётся первый из массива', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: {
              operationId: 'getUsers',
              tags: ['users', 'admin'],
              responses: {},
            },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0].tag).toBe('users');
    });

    test('нет тегов в tag default', () => {
      const result = buildIR(
        makeSpec({
          '/users': { get: { operationId: 'getUsers', responses: {} } },
        }),
        schemaNames,
      );

      expect(result.operations[0].tag).toBe('default');
    });

    test('нет operationId в генерируется из метода и пути', () => {
      const result = buildIR(
        makeSpec({
          '/users/{id}': {
            get: { responses: {} },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0].id).toBe('get__users_id_');
    });

    test('deprecated пробрасывается', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: { operationId: 'getUsers', deprecated: true, responses: {} },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0].deprecated).toBe(true);
    });

    test('deprecated по умолчанию false', () => {
      const result = buildIR(
        makeSpec({
          '/users': { get: { operationId: 'getUsers', responses: {} } },
        }),
        schemaNames,
      );

      expect(result.operations[0].deprecated).toBe(false);
    });

    test('summary и description пробрасываются', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: {
              operationId: 'getUsers',
              summary: 'Get all users',
              description: 'Returns a list',
              responses: {},
            },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0].summary).toBe('Get all users');
      expect(result.operations[0].description).toBe('Returns a list');
    });

    test('нет errors в операции если нет 4xx', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: {
              operationId: 'getUsers',
              responses: { '200': { description: 'OK' } },
            },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0].errors).toBeUndefined();
    });

    test('errors появляются если есть 4xx с json schema', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: {
              operationId: 'getUsers',
              responses: {
                '400': {
                  description: 'Bad Request',
                  content: {
                    'application/json': { schema: { type: 'object' } },
                  },
                },
              },
            },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0].errors).toHaveLength(1);
      expect(result.operations[0].errors?.[0].status).toBe(400);
    });
  });
});

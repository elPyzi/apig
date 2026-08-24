import { describe, test, expect } from 'bun:test';
import { buildIR } from '../build-ir';
import { schemaNames, makeSpec } from './fixtures';

describe('buildIR', () => {
  describe('empty spec', () => {
    test('missing paths and schemas become empty arrays', () => {
      const result = buildIR(makeSpec(), schemaNames);

      expect(result.operations).toEqual([]);
      expect(result.schemas).toEqual([]);
    });
  });

  describe('schemas from components', () => {
    test('components become IRSchemas', () => {
      const result = buildIR(
        makeSpec({}, { User: { type: 'object' }, Post: { type: 'object' } }),
        schemaNames,
      );

      expect(result.schemas).toHaveLength(2);
    });

    test('the schema name is carried through', () => {
      const result = buildIR(
        makeSpec({}, { User: { type: 'object' } }),
        schemaNames,
      );

      expect(result.schemas[0]!.name).toBe('User');
    });
  });

  describe('operations', () => {
    test('a GET endpoint becomes an operation', () => {
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
      expect(result.operations[0]!.id).toBe('getUsers');
      expect(result.operations[0]!.method).toBe('GET');
      expect(result.operations[0]!.path).toBe('/users');
    });

    test('several methods on one path become separate operations', () => {
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

    test('several paths become several operations', () => {
      const result = buildIR(
        makeSpec({
          '/users': { get: { operationId: 'getUsers', responses: {} } },
          '/posts': { get: { operationId: 'getPosts', responses: {} } },
        }),
        schemaNames,
      );

      expect(result.operations).toHaveLength(2);
    });

    test('the tag is taken from the first array entry', () => {
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

      expect(result.operations[0]!.tag).toBe('users');
    });

    test('no tags falls back to the default tag', () => {
      const result = buildIR(
        makeSpec({
          '/users': { get: { operationId: 'getUsers', responses: {} } },
        }),
        schemaNames,
      );

      expect(result.operations[0]!.tag).toBe('default');
    });

    test('a missing operationId is derived from the method and path', () => {
      const result = buildIR(
        makeSpec({
          '/users/{id}': {
            get: { responses: {} },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0]!.id).toBe('get__users_id_');
    });

    test('deprecated is carried through', () => {
      const result = buildIR(
        makeSpec({
          '/users': {
            get: { operationId: 'getUsers', deprecated: true, responses: {} },
          },
        }),
        schemaNames,
      );

      expect(result.operations[0]!.deprecated).toBe(true);
    });

    test('deprecated defaults to false', () => {
      const result = buildIR(
        makeSpec({
          '/users': { get: { operationId: 'getUsers', responses: {} } },
        }),
        schemaNames,
      );

      expect(result.operations[0]!.deprecated).toBe(false);
    });

    test('summary and description are carried through', () => {
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

      expect(result.operations[0]!.summary).toBe('Get all users');
      expect(result.operations[0]!.description).toBe('Returns a list');
    });

    test('no errors on the operation when there is no 4xx', () => {
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

      expect(result.operations[0]!.errors).toBeUndefined();
    });

    test('errors appear when a 4xx has a json schema', () => {
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

      expect(result.operations[0]!.errors).toHaveLength(1);
      expect(result.operations[0]!.errors?.[0]!.status).toBe(400);
    });
  });
});

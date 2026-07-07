import { describe, test, expect } from 'bun:test';
import { buildResponse } from '../build-response';
import { schemaNames, makeOperation, jsonResponse } from './fixtures';

describe('buildResponse', () => {
  describe('нет ответа', () => {
    test('нет responses в null', () => {
      expect(buildResponse(makeOperation(), schemaNames)).toBeNull();
    });

    test('200 без json schema в null', () => {
      const result = buildResponse(
        makeOperation({
          responses: {
            '200': { description: 'OK', content: { 'text/plain': {} } },
          },
        }),
        schemaNames,
      );

      expect(result).toBeNull();
    });

    test('только 4xx ответы в null', () => {
      const result = buildResponse(
        makeOperation({
          responses: { '400': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).toBeNull();
    });
  });

  describe('200', () => {
    test('200 с json schema возвращает IRSchema', () => {
      const result = buildResponse(
        makeOperation({
          responses: { '200': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('object');
    });

    test('schema обрабатывается рекурсивно', () => {
      const result = buildResponse(
        makeOperation({
          responses: {
            '200': jsonResponse({
              type: 'object',
              properties: { id: { type: 'integer' }, name: { type: 'string' } },
            }),
          },
        }),
        schemaNames,
      );

      expect(result?.properties).toHaveLength(2);
      expect(result?.properties?.[0]).toMatchObject({
        name: 'id',
        type: 'number',
      });
    });

    test('array response обрабатывается', () => {
      const result = buildResponse(
        makeOperation({
          responses: {
            '200': jsonResponse({ type: 'array', items: { type: 'string' } }),
          },
        }),
        schemaNames,
      );

      expect(result?.type).toBe('array');
      expect(result?.items?.type).toBe('string');
    });
  });

  describe('201', () => {
    test('201 с json schema возвращает IRSchema', () => {
      const result = buildResponse(
        makeOperation({
          responses: { '201': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('object');
    });
  });

  describe('приоритет', () => {
    test('200 имеет приоритет над 201', () => {
      const result = buildResponse(
        makeOperation({
          responses: {
            '200': jsonResponse({ type: 'string' }),
            '201': jsonResponse({ type: 'object' }),
          },
        }),
        schemaNames,
      );

      expect(result?.type).toBe('string');
    });
  });
});

import { describe, test, expect } from 'bun:test';
import { buildErrors } from '../build-errors';
import { schemaNames, makeOperation, jsonResponse } from './fixtures';

describe('buildErrors', () => {
  describe('нет ошибок', () => {
    test('нет responses в пустой массив', () => {
      expect(buildErrors(makeOperation(), schemaNames)).toEqual([]);
    });

    test('только 200 в пустой массив', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '200': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).toEqual([]);
    });

    test('только 201 в пустой массив', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '201': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).toEqual([]);
    });
  });

  describe('одна ошибка', () => {
    test('400 с json schema попадает в errors', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '400': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(400);
    });

    test('404 с json schema попадает в errors', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '404': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result[0].status).toBe(404);
    });

    test('500 с json schema попадает в errors', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '500': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result[0].status).toBe(500);
    });

    test('schema ошибки обрабатывается', () => {
      const result = buildErrors(
        makeOperation({
          responses: {
            '400': jsonResponse({
              type: 'object',
              properties: { message: { type: 'string' } },
            }),
          },
        }),
        schemaNames,
      );

      expect(result[0].schema.type).toBe('object');
      expect(result[0].schema.properties?.[0].name).toBe('message');
    });
  });

  describe('несколько ошибок', () => {
    test('несколько 4xx попадают все', () => {
      const result = buildErrors(
        makeOperation({
          responses: {
            '400': jsonResponse({ type: 'object' }),
            '404': jsonResponse({ type: 'object' }),
            '422': jsonResponse({ type: 'object' }),
          },
        }),
        schemaNames,
      );

      expect(result).toHaveLength(3);
      const statuses = result.map((e) => e.status);
      expect(statuses).toContain(400);
      expect(statuses).toContain(404);
      expect(statuses).toContain(422);
    });

    test('2xx игнорируются, 4xx собираются', () => {
      const result = buildErrors(
        makeOperation({
          responses: {
            '200': jsonResponse({ type: 'object' }),
            '201': jsonResponse({ type: 'object' }),
            '400': jsonResponse({ type: 'object' }),
            '404': jsonResponse({ type: 'object' }),
          },
        }),
        schemaNames,
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('ошибки без json schema', () => {
    test('4xx без json schema игнорируется', () => {
      const result = buildErrors(
        makeOperation({ responses: { '400': { description: 'Bad Request' } } }),
        schemaNames,
      );

      expect(result).toEqual([]);
    });

    test('4xx с text/plain игнорируется', () => {
      const result = buildErrors(
        makeOperation({
          responses: {
            '400': {
              description: 'Bad Request',
              content: { 'text/plain': { schema: { type: 'string' } } },
            },
          },
        }),
        schemaNames,
      );

      expect(result).toEqual([]);
    });
  });
});

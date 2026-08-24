import { describe, test, expect } from 'bun:test';
import { buildErrors } from '../build-errors';
import { schemaNames, makeOperation, jsonResponse } from './fixtures';

describe('buildErrors', () => {
  describe('no errors', () => {
    test('missing responses become an empty array', () => {
      expect(buildErrors(makeOperation(), schemaNames)).toEqual([]);
    });

    test('only 200 becomes an empty array', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '200': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).toEqual([]);
    });

    test('only 201 becomes an empty array', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '201': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).toEqual([]);
    });
  });

  describe('a single error', () => {
    test('400 with a json schema lands in errors', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '400': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe(400);
    });

    test('404 with a json schema lands in errors', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '404': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result[0]!.status).toBe(404);
    });

    test('500 with a json schema lands in errors', () => {
      const result = buildErrors(
        makeOperation({
          responses: { '500': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result[0]!.status).toBe(500);
    });

    test('the error schema is handled', () => {
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

      expect(result[0]!.schema.type).toBe('object');
      expect(result[0]!.schema.properties?.[0]!.name).toBe('message');
    });
  });

  describe('several errors', () => {
    test('every 4xx is collected', () => {
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

    test('2xx are ignored, 4xx are collected', () => {
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

  describe('errors without a json schema', () => {
    test('4xx without a json schema is ignored', () => {
      const result = buildErrors(
        makeOperation({ responses: { '400': { description: 'Bad Request' } } }),
        schemaNames,
      );

      expect(result).toEqual([]);
    });

    test('4xx with text/plain is ignored', () => {
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

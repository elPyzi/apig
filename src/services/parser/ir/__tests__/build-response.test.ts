import { describe, test, expect } from 'bun:test';
import { buildResponse } from '../build-response';
import { schemaNames, makeOperation, jsonResponse } from './fixtures';

describe('buildResponse', () => {
  describe('no response', () => {
    test('missing responses become null', () => {
      expect(buildResponse(makeOperation(), schemaNames)).toBeNull();
    });

    test('200 without a json schema becomes null', () => {
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

    test('only 4xx responses become null', () => {
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
    test('200 with a json schema returns an IRSchema', () => {
      const result = buildResponse(
        makeOperation({
          responses: { '200': jsonResponse({ type: 'object' }) },
        }),
        schemaNames,
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('object');
    });

    test('the schema is handled recursively', () => {
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

    test('an array response is handled', () => {
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
    test('201 with a json schema returns an IRSchema', () => {
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

  describe('precedence', () => {
    test('200 takes precedence over 201', () => {
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

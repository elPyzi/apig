import { describe, test, expect } from 'bun:test';
import type { OpenAPIV3 } from 'openapi-types';
import { buildBody } from '../build-body';
import { schemaNames, makeOperation } from './fixtures';

describe('buildBody', () => {
  describe('нет тела', () => {
    test('нет requestBody в null', () => {
      expect(buildBody(makeOperation(), schemaNames)).toBeNull();
    });
  });

  describe('application/json', () => {
    test('contentType в json', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        }),
        schemaNames,
      );

      expect(result?.contentType).toBe('json');
    });

    test('schema обрабатывается', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                },
              },
            },
          },
        }),
        schemaNames,
      );

      expect(result?.schema.type).toBe('object');
      expect(result?.schema.properties?.[0].name).toBe('name');
    });

    test('required: true пробрасывается', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        }),
        schemaNames,
      );

      expect(result?.required).toBe(true);
    });

    test('required отсутствует в false', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        }),
        schemaNames,
      );

      expect(result?.required).toBe(false);
    });
  });

  describe('multipart/form-data', () => {
    test('contentType в multipart', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: { 'multipart/form-data': { schema: { type: 'object' } } },
          },
        }),
        schemaNames,
      );

      expect(result?.contentType).toBe('multipart');
    });

    test('schema обрабатывается', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { file: { type: 'string' } },
                },
              },
            },
          },
        }),
        schemaNames,
      );

      expect(result?.schema.type).toBe('object');
      expect(result?.schema.properties?.[0].name).toBe('file');
    });
  });

  describe('application/octet-stream', () => {
    test('contentType в multipart', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: {
              'application/octet-stream': { schema: { type: 'string' } },
            },
          },
        }),
        schemaNames,
      );

      expect(result?.contentType).toBe('multipart');
    });
  });

  describe('приоритет', () => {
    test('json имеет приоритет над multipart', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: {
              'application/json': { schema: { type: 'object' } },
              'multipart/form-data': { schema: { type: 'object' } },
            },
          },
        }),
        schemaNames,
      );

      expect(result?.contentType).toBe('json');
    });
  });

  describe('неизвестный content-type', () => {
    test('text/plain в null', () => {
      const result = buildBody(
        makeOperation({
          requestBody: {
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        }),
        schemaNames,
      );

      expect(result).toBeNull();
    });
  });
});

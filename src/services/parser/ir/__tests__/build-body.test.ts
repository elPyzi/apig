import { describe, test, expect } from 'bun:test';
import { buildBody } from '../build-body';
import { schemaNames, makeOperation } from './fixtures';

describe('buildBody', () => {
  describe('no body', () => {
    test('a missing requestBody becomes null', () => {
      expect(buildBody(makeOperation(), schemaNames)).toBeNull();
    });
  });

  describe('application/json', () => {
    test('contentType becomes json', () => {
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

    test('the schema is handled', () => {
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
      expect(result?.schema.properties?.[0]!.name).toBe('name');
    });

    test('required: true is carried through', () => {
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

    test('a missing required becomes false', () => {
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
    test('contentType becomes multipart', () => {
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

    test('the schema is handled', () => {
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
      expect(result?.schema.properties?.[0]!.name).toBe('file');
    });
  });

  describe('application/octet-stream', () => {
    test('contentType becomes multipart', () => {
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

  describe('precedence', () => {
    test('json takes precedence over multipart', () => {
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

  describe('unknown content-type', () => {
    test('text/plain becomes null', () => {
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

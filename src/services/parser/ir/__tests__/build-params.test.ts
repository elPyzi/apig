import { describe, test, expect } from 'bun:test';
import type { OpenAPIV3 } from 'openapi-types';
import { buildParams } from '../build-params';
import { schemaNames, makeOperation } from './fixtures';

const withParams = (params: OpenAPIV3.ParameterObject[]) =>
  makeOperation({ parameters: params });

describe('buildParams', () => {
  describe('empty input', () => {
    test('no parameters leaves every array empty', () => {
      const result = buildParams({}, makeOperation(), schemaNames);

      expect(result).toEqual({ path: [], query: [], header: [] });
    });
  });

  describe('sorted by in', () => {
    test('a path parameter lands in params.path', () => {
      const result = buildParams(
        {},
        withParams([
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ]),
        schemaNames,
      );

      expect(result.path).toHaveLength(1);
      expect(result.query).toHaveLength(0);
      expect(result.header).toHaveLength(0);
      expect(result.path[0]).toMatchObject({ name: 'id', required: true });
    });

    test('a query parameter lands in params.query', () => {
      const result = buildParams(
        {},
        withParams([
          { name: 'page', in: 'query', schema: { type: 'integer' } },
        ]),
        schemaNames,
      );

      expect(result.query).toHaveLength(1);
      expect(result.path).toHaveLength(0);
      expect(result.header).toHaveLength(0);
    });

    test('a header parameter lands in params.header', () => {
      const result = buildParams(
        {},
        withParams([
          { name: 'X-Request-ID', in: 'header', schema: { type: 'string' } },
        ]),
        schemaNames,
      );

      expect(result.header).toHaveLength(1);
      expect(result.path).toHaveLength(0);
      expect(result.query).toHaveLength(0);
    });
  });

  describe('type mapping', () => {
    test('integer becomes number', () => {
      const result = buildParams(
        {},
        withParams([
          { name: 'page', in: 'query', schema: { type: 'integer' } },
        ]),
        schemaNames,
      );

      expect(result.query[0]!.type).toBe('number');
    });

    test('string stays string', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path', schema: { type: 'string' } }]),
        schemaNames,
      );

      expect(result.path[0]!.type).toBe('string');
    });

    test('a parameter without a schema becomes type unknown', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path' }]),
        schemaNames,
      );

      expect(result.path[0]!.type).toBe('unknown');
    });
  });

  describe('required', () => {
    test('required: true is carried through', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path', required: true }]),
        schemaNames,
      );

      expect(result.path[0]!.required).toBe(true);
    });

    test('a parameter without required becomes false', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'page', in: 'query' }]),
        schemaNames,
      );

      expect(result.query[0]!.required).toBe(false);
    });
  });

  describe('parameter schema', () => {
    test('the schema lands in irParam.schema', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path', schema: { type: 'string' } }]),
        schemaNames,
      );

      expect(result.path[0]!.schema).toMatchObject({ type: 'string' });
    });

    test('a parameter without a schema leaves schema undefined', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path' }]),
        schemaNames,
      );

      expect(result.path[0]!.schema).toBeUndefined();
    });
  });

  describe('pathItem and operation are merged', () => {
    test('parameters from both sources are merged', () => {
      const result = buildParams(
        { parameters: [{ name: 'Authorization', in: 'header' }] },
        withParams([{ name: 'id', in: 'path', required: true }]),
        schemaNames,
      );

      expect(result.path).toHaveLength(1);
      expect(result.header).toHaveLength(1);
    });

    test('pathItem parameters come before operation parameters', () => {
      const result = buildParams(
        { parameters: [{ name: 'Authorization', in: 'header' }] },
        withParams([{ name: 'X-Request-ID', in: 'header' }]),
        schemaNames,
      );

      expect(result.header[0]!.name).toBe('Authorization');
      expect(result.header[1]!.name).toBe('X-Request-ID');
    });
  });

  describe('parameter order', () => {
    test('several query parameters keep their order', () => {
      const result = buildParams(
        {},
        withParams([
          { name: 'page', in: 'query' },
          { name: 'limit', in: 'query' },
          { name: 'sort', in: 'query' },
        ]),
        schemaNames,
      );

      expect(result.query).toHaveLength(3);
      expect(result.query[0]!.name).toBe('page');
      expect(result.query[1]!.name).toBe('limit');
      expect(result.query[2]!.name).toBe('sort');
    });
  });

  describe('mixed parameters', () => {
    test('path + query + header together', () => {
      const result = buildParams(
        {},
        withParams([
          { name: 'id', in: 'path', required: true },
          { name: 'page', in: 'query' },
          { name: 'Authorization', in: 'header' },
        ]),
        schemaNames,
      );

      expect(result.path).toHaveLength(1);
      expect(result.query).toHaveLength(1);
      expect(result.header).toHaveLength(1);
      expect(result.path[0]!.name).toBe('id');
      expect(result.query[0]!.name).toBe('page');
      expect(result.header[0]!.name).toBe('Authorization');
    });
  });
});

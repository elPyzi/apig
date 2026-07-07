import { describe, test, expect } from 'bun:test';
import type { OpenAPIV3 } from 'openapi-types';
import { buildParams } from '../build-params';
import { schemaNames, makeOperation } from './fixtures';

const withParams = (params: OpenAPIV3.ParameterObject[]) =>
  makeOperation({ parameters: params });

describe('buildParams', () => {
  describe('пустые входные данные', () => {
    test('нет параметров в все массивы пустые', () => {
      const result = buildParams({}, makeOperation(), schemaNames);

      expect(result).toEqual({ path: [], query: [], header: [] });
    });
  });

  describe('сортировка по in', () => {
    test('path параметр попадает в params.path', () => {
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

    test('query параметр попадает в params.query', () => {
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

    test('header параметр попадает в params.header', () => {
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

  describe('маппинг типов', () => {
    test('integer в number', () => {
      const result = buildParams(
        {},
        withParams([
          { name: 'page', in: 'query', schema: { type: 'integer' } },
        ]),
        schemaNames,
      );

      expect(result.query[0].type).toBe('number');
    });

    test('string в string', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path', schema: { type: 'string' } }]),
        schemaNames,
      );

      expect(result.path[0].type).toBe('string');
    });

    test('параметр без schema в type unknown', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path' }]),
        schemaNames,
      );

      expect(result.path[0].type).toBe('unknown');
    });
  });

  describe('required', () => {
    test('required: true пробрасывается', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path', required: true }]),
        schemaNames,
      );

      expect(result.path[0].required).toBe(true);
    });

    test('параметр без required в false', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'page', in: 'query' }]),
        schemaNames,
      );

      expect(result.query[0].required).toBe(false);
    });
  });

  describe('schema параметра', () => {
    test('schema попадает в irParam.schema', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path', schema: { type: 'string' } }]),
        schemaNames,
      );

      expect(result.path[0].schema).toMatchObject({ type: 'string' });
    });

    test('параметр без schema в schema undefined', () => {
      const result = buildParams(
        {},
        withParams([{ name: 'id', in: 'path' }]),
        schemaNames,
      );

      expect(result.path[0].schema).toBeUndefined();
    });
  });

  describe('объединение pathItem и operation', () => {
    test('параметры из обоих источников объединяются', () => {
      const result = buildParams(
        { parameters: [{ name: 'Authorization', in: 'header' }] },
        withParams([{ name: 'id', in: 'path', required: true }]),
        schemaNames,
      );

      expect(result.path).toHaveLength(1);
      expect(result.header).toHaveLength(1);
    });

    test('pathItem параметры идут раньше operation параметров', () => {
      const result = buildParams(
        { parameters: [{ name: 'Authorization', in: 'header' }] },
        withParams([{ name: 'X-Request-ID', in: 'header' }]),
        schemaNames,
      );

      expect(result.header[0].name).toBe('Authorization');
      expect(result.header[1].name).toBe('X-Request-ID');
    });
  });

  describe('порядок параметров', () => {
    test('несколько query параметров сохраняют порядок', () => {
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
      expect(result.query[0].name).toBe('page');
      expect(result.query[1].name).toBe('limit');
      expect(result.query[2].name).toBe('sort');
    });
  });

  describe('смешанные параметры', () => {
    test('path + query + header одновременно', () => {
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
      expect(result.path[0].name).toBe('id');
      expect(result.query[0].name).toBe('page');
      expect(result.header[0].name).toBe('Authorization');
    });
  });
});

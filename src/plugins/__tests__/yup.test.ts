import { describe, test, expect } from 'bun:test';
import { yup, generateYup } from '../yup';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';
import { DEFAULTS } from '@models';
import type { IRSchema } from '@models';

const opts = (overrides = {}) => ({ ...DEFAULTS.PLUGINS.YUP, ...overrides });

describe('yup', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = yup();
      expect(plugin.name).toBe('yup');
      expect(plugin.fileName).toBe('yup');
      expect(plugin.scope).toBe('root');
    });

    test('withTypes defaults to true — generates the type', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number')],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('export type User =');
    });

    test('withTypes: false generates no type', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number')],
          }),
        ],
      );
      expect(
        generateYup(ir, baseConfig, {
          withTypes: false,
          schemaSuffix: 'Schema',
        }).code,
      ).not.toContain('export type User =');
    });
  });

  describe('empty IR', () => {
    test('contains the banner and the yup import', () => {
      const result = generateYup(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain("import * as yup from 'yup'");
    });
  });

  describe('object schema', () => {
    test('generates yup.object', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number'), makeProp('name', 'string')],
          }),
        ],
      );
      const result = generateYup(ir, baseConfig);
      expect(result.code).toContain('UserSchema = yup.object');
      expect(result.code).toContain('id: yup.number()');
      expect(result.code).toContain('name: yup.string()');
    });

    test('a required property gets .required()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number', true)],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('.required()');
    });

    test('an optional property gets .optional()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('age', 'number', false)],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('.optional()');
    });

    test('withTypes: true generates InferType', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number')],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain(
        'yup.InferType<typeof UserSchema>',
      );
    });

    test('withTypes: false generates no type', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number')],
          }),
        ],
      );
      const result = generateYup(ir, baseConfig, opts({ withTypes: false }));
      expect(result.code).not.toContain('yup.InferType');
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('string constraints', () => {
    const prop = (schema: IRSchema) => ({
      name: 'f',
      required: true,
      type: 'string' as const,
      schema,
    });

    test('email format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', format: 'email' })],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain(
        'yup.string().email()',
      );
    });

    test('uuid format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', format: 'uuid' })],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('yup.string().uuid()');
    });

    test('url format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', format: 'url' })],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('yup.string().url()');
    });

    test('minLength and maxLength', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', minLength: 2, maxLength: 50 })],
          }),
        ],
      );
      const code = generateYup(ir, baseConfig).code;
      expect(code).toContain('.min(2)');
      expect(code).toContain('.max(50)');
    });

    test('pattern through .matches()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', pattern: '^\\d+$' })],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('.matches(/^\\d+$/)');
    });

    test('binary format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', format: 'binary' })],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('yup.mixed<File>()');
    });
  });

  describe('numeric constraints', () => {
    test('minimum and maximum', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'n',
                required: true,
                type: 'number',
                schema: { type: 'number', minimum: 1, maximum: 99 },
              },
            ],
          }),
        ],
      );
      const code = generateYup(ir, baseConfig).code;
      expect(code).toContain('.min(1)');
      expect(code).toContain('.max(99)');
    });
  });

  describe('nullable', () => {
    test('a nullable property through .nullable()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'n',
                required: true,
                type: 'string',
                schema: { type: 'string', nullable: true },
              },
            ],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('.nullable()');
    });
  });

  describe('array schema', () => {
    test('generates yup.array().of()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'tags',
                required: true,
                type: 'array',
                schema: { type: 'array', items: { type: 'string' } },
              },
            ],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain(
        'yup.array().of(yup.string())',
      );
    });

    test('minItems and maxItems', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'tags',
                required: true,
                type: 'array',
                schema: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  maxItems: 5,
                },
              },
            ],
          }),
        ],
      );
      const code = generateYup(ir, baseConfig).code;
      expect(code).toContain('.min(1)');
      expect(code).toContain('.max(5)');
    });
  });

  describe('enum', () => {
    const enumSchema = makeSchema({
      name: 'Status',
      type: 'string',
      isEnum: true,
      enum: ['active', 'inactive'],
    });

    test('union style generates yup.mixed().oneOf()', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain("yup.mixed().oneOf(['active', 'inactive']");
    });

    test('union style generates an InferType type', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain('yup.InferType<typeof StatusSchema>');
    });

    test('const style generates an as const object', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'const',
      });
      expect(result.code).toContain('as const');
    });

    test('enum style generates a TypeScript enum', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'enum',
      });
      expect(result.code).toContain('enum Status');
    });
  });

  describe('composition', () => {
    test('allOf generates .concat()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Combined',
            type: 'allOf',
            schemas: [
              makeSchema({ name: 'A', type: 'object' }),
              makeSchema({ name: 'B', type: 'object' }),
            ],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('.concat(');
    });

    test('oneOf generates yup.mixed().oneOf()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'OneOf',
            type: 'oneOf',
            schemas: [
              makeSchema({ name: 'A', type: 'object' }),
              makeSchema({ name: 'B', type: 'object' }),
            ],
          }),
        ],
      );
      expect(generateYup(ir, baseConfig).code).toContain('yup.mixed().oneOf([');
    });
  });

  describe('exports', () => {
    test('exports holds suffixed names', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateYup(ir, baseConfig).exports).toContain('UserSchema');
    });

    test('typeExports holds unsuffixed names', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateYup(ir, baseConfig).typeExports).toContain('User');
    });
  });
});

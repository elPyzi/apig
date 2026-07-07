import { describe, test, expect } from 'bun:test';
import { yup, generateYup } from '../yup';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';

const opts = (overrides = {}) => ({
  withTypes: true,
  schemaSuffix: 'Schema',
  ...overrides,
});

describe('yup', () => {
  describe('фабрика', () => {
    test('возвращает плагин с правильными мета', () => {
      const plugin = yup();
      expect(plugin.name).toBe('yup');
      expect(plugin.fileName).toBe('yup');
      expect(plugin.scope).toBe('root');
    });

    test('withTypes по умолчанию true — генерирует тип', () => {
      const ir = makeIR(
        [],
        [makeSchema({ name: 'User', type: 'object', properties: [makeProp('id', 'number')] })],
      );
      expect(generateYup(ir, baseConfig).code).toContain('export type User =');
    });

    test('withTypes: false не генерирует тип', () => {
      const ir = makeIR(
        [],
        [makeSchema({ name: 'User', type: 'object', properties: [makeProp('id', 'number')] })],
      );
      expect(generateYup(ir, baseConfig, { withTypes: false, schemaSuffix: 'Schema' }).code).not.toContain('export type User =');
    });
  });

  describe('пустой IR', () => {
    test('содержит banner и импорт yup', () => {
      const result = generateYup(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain("import * as yup from 'yup'");
    });
  });

  describe('object schema', () => {
    test('генерирует yup.object', () => {
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

    test('required свойство с .required()', () => {
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

    test('optional свойство с .optional()', () => {
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

    test('withTypes: true генерирует InferType', () => {
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

    test('withTypes: false не генерирует тип', () => {
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

  describe('строковые констрейнты', () => {
    const prop = (schema) => ({
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

    test('minLength и maxLength', () => {
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

    test('pattern через .matches()', () => {
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

  describe('числовые констрейнты', () => {
    test('minimum и maximum', () => {
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
    test('nullable property через .nullable()', () => {
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
    test('генерирует yup.array().of()', () => {
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

    test('minItems и maxItems', () => {
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

    test('union style генерирует yup.mixed().oneOf()', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain("yup.mixed().oneOf(['active', 'inactive']");
    });

    test('union style генерирует InferType тип', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain('yup.InferType<typeof StatusSchema>');
    });

    test('const style генерирует as const объект', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'const',
      });
      expect(result.code).toContain('as const');
    });

    test('enum style генерирует TypeScript enum', () => {
      const result = generateYup(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'enum',
      });
      expect(result.code).toContain('enum Status');
    });
  });

  describe('composition', () => {
    test('allOf генерирует .concat()', () => {
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

    test('oneOf генерирует yup.mixed().oneOf()', () => {
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
    test('exports содержит имена с суффиксом', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateYup(ir, baseConfig).exports).toContain('UserSchema');
    });

    test('typeExports содержит имена без суффикса', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateYup(ir, baseConfig).typeExports).toContain('User');
    });
  });
});

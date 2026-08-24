import { describe, test, expect } from 'bun:test';
import { valibot, generateValibot } from '../valibot';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';
import { DEFAULTS } from '@models';
import type { IRSchema } from '@models';

const opts = (overrides = {}) => ({
  ...DEFAULTS.PLUGINS.VALIBOT,
  ...overrides,
});

describe('valibot', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = valibot();
      expect(plugin.name).toBe('valibot');
      expect(plugin.fileName).toBe('valibot');
      expect(plugin.scope).toBe('root');
    });

    test('withTypes defaults to true', () => {
      expect(valibot().withTypes).toBe(true);
    });

    test('withTypes: false is carried through', () => {
      expect(valibot({ withTypes: false }).withTypes).toBe(false);
    });
  });

  describe('empty IR', () => {
    test('contains the banner and the valibot import', () => {
      const result = generateValibot(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain("import * as v from 'valibot'");
    });
  });

  describe('object schema', () => {
    test('generates v.object', () => {
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
      const result = generateValibot(ir, baseConfig);
      expect(result.code).toContain('UserSchema = v.object');
      expect(result.code).toContain('id: v.number()');
      expect(result.code).toContain('name: v.string()');
    });

    test('an optional field gets v.optional()', () => {
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
      expect(generateValibot(ir, baseConfig).code).toContain(
        'v.optional(v.number())',
      );
    });

    test('withTypes: true generates an InferOutput type', () => {
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
      expect(generateValibot(ir, baseConfig).code).toContain(
        'v.InferOutput<typeof UserSchema>',
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
      const result = generateValibot(
        ir,
        baseConfig,
        opts({ withTypes: false }),
      );
      expect(result.code).not.toContain('v.InferOutput');
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
      expect(generateValibot(ir, baseConfig).code).toContain('v.email()');
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
      expect(generateValibot(ir, baseConfig).code).toContain('v.uuid()');
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
      expect(generateValibot(ir, baseConfig).code).toContain('v.url()');
    });

    test('date-time format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', format: 'date-time' })],
          }),
        ],
      );
      expect(generateValibot(ir, baseConfig).code).toContain(
        'v.isoTimestamp()',
      );
    });

    test('date format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', format: 'date' })],
          }),
        ],
      );
      expect(generateValibot(ir, baseConfig).code).toContain('v.isoDate()');
    });

    test('minLength and maxLength through v.pipe', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', minLength: 3, maxLength: 20 })],
          }),
        ],
      );
      const code = generateValibot(ir, baseConfig).code;
      expect(code).toContain('v.pipe(');
      expect(code).toContain('v.minLength(3)');
      expect(code).toContain('v.maxLength(20)');
    });

    test('pattern through v.regex', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [prop({ type: 'string', pattern: '^[a-z]+$' })],
          }),
        ],
      );
      expect(generateValibot(ir, baseConfig).code).toContain(
        'v.regex(/^[a-z]+$/)',
      );
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
      expect(generateValibot(ir, baseConfig).code).toContain(
        'v.instance(File)',
      );
    });
  });

  describe('numeric constraints', () => {
    test('minimum and maximum through v.pipe', () => {
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
                schema: { type: 'number', minimum: 0, maximum: 100 },
              },
            ],
          }),
        ],
      );
      const code = generateValibot(ir, baseConfig).code;
      expect(code).toContain('v.minValue(0)');
      expect(code).toContain('v.maxValue(100)');
    });
  });

  describe('nullable', () => {
    test('a nullable property through v.nullable()', () => {
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
      expect(generateValibot(ir, baseConfig).code).toContain('v.nullable(');
    });
  });

  describe('enum', () => {
    const enumSchema = makeSchema({
      name: 'Status',
      type: 'string',
      isEnum: true,
      enum: ['active', 'inactive'],
    });

    test('union style generates v.picklist', () => {
      const result = generateValibot(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain("v.picklist(['active', 'inactive'])");
    });

    test('union style generates an InferOutput type', () => {
      const result = generateValibot(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain('v.InferOutput<typeof StatusSchema>');
    });

    test('const style generates as const + picklist(Object.values)', () => {
      const result = generateValibot(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'const',
      });
      expect(result.code).toContain('as const');
      expect(result.code).toContain('v.picklist(Object.values(Status))');
    });

    test('enum style generates v.enum', () => {
      const result = generateValibot(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'enum',
      });
      expect(result.code).toContain('enum Status');
      expect(result.code).toContain('v.enum(Status)');
    });
  });

  describe('composition', () => {
    test('allOf generates v.intersect', () => {
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
      expect(generateValibot(ir, baseConfig).code).toContain('v.intersect([');
    });

    test('oneOf generates v.union', () => {
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
      expect(generateValibot(ir, baseConfig).code).toContain('v.union([');
    });

    test('oneOf with a discriminator generates v.variant', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'OneOf',
            type: 'oneOf',
            discriminator: 'kind',
            schemas: [
              makeSchema({ type: 'object' }),
              makeSchema({ type: 'object' }),
            ],
          }),
        ],
      );
      expect(generateValibot(ir, baseConfig).code).toContain(
        "v.variant('kind'",
      );
    });
  });

  describe('exports', () => {
    test('exports holds suffixed names', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateValibot(ir, baseConfig).exports).toContain('UserSchema');
    });

    test('typeExports holds unsuffixed names', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateValibot(ir, baseConfig).typeExports).toContain('User');
    });
  });
});

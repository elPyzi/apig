import { describe, test, expect } from 'bun:test';
import { zod, generateZod } from '../zod';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';
import type { IRSchema } from '@models';

describe('zod', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = zod();
      expect(plugin.name).toBe('zod');
      expect(plugin.fileName).toBe('zod');
      expect(plugin.scope).toBe('root');
    });

    test('withTypes defaults to true', () => {
      const plugin = zod();
      expect(plugin.withTypes).toBe(true);
    });

    test('withTypes: false is carried through', () => {
      const plugin = zod({ withTypes: false });
      expect(plugin.withTypes).toBe(false);
    });

    test('schemaSuffix defaults to Schema', () => {
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
      expect(generateZod(ir, baseConfig).code).toContain('UserSchema');
    });

    test('custom schemaSuffix', () => {
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
      const result = generateZod(ir, baseConfig, {
        schemaSuffix: 'Zod',
        infer: true,
        input: false,
        output: false,
        validateResponse: false,
        withTypes: true,
      });
      expect(result.code).toContain('UserZod');
    });
  });

  describe('empty IR', () => {
    test('contains the banner and the zod import', () => {
      const result = generateZod(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain("import { z } from 'zod'");
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('object schema', () => {
    test('generates z.object', () => {
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
      const result = generateZod(ir, baseConfig);
      expect(result.code).toContain('UserSchema = z.object');
      expect(result.code).toContain('id: z.number()');
      expect(result.code).toContain('name: z.string()');
    });

    test('a required field has no .optional()', () => {
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
      const result = generateZod(ir, baseConfig);
      expect(result.code).toContain('id: z.number()');
      expect(result.code).not.toContain('id: z.number().optional()');
    });

    test('an optional field gets .optional()', () => {
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
      expect(generateZod(ir, baseConfig).code).toContain(
        'z.number().optional()',
      );
    });

    test('withTypes: true generates a z.infer type', () => {
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
      expect(generateZod(ir, baseConfig).code).toContain(
        'export type User = z.infer<typeof UserSchema>',
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
      const result = generateZod(ir, baseConfig, {
        schemaSuffix: 'Schema',
        infer: true,
        input: false,
        output: false,
        validateResponse: false,
        withTypes: false,
      });
      expect(result.code).not.toContain('z.infer');
      expect(result.typeExports).toEqual([]);
    });

    test('input: true generates a z.input type', () => {
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
      const result = generateZod(ir, baseConfig, {
        schemaSuffix: 'Schema',
        infer: true,
        input: true,
        output: false,
        validateResponse: false,
        withTypes: true,
      });
      expect(result.code).toContain('z.input<typeof UserSchema>');
    });

    test('output: true generates a z.output type', () => {
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
      const result = generateZod(ir, baseConfig, {
        schemaSuffix: 'Schema',
        infer: true,
        input: false,
        output: true,
        validateResponse: false,
        withTypes: true,
      });
      expect(result.code).toContain('z.output<typeof UserSchema>');
    });
  });

  describe('string constraints', () => {
    const schemaWithStr = (
      format?: string,
      min?: number,
      max?: number,
      pattern?: string,
    ): IRSchema => ({
      type: 'string',
      format,
      minLength: min,
      maxLength: max,
      pattern,
    });

    test('email format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'email',
                required: true,
                type: 'string',
                schema: schemaWithStr('email'),
              },
            ],
          }),
        ],
      );
      expect(generateZod(ir, baseConfig).code).toContain('z.string().email()');
    });

    test('uuid format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'id',
                required: true,
                type: 'string',
                schema: schemaWithStr('uuid'),
              },
            ],
          }),
        ],
      );
      expect(generateZod(ir, baseConfig).code).toContain('z.string().uuid()');
    });

    test('url format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'url',
                required: true,
                type: 'string',
                schema: schemaWithStr('url'),
              },
            ],
          }),
        ],
      );
      expect(generateZod(ir, baseConfig).code).toContain('z.string().url()');
    });

    test('date-time format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'at',
                required: true,
                type: 'string',
                schema: schemaWithStr('date-time'),
              },
            ],
          }),
        ],
      );
      expect(generateZod(ir, baseConfig).code).toContain(
        'z.string().datetime()',
      );
    });

    test('minLength and maxLength', () => {
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
                schema: schemaWithStr(undefined, 3, 20),
              },
            ],
          }),
        ],
      );
      const code = generateZod(ir, baseConfig).code;
      expect(code).toContain('.min(3)');
      expect(code).toContain('.max(20)');
    });

    test('pattern', () => {
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
                schema: schemaWithStr(
                  undefined,
                  undefined,
                  undefined,
                  '^[a-z]+$',
                ),
              },
            ],
          }),
        ],
      );
      expect(generateZod(ir, baseConfig).code).toContain('.regex(/^[a-z]+$/)');
    });

    test('binary format', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'A',
            type: 'object',
            properties: [
              {
                name: 'f',
                required: true,
                type: 'string',
                schema: schemaWithStr('binary'),
              },
            ],
          }),
        ],
      );
      expect(generateZod(ir, baseConfig).code).toContain('z.instanceof(File)');
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
                schema: { type: 'number', minimum: 0, maximum: 100 },
              },
            ],
          }),
        ],
      );
      const code = generateZod(ir, baseConfig).code;
      expect(code).toContain('.min(0)');
      expect(code).toContain('.max(100)');
    });
  });

  describe('array schema', () => {
    test('generates z.array', () => {
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
      expect(generateZod(ir, baseConfig).code).toContain('z.array(z.string())');
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
                  maxItems: 10,
                },
              },
            ],
          }),
        ],
      );
      const code = generateZod(ir, baseConfig).code;
      expect(code).toContain('.min(1)');
      expect(code).toContain('.max(10)');
    });
  });

  describe('nullable', () => {
    test('a nullable object has no .nullable() (object properties only)', () => {
      const ir = makeIR(
        [],
        [makeSchema({ name: 'A', type: 'object', nullable: true })],
      );
      expect(generateZod(ir, baseConfig).code).not.toContain('.nullable()');
    });

    test('nullable property', () => {
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
      expect(generateZod(ir, baseConfig).code).toContain('.nullable()');
    });
  });

  describe('enum', () => {
    const enumSchema = makeSchema({
      name: 'Status',
      type: 'string',
      isEnum: true,
      enum: ['active', 'inactive'],
    });

    test('union style (default) generates z.enum', () => {
      const result = generateZod(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain("z.enum(['active', 'inactive'])");
    });

    test('union style generates a z.infer type', () => {
      const result = generateZod(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'union',
      });
      expect(result.code).toContain(
        'export type Status = z.infer<typeof StatusSchema>',
      );
    });

    test('const style generates as const + nativeEnum', () => {
      const result = generateZod(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'const',
      });
      expect(result.code).toContain('as const');
      expect(result.code).toContain('z.nativeEnum(Status)');
    });

    test('enum style generates a native enum + nativeEnum', () => {
      const result = generateZod(makeIR([], [enumSchema]), {
        ...baseConfig,
        enumStyle: 'enum',
      });
      expect(result.code).toContain('enum Status');
      expect(result.code).toContain('z.nativeEnum(Status)');
    });

    test('validateResponse generates a validate function', () => {
      const result = generateZod(makeIR([], [enumSchema]), baseConfig, {
        schemaSuffix: 'Schema',
        infer: true,
        input: false,
        output: false,
        validateResponse: true,
        withTypes: true,
      });
      expect(result.code).toContain('validateStatusResponse');
      expect(result.code).toContain('.parse(data)');
    });
  });

  describe('composition', () => {
    test('allOf generates .and()', () => {
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
      expect(generateZod(ir, baseConfig).code).toContain('.and(');
    });

    test('oneOf generates z.union', () => {
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
      expect(generateZod(ir, baseConfig).code).toContain('z.union([');
    });

    test('oneOf with a discriminator generates z.discriminatedUnion', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'OneOf',
            type: 'oneOf',
            discriminator: 'type',
            schemas: [
              makeSchema({ type: 'object' }),
              makeSchema({ type: 'object' }),
            ],
          }),
        ],
      );
      expect(generateZod(ir, baseConfig).code).toContain(
        "z.discriminatedUnion('type'",
      );
    });
  });

  describe('exports', () => {
    test('exports holds suffixed schema names', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({ name: 'User', type: 'object' }),
          makeSchema({ name: 'Post', type: 'object' }),
        ],
      );
      const result = generateZod(ir, baseConfig);
      expect(result.exports).toContain('UserSchema');
      expect(result.exports).toContain('PostSchema');
    });

    test('typeExports holds unsuffixed names', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateZod(ir, baseConfig).typeExports).toContain('User');
    });

    test('a schema without a name stays out of exports', () => {
      const ir = makeIR([], [makeSchema({ type: 'object' })]);
      expect(generateZod(ir, baseConfig).exports).toHaveLength(0);
    });
  });
});

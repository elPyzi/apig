import { describe, test, expect } from 'bun:test';
import { typescript, generateTypes } from '../typescript';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';

describe('typescript', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = typescript();
      expect(plugin.name).toBe('typescript');
      expect(plugin.fileName).toBe('types');
      expect(plugin.scope).toBe('root');
    });

    test('accepts empty options', () => {
      expect(() => typescript()).not.toThrow();
      expect(() => typescript({})).not.toThrow();
    });
  });

  describe('empty IR', () => {
    test('contains only the banner', () => {
      const result = generateTypes(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('object schema', () => {
    test('generates a type from an object schema', () => {
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
      const result = generateTypes(ir, baseConfig);
      expect(result.code).toContain('User');
      expect(result.code).toContain('id');
      expect(result.code).toContain('name');
    });

    test('adds the name to typeExports', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = generateTypes(ir, baseConfig);
      expect(result.typeExports).toContain('User');
    });

    test('every one of several schemas is generated', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({ name: 'User', type: 'object' }),
          makeSchema({ name: 'Post', type: 'object' }),
        ],
      );
      const result = generateTypes(ir, baseConfig);
      expect(result.code).toContain('User');
      expect(result.code).toContain('Post');
      expect(result.typeExports).toHaveLength(2);
    });

    test('a required property has no ?', () => {
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
      const result = generateTypes(ir, baseConfig);
      expect(result.code).toContain('id:');
      expect(result.code).not.toContain('id?:');
    });

    test('an optional property gets ?', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('nickname', 'string', false)],
          }),
        ],
      );
      const result = generateTypes(ir, baseConfig);
      expect(result.code).toContain('nickname?:');
    });
  });

  describe('names that are not identifiers', () => {
    test('a property name that is no identifier is quoted', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Pet',
            properties: [
              makeProp('id'),
              makeProp('created-at', 'string', false),
              makeProp('1st', 'number'),
              makeProp("it's"),
              {
                name: 'x-rank',
                required: false,
                type: 'string',
                schema: { type: 'string', isEnum: true, enum: ['1st', ''] },
              },
            ],
          }),
        ],
      );

      for (const typeStyle of ['type', 'interface'] as const) {
        const { code } = generateTypes(ir, { ...baseConfig, typeStyle });
        expect(code).toContain('  id: string;');
        expect(code).toContain("  'created-at'?: string;");
        expect(code).toContain("  '1st': number;");
        expect(code).toContain("  'it\\'s': string;");
        expect(code).toContain("  'x-rank'?: PetXRank;");
      }
    });

    test('a property inside an inline object is quoted too', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Pod',
            properties: [
              {
                name: 'metadata',
                required: true,
                type: 'object',
                schema: {
                  type: 'object',
                  properties: [makeProp('kebab-label')],
                },
              },
            ],
          }),
        ],
      );

      expect(generateTypes(ir, baseConfig).code).toContain(
        "  'kebab-label': string;",
      );
    });

    test('a dotted schema name is declared as an identifier', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({ name: 'v1.Pet', properties: [makeProp('id')] }),
          makeSchema({
            name: 'io.k8s.api.core.v1.Pod',
            properties: [
              {
                name: 'pet',
                required: false,
                type: 'object',
                schema: { type: 'object', name: 'v1.Pet' },
              },
            ],
          }),
        ],
      );
      const { code, typeExports } = generateTypes(ir, baseConfig);

      expect(code).toContain('export type V1Pet = {');
      expect(code).toContain('export type IoK8sApiCoreV1Pod = {');
      expect(code).toContain('  pet?: V1Pet;');
      expect(code).not.toContain('V1.Pet');
      expect(typeExports).toEqual(['V1Pet', 'IoK8sApiCoreV1Pod']);
    });

    test('an inline enum steps aside for a schema already declared by its name', () => {
      const status = {
        name: 'status',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const, isEnum: true, enum: ['a', 'b'] },
      };
      const ir = makeIR(
        [],
        [
          makeSchema({ name: 'Pet', properties: [status] }),
          makeSchema({
            name: 'PetStatus',
            type: 'string',
            isEnum: true,
            enum: ['x'],
          }),
        ],
      );
      const { code } = generateTypes(ir, baseConfig);

      expect(code).toContain('export type PetStatusEnum =');
      expect(code).toContain('  status: PetStatusEnum;');
      expect(code.match(/export type PetStatus =/g)).toHaveLength(1);
    });

    test('an inline enum value with a quote is escaped', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Pet',
            type: 'object',
            properties: [
              {
                name: 'tags',
                required: true,
                type: 'array',
                schema: {
                  type: 'array',
                  items: { type: 'string', isEnum: true, enum: ["it's", ''] },
                },
              },
            ],
          }),
        ],
      );

      expect(generateTypes(ir, baseConfig).code).toContain(
        "  tags: Array<'it\\'s' | ''>;",
      );
    });
  });

  describe('enum schema', () => {
    test('a value that is no identifier is quoted, in const and enum styles', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Period',
            type: 'string',
            isEnum: true,
            enum: ['1 (першы) квартал', "it's"],
          }),
        ],
      );
      const asConst = generateTypes(ir, { ...baseConfig, enumStyle: 'const' });
      const asEnum = generateTypes(ir, { ...baseConfig, enumStyle: 'enum' });

      expect(asConst.code).toContain(
        "  '1(першы)Квартал': '1 (першы) квартал',",
      );
      expect(asConst.code).toContain("'it\\'s'");
      expect(asEnum.code).toContain(
        "  '1(першы)Квартал' = '1 (першы) квартал',",
      );
    });

    test('union style (default) generates a type union', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Status',
            type: 'string',
            isEnum: true,
            enum: ['active', 'inactive'],
          }),
        ],
      );
      const result = generateTypes(ir, { ...baseConfig, enumStyle: 'union' });
      expect(result.code).toContain('Status');
      expect(result.code).toContain('active');
      expect(result.code).toContain('inactive');
    });

    test('const style generates an as const object', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Status',
            type: 'string',
            isEnum: true,
            enum: ['active', 'inactive'],
          }),
        ],
      );
      const result = generateTypes(ir, { ...baseConfig, enumStyle: 'const' });
      expect(result.code).toContain('as const');
    });

    test('enum style generates an enum', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Status',
            type: 'string',
            isEnum: true,
            enum: ['active', 'inactive'],
          }),
        ],
      );
      const result = generateTypes(ir, { ...baseConfig, enumStyle: 'enum' });
      expect(result.code).toContain('enum Status');
    });
  });

  describe('exports', () => {
    test('exports is always empty (typeExports only)', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = generateTypes(ir, baseConfig);
      expect(result.exports).toEqual([]);
    });

    test('a schema without a name stays out of typeExports', () => {
      const ir = makeIR([], [makeSchema({ type: 'object' })]);
      const result = generateTypes(ir, baseConfig);
      expect(result.typeExports).toEqual([]);
    });
  });
});

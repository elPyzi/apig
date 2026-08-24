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

  describe('enum schema', () => {
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

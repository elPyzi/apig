import { describe, test, expect } from 'bun:test';
import { typescript, generateTypes } from '../typescript';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';

describe('typescript', () => {
  describe('фабрика', () => {
    test('возвращает плагин с правильными мета', () => {
      const plugin = typescript();
      expect(plugin.name).toBe('typescript');
      expect(plugin.fileName).toBe('types');
      expect(plugin.scope).toBe('root');
    });

    test('принимает пустые опции', () => {
      expect(() => typescript()).not.toThrow();
      expect(() => typescript({})).not.toThrow();
    });
  });

  describe('пустой IR', () => {
    test('содержит только banner', () => {
      const result = generateTypes(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('object schema', () => {
    test('генерирует type из object схемы', () => {
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

    test('добавляет название в typeExports', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = generateTypes(ir, baseConfig);
      expect(result.typeExports).toContain('User');
    });

    test('несколько схем генерируются все', () => {
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

    test('required свойство без ?', () => {
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

    test('optional свойство с ?', () => {
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
    test('union style (default) генерирует type union', () => {
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

    test('const style генерирует as const объект', () => {
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

    test('enum style генерирует enum', () => {
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
    test('exports всегда пустой (только typeExports)', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = generateTypes(ir, baseConfig);
      expect(result.exports).toEqual([]);
    });

    test('схема без name не попадает в typeExports', () => {
      const ir = makeIR([], [makeSchema({ type: 'object' })]);
      const result = generateTypes(ir, baseConfig);
      expect(result.typeExports).toEqual([]);
    });
  });
});

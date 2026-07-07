import { describe, test, expect } from 'bun:test';
import { faker, generateFaker } from '../faker';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';

describe('faker', () => {
  describe('фабрика', () => {
    test('возвращает плагин с правильными мета', () => {
      const plugin = faker();
      expect(plugin.name).toBe('faker');
      expect(plugin.fileName).toBe('faker');
      expect(plugin.scope).toBe('root');
    });
  });

  describe('пустой IR', () => {
    test('содержит banner и импорт faker', () => {
      const result = generateFaker(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain('@faker-js/faker');
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('object schema', () => {
    test('генерирует фабричную функцию', () => {
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
      const result = generateFaker(ir, baseConfig);
      expect(result.code).toContain('export const generateUser');
      expect(result.code).toContain('(): User =>');
    });

    test('несколько схем генерируются все', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number')],
          }),
          makeSchema({
            name: 'Post',
            type: 'object',
            properties: [makeProp('title', 'string')],
          }),
        ],
      );
      const result = generateFaker(ir, baseConfig);
      expect(result.code).toContain('generateUser');
      expect(result.code).toContain('generatePost');
    });
  });

  describe('маппинг свойств по имени', () => {
    const makeUser = (prop: ReturnType<typeof makeProp>) =>
      makeIR(
        [],
        [makeSchema({ name: 'User', type: 'object', properties: [prop] })],
      );

    test('email → faker.internet.email()', () => {
      const prop = {
        name: 'email',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.internet.email()',
      );
    });

    test('password → faker.internet.password()', () => {
      const prop = {
        name: 'password',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.internet.password()',
      );
    });

    test('phone → faker.phone.number()', () => {
      const prop = {
        name: 'phone',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.phone.number()',
      );
    });

    test('firstName → faker.person.firstName()', () => {
      const prop = {
        name: 'firstname',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.person.firstName()',
      );
    });

    test('lastName → faker.person.lastName()', () => {
      const prop = {
        name: 'lastname',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.person.lastName()',
      );
    });

    test('name → faker.person.fullName()', () => {
      const prop = {
        name: 'username',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.internet.username()',
      );
    });

    test('id → faker.number.int()', () => {
      const prop = {
        name: 'id',
        required: true,
        type: 'number' as const,
        schema: { type: 'number' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.number.int()',
      );
    });

    test('url → faker.internet.url()', () => {
      const prop = {
        name: 'photo_url',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.internet.url()',
      );
    });

    test('date → faker.date.past().toISOString()', () => {
      const prop = {
        name: 'birthDate',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.date.past().toISOString()',
      );
    });
  });

  describe('типы значений', () => {
    test('number → faker.number.int()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('count', 'number')],
          }),
        ],
      );
      expect(generateFaker(ir, baseConfig).code).toContain(
        'faker.number.int()',
      );
    });

    test('boolean → faker.datatype.boolean()', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [
              {
                name: 'active',
                required: true,
                type: 'boolean',
                schema: { type: 'boolean' },
              },
            ],
          }),
        ],
      );
      expect(generateFaker(ir, baseConfig).code).toContain(
        'faker.datatype.boolean()',
      );
    });
  });

  describe('enum schema', () => {
    test('enum генерирует faker.helpers.arrayElement', () => {
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
      const result = generateFaker(ir, baseConfig);
      expect(result.code).toContain('generateStatus');
      expect(result.code).toContain(
        "faker.helpers.arrayElement(['active', 'inactive'])",
      );
    });
  });

  describe('ссылки между схемами', () => {
    test('поле ссылающееся на другую схему вызывает generate функцию', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Address',
            type: 'object',
            properties: [makeProp('city', 'string')],
          }),
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [
              {
                name: 'address',
                required: true,
                type: 'object',
                schema: { type: 'object', name: 'Address' },
              },
            ],
          }),
        ],
      );
      expect(generateFaker(ir, baseConfig).code).toContain('generateAddress()');
    });

    test('array поле с ref вызывает faker.helpers.multiple', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'Tag',
            type: 'object',
            properties: [makeProp('label', 'string')],
          }),
          makeSchema({
            name: 'Post',
            type: 'object',
            properties: [
              {
                name: 'tags',
                required: true,
                type: 'array',
                schema: {
                  type: 'array',
                  items: { type: 'object', name: 'Tag' },
                },
              },
            ],
          }),
        ],
      );
      expect(generateFaker(ir, baseConfig).code).toContain(
        'faker.helpers.multiple',
      );
    });
  });

  describe('imports', () => {
    test('импортирует только object схемы как типы', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({
            name: 'User',
            type: 'object',
            properties: [makeProp('id', 'number')],
          }),
          makeSchema({
            name: 'Status',
            type: 'string',
            isEnum: true,
            enum: ['a', 'b'],
          }),
        ],
      );
      const result = generateFaker(ir, baseConfig);
      expect(result.code).toContain('User');
    });
  });

  describe('exports', () => {
    test('exports содержит generate функции для object схем', () => {
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
      expect(generateFaker(ir, baseConfig).exports).toContain('generateUser');
    });

    test('typeExports всегда пустой', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateFaker(ir, baseConfig).typeExports).toEqual([]);
    });

    test('схема без name не попадает в exports', () => {
      const ir = makeIR([], [makeSchema({ type: 'object' })]);
      expect(generateFaker(ir, baseConfig).exports).toHaveLength(0);
    });
  });
});

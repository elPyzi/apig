import { describe, test, expect } from 'bun:test';
import { faker, generateFaker } from '../faker';
import { baseConfig, emptyIR, makeSchema, makeProp, makeIR } from './fixtures';

describe('faker', () => {
  const makeUser = (prop: ReturnType<typeof makeProp>) =>
    makeIR(
      [],
      [makeSchema({ name: 'User', type: 'object', properties: [prop] })],
    );

  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = faker();
      expect(plugin.name).toBe('faker');
      expect(plugin.fileName).toBe('faker');
      expect(plugin.scope).toBe('root');
    });
  });

  describe('empty IR', () => {
    test('contains the banner and the faker import', () => {
      const result = generateFaker(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain('@faker-js/faker');
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('object schema', () => {
    test('generates a factory function', () => {
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

    test('every one of several schemas is generated', () => {
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

  describe('properties are mapped by name', () => {
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

    test('a string id is not generated as a number', () => {
      const prop = {
        name: 'id',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const, format: 'uuid' },
      };
      const { code } = generateFaker(makeUser(prop), baseConfig);
      expect(code).toContain('faker.string.uuid()');
      expect(code).not.toContain('id: faker.number.int()');
    });

    test('a string id without a format still stays a string', () => {
      const prop = {
        name: 'ownerId',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'faker.string.uuid()',
      );
    });

    test('a name that merely contains "id" is not treated as an id', () => {
      const prop = {
        name: 'video',
        required: true,
        type: 'string' as const,
        schema: { type: 'string' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'video: faker.lorem.word()',
      );
    });

    test('a numeric field named like a date is not given an ISO string', () => {
      const prop = {
        name: 'birthDate',
        required: true,
        type: 'number' as const,
        schema: { type: 'number' as const },
      };
      expect(generateFaker(makeUser(prop), baseConfig).code).toContain(
        'birthDate: faker.number.int()',
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

  describe('schema format', () => {
    const withFormat = (name: string, format: string) => ({
      name,
      required: true,
      type: 'string' as const,
      schema: { type: 'string' as const, format },
    });

    test('format wins over the field name', () => {
      const { code } = generateFaker(
        makeUser(withFormat('name', 'email')),
        baseConfig,
      );
      expect(code).toContain('faker.internet.email()');
      expect(code).not.toContain('faker.person.fullName()');
    });

    test('date-time → an ISO timestamp', () => {
      expect(
        generateFaker(
          makeUser(withFormat('createdAt', 'date-time')),
          baseConfig,
        ).code,
      ).toContain('faker.date.past().toISOString()');
    });

    test('date → a calendar date, not a timestamp', () => {
      expect(
        generateFaker(makeUser(withFormat('bornOn', 'date')), baseConfig).code,
      ).toContain('faker.date.past().toISOString().slice(0, 10)');
    });

    test('uri → a URL', () => {
      expect(
        generateFaker(makeUser(withFormat('link', 'uri')), baseConfig).code,
      ).toContain('faker.internet.url()');
    });
  });

  describe('value types', () => {
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
    test('an enum generates faker.helpers.arrayElement', () => {
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

  describe('references between schemas', () => {
    test('a field referencing another schema calls its generate function', () => {
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

    test('an array field with a ref calls faker.helpers.multiple', () => {
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
    test('imports only object schemas as types', () => {
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
    test('exports holds generate functions for object schemas', () => {
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

    test('typeExports is always empty', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateFaker(ir, baseConfig).typeExports).toEqual([]);
    });

    test('a schema without a name stays out of exports', () => {
      const ir = makeIR([], [makeSchema({ type: 'object' })]);
      expect(generateFaker(ir, baseConfig).exports).toHaveLength(0);
    });
  });
});

import { describe, test, expect } from 'bun:test';
import { buildSchema } from '@services/parser/ir';

describe('buildSchema', () => {
  describe('примитивные типы', () => {
    test('string в string', () => {
      expect(buildSchema({ type: 'string' }).type).toBe('string');
    });

    test('integer в number', () => {
      expect(buildSchema({ type: 'integer' }).type).toBe('number');
    });

    test('number в number', () => {
      expect(buildSchema({ type: 'number' }).type).toBe('number');
    });

    test('boolean в boolean', () => {
      expect(buildSchema({ type: 'boolean' }).type).toBe('boolean');
    });

    test('null в null', () => {
      expect(buildSchema({ type: 'null' }).type).toBe('null');
    });

    test('неизвестный тип в unknown', () => {
      expect(
        buildSchema({ type: 'луууууччччч солнцаааа золотогооооо' }).type,
      ).toBe('unknown');
    });
  });

  describe('строковые ограничения', () => {
    test('пробрасывает minLength / maxLength / pattern', () => {
      const result = buildSchema({
        type: 'string',
        minLength: 3,
        maxLength: 100,
        pattern: '^[a-z]+$',
      });

      expect(result.minLength).toBe(3);
      expect(result.maxLength).toBe(100);
      expect(result.pattern).toBe('^[a-z]+$');
    });

    test('пробрасывает format', () => {
      const result = buildSchema({ type: 'string', format: 'date-time' });

      expect(result.format).toBe('date-time');
    });

    test('пробрасывает default', () => {
      const result = buildSchema({ type: 'string', default: 'active' });

      expect(result.default).toBe('active');
    });
  });

  describe('числовые ограничения', () => {
    test('пробрасывает minimum / maximum', () => {
      const result = buildSchema({ type: 'integer', minimum: 1, maximum: 100 });

      expect(result.minimum).toBe(1);
      expect(result.maximum).toBe(100);
    });
  });

  describe('enum', () => {
    test('isEnum: true и значения сохраняются', () => {
      const result = buildSchema({
        type: 'string',
        enum: ['active', 'inactive'],
      });

      expect(result.isEnum).toBe(true);
      expect(result.enum).toEqual(['active', 'inactive']);
    });

    test('числовые enum значения конвертируются в string', () => {
      const result = buildSchema({ type: 'integer', enum: [1, 2, 3] });

      expect(result.enum).toEqual(['1', '2', '3']);
    });
  });

  describe('array', () => {
    test('items рекурсивно обрабатывается', () => {
      const result = buildSchema({
        type: 'array',
        items: { type: 'string' },
      });

      expect(result.type).toBe('array');
      expect(result.items?.type).toBe('string');
    });

    test('пробрасывает minItems / maxItems', () => {
      const result = buildSchema({
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10,
      });

      expect(result.minItems).toBe(1);
      expect(result.maxItems).toBe(10);
    });

    test('вложенный array', () => {
      const result = buildSchema({
        type: 'array',
        items: { type: 'array', items: { type: 'number' } },
      });

      expect(result.items?.type).toBe('array');
      expect(result.items?.items?.type).toBe('number');
    });
  });

  describe('object', () => {
    test('свойства с required корректно маппятся', () => {
      const result = buildSchema({
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
      });

      expect(result.type).toBe('object');
      expect(result.properties).toHaveLength(2);
      expect(result.properties?.[0]).toMatchObject({
        name: 'id',
        required: true,
        type: 'number',
      });
      expect(result.properties?.[1]).toMatchObject({
        name: 'name',
        required: false,
        type: 'string',
      });
    });

    test('object без properties в пустой массив properties', () => {
      const result = buildSchema({ type: 'object' });

      expect(result.type).toBe('object');
      expect(result.properties).toEqual([]);
    });

    test('вложенный объект рекурсивно обрабатывается', () => {
      const result = buildSchema({
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: { city: { type: 'string' } },
          },
        },
      });

      const address = result.properties?.[0];
      expect(address?.name).toBe('address');
      expect(address?.schema?.type).toBe('object');
      expect(address?.schema?.properties?.[0]?.name).toBe('city');
    });

    test('nullable пробрасывается', () => {
      const result = buildSchema({ type: 'object', nullable: true });

      expect(result.nullable).toBe(true);
    });

    test('description пробрасывается', () => {
      const result = buildSchema({ type: 'string', description: 'User ID' });

      expect(result.description).toBe('User ID');
    });
  });

  describe('composition (allOf / oneOf / anyOf)', () => {
    test('allOf с одним элементом разворачивается', () => {
      const result = buildSchema({ allOf: [{ type: 'string' }] });

      expect(result.type).toBe('string');
    });

    test('allOf с несколькими элементами в type allOf', () => {
      const result = buildSchema({
        allOf: [{ type: 'string' }, { type: 'number' }],
      });

      expect(result.type).toBe('allOf');
      expect(result.schemas).toHaveLength(2);
    });

    test('oneOf в type oneOf со списком схем', () => {
      const result = buildSchema({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      });

      expect(result.type).toBe('oneOf');
      expect(result.schemas).toHaveLength(2);
    });

    test('anyOf в type anyOf со списком схем', () => {
      const result = buildSchema({
        anyOf: [{ type: 'string' }, { type: 'number' }],
      });

      expect(result.type).toBe('anyOf');
      expect(result.schemas).toHaveLength(2);
    });

    test('discriminator пробрасывается', () => {
      const result = buildSchema({
        oneOf: [{ type: 'string' }, { type: 'number' }],
        discriminator: { propertyName: 'type' },
      });

      expect(result.discriminator).toBe('type');
    });
  });

  describe('цикличные ссылки', () => {
    test('не уходит в бесконечную рекурсию', () => {
      const userSchema = { type: 'object', properties: {} };
      userSchema.properties.self = userSchema;

      const schemaNames = new Map([[userSchema, 'User']]);
      const result = buildSchema(userSchema, 'User', schemaNames);

      expect(result.properties?.[0].schema).toEqual({
        type: 'object',
        name: 'User',
      });
    });

    test('name пробрасывается при разрыве цикла', () => {
      const schema: any = { type: 'object', properties: {} };
      schema.properties.ref = schema;

      const schemaNames = new Map([[schema, 'MyModel']]);
      const result = buildSchema(schema, 'MyModel', schemaNames);

      expect(result.properties?.[0].schema?.name).toBe('MyModel');
    });
  });
});

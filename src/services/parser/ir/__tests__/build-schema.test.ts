import { describe, test, expect } from 'bun:test';
import { buildSchema } from '@services/parser/ir';
describe('buildSchema', () => {
  describe('primitive types', () => {
    test('string stays string', () => {
      expect(buildSchema({ type: 'string' }).type).toBe('string');
    });

    test('integer becomes number', () => {
      expect(buildSchema({ type: 'integer' }).type).toBe('number');
    });

    test('number stays number', () => {
      expect(buildSchema({ type: 'number' }).type).toBe('number');
    });

    test('boolean stays boolean', () => {
      expect(buildSchema({ type: 'boolean' }).type).toBe('boolean');
    });

    test('null stays null', () => {
      expect(buildSchema({ type: 'null' }).type).toBe('null');
    });

    test('an unknown type becomes unknown', () => {
      expect(
        buildSchema({ type: 'луууууччччч солнцаааа золотогооооо' }).type,
      ).toBe('unknown');
    });
  });

  describe('string constraints', () => {
    test('carries through minLength / maxLength / pattern', () => {
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

    test('carries through format', () => {
      const result = buildSchema({ type: 'string', format: 'date-time' });

      expect(result.format).toBe('date-time');
    });

    test('carries through default', () => {
      const result = buildSchema({ type: 'string', default: 'active' });

      expect(result.default).toBe('active');
    });
  });

  describe('numeric constraints', () => {
    test('carries through minimum / maximum', () => {
      const result = buildSchema({ type: 'integer', minimum: 1, maximum: 100 });

      expect(result.minimum).toBe(1);
      expect(result.maximum).toBe(100);
    });
  });

  describe('enum', () => {
    test('isEnum: true and the values are kept', () => {
      const result = buildSchema({
        type: 'string',
        enum: ['active', 'inactive'],
      });

      expect(result.isEnum).toBe(true);
      expect(result.enum).toEqual(['active', 'inactive']);
    });

    test('numeric enum values are converted to strings', () => {
      const result = buildSchema({ type: 'integer', enum: [1, 2, 3] });

      expect(result.enum).toEqual(['1', '2', '3']);
    });
  });

  describe('array', () => {
    test('items is handled recursively', () => {
      const result = buildSchema({
        type: 'array',
        items: { type: 'string' },
      });

      expect(result.type).toBe('array');
      expect(result.items?.type).toBe('string');
    });

    test('carries through minItems / maxItems', () => {
      const result = buildSchema({
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10,
      });

      expect(result.minItems).toBe(1);
      expect(result.maxItems).toBe(10);
    });

    test('nested array', () => {
      const result = buildSchema({
        type: 'array',
        items: { type: 'array', items: { type: 'number' } },
      });

      expect(result.items?.type).toBe('array');
      expect(result.items?.items?.type).toBe('number');
    });
  });

  describe('object', () => {
    test('required properties are mapped correctly', () => {
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

    test('an object without properties becomes an empty properties array', () => {
      const result = buildSchema({ type: 'object' });

      expect(result.type).toBe('object');
      expect(result.properties).toEqual([]);
    });

    test('a nested object is handled recursively', () => {
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

    test('nullable is carried through', () => {
      const result = buildSchema({ type: 'object', nullable: true });

      expect(result.nullable).toBe(true);
    });

    test('description is carried through', () => {
      const result = buildSchema({ type: 'string', description: 'User ID' });

      expect(result.description).toBe('User ID');
    });
  });

  describe('composition (allOf / oneOf / anyOf)', () => {
    test('allOf with a single member is unwrapped', () => {
      const result = buildSchema({ allOf: [{ type: 'string' }] });

      expect(result.type).toBe('string');
    });

    test('allOf with several members becomes type allOf', () => {
      const result = buildSchema({
        allOf: [{ type: 'string' }, { type: 'number' }],
      });

      expect(result.type).toBe('allOf');
      expect(result.schemas).toHaveLength(2);
    });

    test('oneOf becomes type oneOf with a schema list', () => {
      const result = buildSchema({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      });

      expect(result.type).toBe('oneOf');
      expect(result.schemas).toHaveLength(2);
    });

    test('anyOf becomes type anyOf with a schema list', () => {
      const result = buildSchema({
        anyOf: [{ type: 'string' }, { type: 'number' }],
      });

      expect(result.type).toBe('anyOf');
      expect(result.schemas).toHaveLength(2);
    });

    test('discriminator is carried through', () => {
      const result = buildSchema({
        oneOf: [{ type: 'string' }, { type: 'number' }],
        discriminator: { propertyName: 'type' },
      });

      expect(result.discriminator).toBe('type');
    });
  });

  describe('circular references', () => {
    test('does not recurse forever', () => {
      const userSchema: any = { type: 'object', properties: {} };
      userSchema.properties.self = userSchema;

      const schemaNames = new Map([[userSchema, 'User']]);
      const result = buildSchema(userSchema, 'User', schemaNames);

      expect(result.properties?.[0]!.schema).toEqual({
        type: 'object',
        name: 'User',
      });
    });

    test('name is kept when a cycle is broken', () => {
      const schema: any = { type: 'object', properties: {} };
      schema.properties.ref = schema;

      const schemaNames = new Map([[schema, 'MyModel']]);
      const result = buildSchema(schema, 'MyModel', schemaNames);

      expect(result.properties?.[0]!.schema?.name).toBe('MyModel');
    });
  });

  describe('OpenAPI 3.1', () => {
    test('type: ["string", "null"] becomes a nullable string', () => {
      const result = buildSchema({ type: ['string', 'null'] });

      expect(result.type).toBe('string');
      expect(result.nullable).toBe(true);
    });

    test('type: ["null"] alone becomes null', () => {
      expect(buildSchema({ type: ['null'] }).type).toBe('null');
    });

    test('a type array without null keeps its single type', () => {
      const result = buildSchema({ type: ['integer'] });

      expect(result.type).toBe('number');
      expect(result.nullable).toBeUndefined();
    });

    test('several types become anyOf', () => {
      const result = buildSchema({ type: ['string', 'number', 'null'] });

      expect(result.type).toBe('anyOf');
      expect(result.nullable).toBe(true);
      expect(result.schemas?.map((s) => s.type)).toEqual(['string', 'number']);
    });

    test('const becomes a single-value enum', () => {
      const result = buildSchema({ type: 'string', const: 'widget' });

      expect(result.isEnum).toBe(true);
      expect(result.enum).toEqual(['widget']);
    });

    test('numeric exclusiveMinimum / exclusiveMaximum are carried through', () => {
      const result = buildSchema({
        type: 'number',
        exclusiveMinimum: 0,
        exclusiveMaximum: 10,
      });

      expect(result.exclusiveMinimum).toBe(0);
      expect(result.exclusiveMaximum).toBe(10);
      expect(result.minimum).toBeUndefined();
      expect(result.maximum).toBeUndefined();
    });

    test('the 3.0 boolean form turns the neighbouring bound exclusive', () => {
      const result = buildSchema({
        type: 'number',
        minimum: 1,
        exclusiveMinimum: true,
      });

      expect(result.exclusiveMinimum).toBe(1);
      expect(result.minimum).toBeUndefined();
    });

    test('prefixItems becomes a tuple', () => {
      const result = buildSchema({
        type: 'array',
        prefixItems: [{ type: 'number' }, { type: 'string' }],
      });

      expect(result.type).toBe('tuple');
      expect(result.prefixItems?.map((s) => s.type)).toEqual([
        'number',
        'string',
      ]);
      expect(result.items).toBeUndefined();
    });

    test('items alongside prefixItems types the variadic rest', () => {
      const result = buildSchema({
        type: 'array',
        prefixItems: [{ type: 'number' }],
        items: { type: 'boolean' },
      });

      expect(result.type).toBe('tuple');
      expect(result.prefixItems).toHaveLength(1);
      expect(result.items?.type).toBe('boolean');
    });

    test('a plain 3.0 minimum stays inclusive', () => {
      const result = buildSchema({ type: 'number', minimum: 1 });

      expect(result.minimum).toBe(1);
      expect(result.exclusiveMinimum).toBeUndefined();
    });
  });
});

import type { OpenAPIV3 } from 'openapi-types';
import type { IRType, IRSchema, IRProperty } from '@models';

export type SchemaObject = OpenAPIV3.SchemaObject & { $ref?: string };

export const typeMap: Record<string, IRType> = {
  integer: 'number',
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  object: 'object',
  array: 'array',
  null: 'null',
};

export const buildSchema = (
  schema: SchemaObject,
  name?: string,
  schemaNames?: Map<object, string>,
  depth = 0,
): IRSchema => {
  if (depth > 0 && schemaNames?.has(schema)) {
    return { type: 'object', name: schemaNames.get(schema) };
  }

  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()!;
    return { type: 'unknown', name: refName };
  }

  const next = (s: SchemaObject, n?: string) =>
    buildSchema(s, n, schemaNames, depth + 1);

  const nullable = schema?.nullable;
  const description = schema.description;
  const format = schema.format;

  if (schema.allOf) {
    if (schema.allOf.length === 1) {
      return next(schema.allOf[0] as SchemaObject, name);
    }
    return {
      type: 'allOf',
      name,
      schemas: schema.allOf.map((s) => next(s as SchemaObject)),
      discriminator: schema.discriminator?.propertyName,
      nullable,
      description,
    };
  }

  if (schema.oneOf) {
    return {
      type: 'oneOf',
      name,
      schemas: schema.oneOf.map((s) => next(s as SchemaObject)),
      discriminator: schema.discriminator?.propertyName,
      nullable,
      description,
    };
  }

  if (schema.anyOf) {
    return {
      type: 'anyOf',
      name,
      schemas: schema.anyOf.map((s) => next(s as SchemaObject)),
      discriminator: schema.discriminator?.propertyName,
      nullable,
      description,
    };
  }

  if (schema.enum) {
    return {
      type: typeMap[schema.type ?? 'string'] ?? 'string',
      name,
      isEnum: true,
      enum: schema.enum.map(String),
      nullable: nullable || undefined,
      description,
    };
  }

  if (schema.type === 'array' && schema.items) {
    return {
      type: 'array',
      name,
      items: next(schema.items as SchemaObject),
      nullable: nullable || undefined,
      description,
      minItems: schema.minItems,
      maxItems: schema.maxItems,
    };
  }

  if (schema.type === 'object' || schema.properties) {
    const required = schema.required ?? [];
    const properties = Object.entries(schema.properties ?? {}).map(
      ([propName, propSchema]): IRProperty => {
        const prop = propSchema as SchemaObject;
        return {
          name: propName,
          required: required.includes(propName),
          type: typeMap[prop.type ?? ''] ?? 'unknown',
          schema: next(prop, propName),
          description: prop.description,
          deprecated: prop?.deprecated,
        };
      },
    );
    return {
      type: 'object',
      name,
      properties,
      required,
      nullable,
      description,
    };
  }

  return {
    type: typeMap[schema.type ?? ''] ?? 'unknown',
    name,
    nullable,
    format,
    description,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    minimum: schema.minimum,
    maximum: schema.maximum,
    pattern: schema.pattern,
    default: schema.default,
  };
};

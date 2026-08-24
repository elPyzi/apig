import type { IRType, IRSchema, IRProperty } from '@models';

/**
 * A schema as it may appear in either OpenAPI 3.0 or 3.1.
 *
 * 3.1 follows JSON Schema 2020-12, which widens several fields: `type` may be an
 * array, `exclusiveMinimum`/`exclusiveMaximum` hold numbers instead of booleans,
 * and `const` replaces single-value enums.
 */
export interface SchemaObject {
  $ref?: string;
  /** A plain name in 3.0; 3.1 also allows an array such as `["string", "null"]`. */
  type?: string | string[];
  /** 3.1 replacement for a single-value enum. */
  const?: unknown;
  enum?: unknown[];
  format?: string;
  description?: string;
  default?: unknown;
  /** 3.0 only — 3.1 expresses this as `"null"` inside `type`. */
  nullable?: boolean;
  deprecated?: boolean;
  required?: string[];
  properties?: Record<string, unknown>;
  items?: unknown;
  /** 3.1 tuples. Not modelled by the IR — treated as a plain array. */
  prefixItems?: unknown[];
  allOf?: unknown[];
  oneOf?: unknown[];
  anyOf?: unknown[];
  discriminator?: { propertyName: string };
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  /** A number in 3.1; a boolean flag on `minimum` in 3.0. */
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  minItems?: number;
  maxItems?: number;
  additionalProperties?: unknown;
}

export const typeMap: Record<string, IRType> = {
  integer: 'number',
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  object: 'object',
  array: 'array',
  null: 'null',
};

interface NormalizedType {
  /** Single remaining type name, or undefined when the schema is a union of several. */
  type?: string;
  /** Type names left when `null` is a union member and more than one type remains. */
  union?: string[];
  nullable?: boolean;
}

/**
 * Collapses the 3.1 array form of `type` into the single type plus a nullable
 * flag that the IR models, so `["string", "null"]` becomes a nullable string
 * rather than an unrecognized type.
 */
export const normalizeType = (schema: SchemaObject): NormalizedType => {
  const nullable = schema.nullable || undefined;

  if (!Array.isArray(schema.type)) {
    return { type: schema.type, nullable };
  }

  const withoutNull = schema.type.filter((t) => t !== 'null');
  const isNullable = schema.type.includes('null') || nullable;

  if (withoutNull.length === 0) return { type: 'null', nullable };
  if (withoutNull.length === 1)
    return { type: withoutNull[0], nullable: isNullable || undefined };

  return { union: withoutNull, nullable: isNullable || undefined };
};

/**
 * 3.0 spells an exclusive bound as a boolean next to `minimum`/`maximum`;
 * 3.1 puts the number directly in `exclusiveMinimum`/`exclusiveMaximum`.
 */
const exclusiveBound = (
  exclusive: number | boolean | undefined,
  inclusive: number | undefined,
): number | undefined => {
  if (typeof exclusive === 'number') return exclusive;
  if (exclusive === true) return inclusive;
  return undefined;
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

  const { type: schemaType, union, nullable } = normalizeType(schema);
  const description = schema.description;
  const format = schema.format;

  // 3.1 `type: ["string", "number"]` is a union of primitives — the IR already
  // models that as anyOf, so reuse it rather than inventing a second shape.
  if (union) {
    return {
      type: 'anyOf',
      name,
      schemas: union.map((t) => next({ ...schema, type: t } as SchemaObject)),
      nullable,
      description,
    };
  }

  // 3.1 replaces single-value enums with `const`
  if (schema.const !== undefined) {
    return {
      type: typeMap[schemaType ?? typeof schema.const] ?? 'string',
      name,
      isEnum: true,
      enum: [String(schema.const)],
      nullable,
      description,
    };
  }

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
      type: typeMap[schemaType ?? 'string'] ?? 'string',
      name,
      isEnum: true,
      enum: schema.enum.map(String),
      nullable,
      description,
    };
  }

  // 3.1 tuples: `prefixItems` types the fixed leading members, `items` (when
  // present alongside) types the variadic rest
  if (schema.prefixItems) {
    return {
      type: 'tuple',
      name,
      prefixItems: schema.prefixItems.map((s) => next(s as SchemaObject)),
      items: schema.items ? next(schema.items as SchemaObject) : undefined,
      nullable,
      description,
      minItems: schema.minItems,
      maxItems: schema.maxItems,
    };
  }

  if (schemaType === 'array' && schema.items) {
    return {
      type: 'array',
      name,
      items: next(schema.items as SchemaObject),
      nullable,
      description,
      minItems: schema.minItems,
      maxItems: schema.maxItems,
    };
  }

  if (schemaType === 'object' || schema.properties) {
    const required = schema.required ?? [];
    const properties = Object.entries(schema.properties ?? {}).map(
      ([propName, propSchema]): IRProperty => {
        const prop = propSchema as SchemaObject;
        return {
          name: propName,
          required: required.includes(propName),
          type: typeMap[normalizeType(prop).type ?? ''] ?? 'unknown',
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
    type: typeMap[schemaType ?? ''] ?? 'unknown',
    name,
    nullable,
    format,
    description,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    // a 3.0 boolean flag makes the neighbouring bound exclusive, so it must not
    // be reported as an inclusive one as well
    minimum: schema.exclusiveMinimum === true ? undefined : schema.minimum,
    maximum: schema.exclusiveMaximum === true ? undefined : schema.maximum,
    exclusiveMinimum: exclusiveBound(schema.exclusiveMinimum, schema.minimum),
    exclusiveMaximum: exclusiveBound(schema.exclusiveMaximum, schema.maximum),
    pattern: schema.pattern,
    default: schema.default,
  };
};

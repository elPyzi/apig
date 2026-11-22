import type { IRSchema, IRProperty } from '@models';
import { quoteKey, toPascalCase, toStringLiteral } from '@libs/string';
import { isSchemaReference } from '@services/codegen/common/schema-graph';

export const typeMap: Record<string, string> = {
  string: 'faker.lorem.word()',
  number: 'faker.number.int()',
  boolean: 'faker.datatype.boolean()',
  integer: 'faker.number.int()',
};

/**
 * Declared `format` beats every name heuristic below — it comes from the spec
 * rather than from guessing at the field name.
 */
export const formatMap: Record<string, string> = {
  uuid: 'faker.string.uuid()',
  email: 'faker.internet.email()',
  uri: 'faker.internet.url()',
  url: 'faker.internet.url()',
  hostname: 'faker.internet.domainName()',
  ipv4: 'faker.internet.ipv4()',
  ipv6: 'faker.internet.ipv6()',
  password: 'faker.internet.password()',
  'date-time': 'faker.date.past().toISOString()',
  date: 'faker.date.past().toISOString().slice(0, 10)',
};

/** How many levels of a recursive schema a factory builds before stopping. */
export const MAX_DEPTH = 2;

/**
 * Where a factory is being written. Inside the factory of a recursive schema
 * there is a `depth` parameter, and calls to other factories in the cycle
 * pass `depth + 1` along so the cycle can be cut.
 */
export interface FakerContext {
  recursive: Set<string>;
  guarded: boolean;
}

const NO_CONTEXT: FakerContext = { recursive: new Set(), guarded: false };

const factoryCall = (name: string, ctx: FakerContext): string => {
  const recurse = ctx.guarded && ctx.recursive.has(name);
  return `generate${toPascalCase(name)}(${recurse ? 'depth + 1' : ''})`;
};

const recurses = (code: string): boolean => code.includes('(depth + 1)');

/**
 * Arrays and optional properties are the only places a cycle can end in a
 * valid value, so that is where it is cut once `depth` runs out: an empty
 * array, or the property left out. A cycle made only of required single
 * references describes a value that cannot exist, and is left alone.
 */
export const cutArray = (expr: string): string =>
  recurses(expr) ? `(depth < ${MAX_DEPTH} ? ${expr} : [])` : expr;

export const fieldValue = (
  prop: IRProperty,
  schemas: IRSchema[],
  ctx: FakerContext = NO_CONTEXT,
): string => {
  const value = generateValue(prop, schemas, ctx);
  // an array already ends in `[]` at the limit, which an optional field accepts
  const alreadyCut = value.startsWith('(depth < ');
  return !prop.required && recurses(value) && !alreadyCut
    ? `depth < ${MAX_DEPTH} ? ${value} : undefined`
    : value;
};

/**
 * An object literal for inline properties, parenthesized so it reads as an
 * expression after an arrow too. Keys are quoted where needed: `X-Real-IP` and
 * `content-type` are ordinary property names in a spec.
 */
export const objectLiteral = (
  props: IRProperty[],
  schemas: IRSchema[],
  ctx: FakerContext = NO_CONTEXT,
): string =>
  `({ ${props.map((p) => `${quoteKey(p.name)}: ${fieldValue(p, schemas, ctx)}`).join(', ')} })`;

/** `id`, `ownerId`, `user_id` — but not `video` or `width`. */
const isIdName = (name: string): boolean =>
  name === 'id' || name.endsWith('id') || name.endsWith('_id');

export const generateValue = (
  prop: IRProperty,
  schemas: IRSchema[],
  ctx: FakerContext = NO_CONTEXT,
): string => {
  const schema = prop.schema;

  if (!schema) return typeMap[prop.type] ?? 'faker.lorem.word()';

  if (isSchemaReference(schema, schemas)) {
    return factoryCall(schema.name!, ctx);
  }

  // A `$ref` often arrives wrapped in a single-member composition, and without
  // this the whole thing fell through to a lorem word typed as the referenced
  // object.
  if (
    (schema.type === 'allOf' ||
      schema.type === 'oneOf' ||
      schema.type === 'anyOf') &&
    schema.schemas?.length
  ) {
    const first = schema.schemas[0]!;
    return generateValue(
      { ...prop, type: first.type, schema: first },
      schemas,
      ctx,
    );
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => toStringLiteral(v)).join(', ');
    return `faker.helpers.arrayElement([${values}])`;
  }

  if (schema.type === 'tuple' && schema.prefixItems) {
    // each member is generated as if it were a property, to reuse the ref,
    // inline-object and primitive handling below
    const members = schema.prefixItems
      .map((member, i) =>
        generateValue(
          {
            name: `${prop.name}${i}`,
            required: true,
            type: member.type,
            schema: member,
          },
          schemas,
          ctx,
        ),
      )
      .join(', ');
    return `[${members}]`;
  }

  if (schema.type === 'array' && schema.items) {
    const itemSchema = schema.items;
    if (isSchemaReference(itemSchema, schemas)) {
      return cutArray(
        `faker.helpers.multiple(() => ${factoryCall(itemSchema.name!, ctx)}, { count: 3 })`,
      );
    }
    if (itemSchema.type === 'object' && itemSchema.properties) {
      return cutArray(
        `faker.helpers.multiple(() => ${objectLiteral(itemSchema.properties, schemas, ctx)}, { count: 3 })`,
      );
    }
    // back through the value generator rather than a bare type lookup: an array
    // of enums was typed as `string[]` against a literal union
    const itemValue = generateValue(
      {
        name: prop.name,
        required: true,
        type: itemSchema.type,
        schema: itemSchema,
      },
      schemas,
      ctx,
    );
    return cutArray(`faker.helpers.multiple(() => ${itemValue}, { count: 3 })`);
  }

  // an inline object is built field by field; one with no declared fields —
  // a map typed only by additionalProperties — is satisfied by an empty one
  if (schema.type === 'object') {
    return schema.properties?.length
      ? objectLiteral(schema.properties, schemas, ctx)
      : '({})';
  }

  if (schema.format && formatMap[schema.format]) {
    return formatMap[schema.format]!;
  }

  const nameLower = prop.name.toLowerCase();
  // A field name only hints at the shape of a value, never at its type: an `id`
  // is a number in one spec and a uuid string in the next. Guessing past the
  // declared type is what made the generated factories fail to compile.
  const isNumeric = schema.type === 'number';
  const takesString = schema.type === 'string' || schema.type === 'unknown';
  const takesNumber = isNumeric || schema.type === 'unknown';

  switch (true) {
    case takesString && nameLower.includes('username'):
      return 'faker.internet.username()';
    case takesString && nameLower.includes('email'):
      return 'faker.internet.email()';
    case takesString && nameLower.includes('password'):
      return 'faker.internet.password()';
    case takesString && nameLower.includes('phone'):
      return 'faker.phone.number()';
    case takesString &&
      (nameLower.includes('url') || nameLower.includes('photo')):
      return 'faker.internet.url()';
    case takesString &&
      (nameLower === 'firstname' || nameLower === 'first_name'):
      return 'faker.person.firstName()';
    case takesString && (nameLower === 'lastname' || nameLower === 'last_name'):
      return 'faker.person.lastName()';
    case takesString && nameLower.includes('name'):
      return 'faker.person.fullName()';
    case takesString && nameLower.includes('date'):
      return 'faker.date.past().toISOString()';
    case (takesString || takesNumber) && nameLower.includes('status'):
      return isNumeric ? 'faker.number.int()' : 'faker.lorem.word()';
    case takesNumber && isIdName(nameLower):
      return 'faker.number.int()';
    case takesString && isIdName(nameLower):
      return 'faker.string.uuid()';
    default:
      return typeMap[schema.type] ?? 'faker.lorem.word()';
  }
};

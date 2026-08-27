import type { IRSchema, IRProperty } from '@models';
import { toPascalCase } from '@libs/string';

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

/** `id`, `ownerId`, `user_id` — but not `video` or `width`. */
const isIdName = (name: string): boolean =>
  name === 'id' || name.endsWith('id') || name.endsWith('_id');

export const generateValue = (
  prop: IRProperty,
  schemas: IRSchema[],
): string => {
  const schema = prop.schema;

  if (!schema) return typeMap[prop.type] ?? 'faker.lorem.word()';

  if (schema.name && schemas.some((s) => s.name === schema.name)) {
    return `generate${toPascalCase(schema.name)}()`;
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
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
        ),
      )
      .join(', ');
    return `[${members}]`;
  }

  if (schema.type === 'array' && schema.items) {
    const itemSchema = schema.items;
    if (itemSchema.name && schemas.some((s) => s.name === itemSchema.name)) {
      return `faker.helpers.multiple(() => generate${toPascalCase(itemSchema.name!)}(), { count: 3 })`;
    }
    if (itemSchema.type === 'object' && itemSchema.properties) {
      const inlineFields = itemSchema.properties
        .map((p) => `${p.name}: ${generateValue(p, schemas)}`)
        .join(', ');
      return `faker.helpers.multiple(() => ({ ${inlineFields} }), { count: 3 })`;
    }
    const itemValue = typeMap[itemSchema.type] ?? 'faker.lorem.word()';
    return `faker.helpers.multiple(() => ${itemValue}, { count: 3 })`;
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
    case nameLower.includes('status'):
      return isNumeric ? 'faker.number.int()' : 'faker.lorem.word()';
    case takesNumber && isIdName(nameLower):
      return 'faker.number.int()';
    case takesString && isIdName(nameLower):
      return 'faker.string.uuid()';
    default:
      return typeMap[schema.type] ?? 'faker.lorem.word()';
  }
};

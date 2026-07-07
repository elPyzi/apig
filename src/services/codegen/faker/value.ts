import type { IRSchema, IRProperty } from '@models';
import { toPascalCase } from '@libs/string';

export const typeMap: Record<string, string> = {
  string: 'faker.lorem.word()',
  number: 'faker.number.int()',
  boolean: 'faker.datatype.boolean()',
  integer: 'faker.number.int()',
};

export const generateValue = (prop: IRProperty, schemas: IRSchema[]): string => {
  const schema = prop.schema;

  if (!schema) return typeMap[prop.type] ?? 'faker.lorem.word()';

  if (schema.name && schemas.some((s) => s.name === schema.name)) {
    return `generate${toPascalCase(schema.name)}()`;
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
    return `faker.helpers.arrayElement([${values}])`;
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

  const nameLower = prop.name.toLowerCase();

  switch (true) {
    case nameLower === 'username' || nameLower.includes('username'):
      return 'faker.internet.username()';
    case nameLower.includes('email'):
      return 'faker.internet.email()';
    case nameLower.includes('password'):
      return 'faker.internet.password()';
    case nameLower.includes('phone'):
      return 'faker.phone.number()';
    case nameLower.includes('url') || nameLower.includes('photo'):
      return 'faker.internet.url()';
    case nameLower === 'firstname' || nameLower === 'first_name':
      return 'faker.person.firstName()';
    case nameLower === 'lastname' || nameLower === 'last_name':
      return 'faker.person.lastName()';
    case nameLower.includes('name'):
      return 'faker.person.fullName()';
    case nameLower.includes('date'):
      return 'faker.date.past().toISOString()';
    case nameLower.includes('status'):
      return schema.type === 'number' ? 'faker.number.int()' : 'faker.lorem.word()';
    case nameLower === 'id' || nameLower.includes('id'):
      return 'faker.number.int()';
    default:
      return typeMap[schema.type] ?? 'faker.lorem.word()';
  }
};

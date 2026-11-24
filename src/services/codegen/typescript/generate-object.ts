import { TYPE_STYLES, type ZvyappyConfig, type IRSchema } from '@models';
import { quoteKey, toPascalCase } from '@libs/string';
import { generateProperty } from '@services/codegen/common/generate-property';
import { buildJsDoc } from '@services/codegen/common/jsdoc';
import { generateEnumSchema } from '@services/codegen/typescript/generate-enum-schema';
import { inlineEnumNames } from '@services/codegen/typescript/inline-enum-names';

export const generateObject = (
  schema: IRSchema,
  config: ZvyappyConfig,
  allSchemas: IRSchema[],
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const style = config.typeStyle ?? TYPE_STYLES.TYPE;
  const extraTypes: string[] = [];
  const enumNames = inlineEnumNames(schema, allSchemas);

  const props = (schema.properties ?? [])
    .map((prop) => {
      const enumName = enumNames.get(prop.name);
      if (enumName && prop.schema) {
        extraTypes.push(
          generateEnumSchema({ ...prop.schema, name: enumName }, config),
        );
        const optional = prop.required ? '' : '?';
        const doc = buildJsDoc({
          description: prop.description,
          deprecated: prop.deprecated,
        });
        const docIndented = doc
          ? doc
              .split('\n')
              .map((l) => `  ${l}`)
              .join('\n')
              .trimEnd() + '\n'
          : '';
        return `${docIndented}  ${quoteKey(prop.name)}${optional}: ${enumName};`;
      }
      return generateProperty(prop, allSchemas);
    })
    .join('\n');

  const doc = buildJsDoc({ description: schema.description });
  const objectStr =
    style === TYPE_STYLES.INTERFACE
      ? `${doc}export interface ${name} {\n${props}\n}`
      : `${doc}export type ${name} = {\n${props}\n};`;

  return [...extraTypes, objectStr].join('\n');
};

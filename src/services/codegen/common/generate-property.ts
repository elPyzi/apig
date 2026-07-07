import type { IRProperty } from '@models';
import { generateTypeValue } from '@services/codegen/common/generate-type-value';
import { buildJsDoc } from '@services/codegen/common/jsdoc';

export const generateProperty = (prop: IRProperty): string => {
  const optional = prop.required ? '' : '?';
  const type = prop.schema ? generateTypeValue(prop.schema) : prop.type;
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
  return `${docIndented}  ${prop.name}${optional}: ${type};`;
};

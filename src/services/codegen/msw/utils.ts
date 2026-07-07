import type { IROperation, ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';

export const primitiveMap: Record<string, string> = {
  string: 'faker.lorem.word()',
  number: 'faker.number.int()',
  boolean: 'faker.datatype.boolean()',
};

export const hasFakerPlugin = (config: ApigConfig): boolean => {
  const plugins = config.plugins ?? [];
  return plugins.some((p) =>
    typeof p === 'string' ? p === 'faker' : p.name === 'faker',
  );
};

export const toMswPath = (path: string, baseUrl?: string): string => {
  const mswPath = path.replace(/\{(\w+)\}/g, ':$1');
  return baseUrl ? `${baseUrl}${mswPath}` : mswPath;
};

export const getFakerResponse = (operation: IROperation): string | null => {
  const { response } = operation;
  if (!response) return null;
  if (response.name) return `generate${toPascalCase(response.name)}()`;
  if (response.type === 'array' && response.items?.name)
    return `[generate${toPascalCase(response.items.name)}()]`;
  if (response.type && primitiveMap[response.type])
    return primitiveMap[response.type];
  return null;
};

export const getMswUsedGenerators = (operations: IROperation[]): Set<string> => {
  const usedGenerators = new Set<string>();
  for (const op of operations) {
    if (op.response?.name)
      usedGenerators.add(`generate${toPascalCase(op.response.name)}`);
    if (op.response?.items?.name)
      usedGenerators.add(`generate${toPascalCase(op.response.items.name)}`);
  }
  return usedGenerators;
};

export const getMswNeedsFaker = (operations: IROperation[]): boolean =>
  operations.some(
    (op) =>
      op.response?.type && primitiveMap[op.response.type] && !op.response.name,
  );

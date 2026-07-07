import { HTTP_METHODS, banner, type IR, type IROperation } from '@models';
import { toCamelCase } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import { buildArgsList, buildCallArgs } from '@services/codegen/common/build-args';

export const buildQueryKeyExpr = (
  operation: IROperation,
  args: ReturnType<typeof getArgs>,
  style: 'functions' | 'object',
): string => {
  const name = toCamelCase(operation.id);
  const callArgs = buildCallArgs(args);
  if (style === 'object') return `queryKeys.${name}(${callArgs})`;
  return `${name}QueryKey(${callArgs})`;
};

export const generateQueryKeyFn = (operation: IROperation): string => {
  const name = toCamelCase(operation.id);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const keyExpr = args.length > 0 ? `[${callArgs}]` : `[]`;
  return `export const ${name}QueryKey = (${argsList}) => ['${name}', ...${keyExpr}] as const;`;
};

export const buildQueryKeyEntry = (operation: IROperation): string => {
  const name = toCamelCase(operation.id);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const keyExpr = args.length > 0 ? `[${callArgs}]` : `[]`;
  return `  ${name}: (${argsList}) => ['${name}', ...${keyExpr}] as const,`;
};

export const generateQueryKeysFile = (ir: IR): string => {
  const getOps = ir.operations.filter((op) => op.method === HTTP_METHODS.GET);
  const entries = getOps.map(buildQueryKeyEntry).join('\n');
  return [banner, '', 'export const queryKeys = {', entries, '};', ''].join('\n');
};

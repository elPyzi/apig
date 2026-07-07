import { HTTP_METHODS, banner, type IR, type IROperation } from '@models';
import { toCamelCase } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import { buildArgsList, buildCallArgs } from '@services/codegen/common/build-args';

export const generateSwrKeyFn = (operation: IROperation): string => {
  const name = toCamelCase(operation.id);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const keyExpr = args.length > 0 ? `[${callArgs}]` : `[]`;
  return `export const ${name}SwrKey = (${argsList}) => ['${name}', ...${keyExpr}] as const;`;
};

export const buildSwrKeyEntry = (operation: IROperation): string => {
  const name = toCamelCase(operation.id);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const keyExpr = args.length > 0 ? `[${callArgs}]` : `[]`;
  return `  ${name}: (${argsList}) => ['${name}', ...${keyExpr}] as const,`;
};

export const buildSwrKeyExpr = (
  operation: IROperation,
  args: ReturnType<typeof getArgs>,
  style: 'functions' | 'object',
): string => {
  const name = toCamelCase(operation.id);
  const callArgs = buildCallArgs(args);
  if (style === 'object') return `swrKeys.${name}(${callArgs})`;
  return `${name}SwrKey(${callArgs})`;
};

export const generateSwrKeysFile = (ir: IR): string => {
  const getOps = ir.operations.filter((op) => op.method === HTTP_METHODS.GET);
  const entries = getOps.map(buildSwrKeyEntry).join('\n');
  return [banner, '', 'export const swrKeys = {', entries, '};', ''].join('\n');
};

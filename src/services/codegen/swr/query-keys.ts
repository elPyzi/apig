import {
  HTTP_METHODS,
  banner,
  type ApigConfig,
  type IR,
  type IROperation,
} from '@models';
import { getArgs } from '@services/codegen/common/get-args';
import {
  buildArgsList,
  buildCallArgs,
} from '@services/codegen/common/build-args';
import { getFunctionName } from '@services/codegen/common/get-function-name';

export const generateSwrKeyFn = (
  config: ApigConfig,
  operation: IROperation,
): string => {
  const name = getFunctionName(operation, config);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const keyExpr = args.length > 0 ? `[${callArgs}]` : `[]`;
  return `export const ${name}SwrKey = (${argsList}) => ['${name}', ...${keyExpr}] as const;`;
};

export const buildSwrKeyEntry = (
  config: ApigConfig,
  operation: IROperation,
): string => {
  const name = getFunctionName(operation, config);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const keyExpr = args.length > 0 ? `[${callArgs}]` : `[]`;
  return `  ${name}: (${argsList}) => ['${name}', ...${keyExpr}] as const,`;
};

export const buildSwrKeyExpr = (
  config: ApigConfig,
  operation: IROperation,
  args: ReturnType<typeof getArgs>,
  style: 'functions' | 'object',
): string => {
  const name = getFunctionName(operation, config);
  const callArgs = buildCallArgs(args);
  if (style === 'object') return `swrKeys.${name}(${callArgs})`;
  return `${name}SwrKey(${callArgs})`;
};

export const generateSwrKeysFile = (config: ApigConfig, ir: IR): string => {
  const getOps = ir.operations.filter((op) => op.method === HTTP_METHODS.GET);
  const entries = getOps.map((op) => buildSwrKeyEntry(config, op)).join('\n');
  return [banner, '', 'export const swrKeys = {', entries, '};', ''].join('\n');
};

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

export const buildQueryKeyExpr = (
  config: ApigConfig,
  operation: IROperation,
  args: ReturnType<typeof getArgs>,
  style: 'functions' | 'object',
): string => {
  const name = getFunctionName(operation, config);
  const callArgs = buildCallArgs(args);
  if (style === 'object') return `queryKeys.${name}(${callArgs})`;
  return `${name}QueryKey(${callArgs})`;
};

export const generateQueryKeyFn = (
  config: ApigConfig,
  operation: IROperation,
): string => {
  const name = getFunctionName(operation, config);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const keyExpr = args.length > 0 ? `[${callArgs}]` : `[]`;
  return `export const ${name}QueryKey = (${argsList}) => ['${name}', ...${keyExpr}] as const;`;
};

export const buildQueryKeyEntry = (
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

export const generateQueryKeysFile = (config: ApigConfig, ir: IR): string => {
  const getOps = ir.operations.filter((op) => op.method === HTTP_METHODS.GET);
  const entries = getOps.map((op) => buildQueryKeyEntry(config, op)).join('\n');
  return [banner, '', 'export const queryKeys = {', entries, '};', ''].join(
    '\n',
  );
};

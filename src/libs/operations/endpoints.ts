import type { IR } from '@models';
import { banner } from '@constants';
import { toCamelCase } from '@libs/string';

export const generateEndpoints = (ir: IR): string => {
  const entries = ir.operations
    .map((op) => `  ${toCamelCase(op.id)}: '${op.path}',`)
    .join('\n');

  return [
    banner,
    '',
    'export const ENDPOINTS = {',
    entries,
    '} as const;',
    '',
    'export type EndpointKey = keyof typeof ENDPOINTS;',
    '',
  ].join('\n');
};

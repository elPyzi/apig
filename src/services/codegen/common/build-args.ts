import type { FnArg } from '@services/codegen/common/get-args';

export const buildArgsList = (args: FnArg[]): string =>
  args.map((a) => `${a.name}${a.required ? '' : '?'}: ${a.type}`).join(', ');

export const buildCallArgs = (args: FnArg[]): string =>
  args.map((a) => a.name).join(', ');

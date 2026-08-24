import type { FnArg } from '@services/codegen/common/get-args';

/**
 * Renders a parameter list.
 *
 * TypeScript forbids a required parameter after an optional one, so an optional
 * argument that still has required arguments after it keeps its position and
 * widens to `| undefined` rather than taking a `?`. Without this an endpoint
 * with optional query params and a required body would not compile.
 */
export const buildArgsList = (args: FnArg[]): string =>
  args
    .map((arg, index) => {
      if (arg.required) return `${arg.name}: ${arg.type}`;

      const requiredAfter = args.slice(index + 1).some((a) => a.required);
      return requiredAfter
        ? `${arg.name}: ${arg.type} | undefined`
        : `${arg.name}?: ${arg.type}`;
    })
    .join(', ');

export const buildCallArgs = (args: FnArg[]): string =>
  args.map((a) => a.name).join(', ');

import type { TanstackFrameworkConfig } from './framework';

export const buildTanstackImports = (
  opts: {
    query?: boolean;
    mutation?: boolean;
    infinite?: boolean;
    suspense?: boolean;
  },
  fw: TanstackFrameworkConfig,
): string => {
  const h = fw.hookFn;
  const t = fw.typeFn;
  const values: string[] = [];
  const types: string[] = [];

  if (opts.query) {
    values.push(`${h}Query`, 'queryOptions');
    types.push(`${t}QueryOptions`);
  }
  if (opts.mutation) {
    values.push(`${h}Mutation`);
    types.push(`${t}MutationOptions`);
  }
  if (opts.infinite) {
    values.push(`${h}InfiniteQuery`);
    types.push(`${t}InfiniteQueryOptions`, 'InfiniteData');
  }
  if (opts.suspense) {
    values.push(`${h}SuspenseQuery`);
    types.push(`${t}SuspenseQueryOptions`);
  }

  const typeImport = types.length ? `, type ${types.join(', type ')}` : '';
  return `import { ${values.join(', ')}${typeImport} } from '${fw.pkg}';`;
};

export const buildTanstackImports = (
  opts: { query?: boolean; mutation?: boolean; infinite?: boolean; suspense?: boolean },
): string => {
  const values: string[] = [];
  const types: string[] = [];

  if (opts.query) {
    values.push('useQuery', 'queryOptions');
    types.push('UseQueryOptions');
  }
  if (opts.mutation) {
    values.push('useMutation');
    types.push('UseMutationOptions');
  }
  if (opts.infinite) {
    values.push('useInfiniteQuery');
    types.push('UseInfiniteQueryOptions', 'InfiniteData');
  }
  if (opts.suspense) {
    values.push('useSuspenseQuery');
    types.push('UseSuspenseQueryOptions');
  }

  const typeImport = types.length ? `, type ${types.join(', type ')}` : '';
  return `import { ${values.join(', ')}${typeImport} } from '@tanstack/react-query';`;
};

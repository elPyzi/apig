import type { TanstackFramework } from '@models';

export interface TanstackFrameworkConfig {
  /** npm package to import from */
  pkg: string;
  /** Hook function prefix: useQuery vs createQuery */
  hookFn: 'use' | 'create';
  /** Type prefix: UseQueryOptions vs CreateQueryOptions */
  typeFn: 'Use' | 'Create';
  /** Generated export name prefix: useGetUsers vs createGetUsers */
  exportPrefix: 'use' | 'create';
}

const FRAMEWORK_CONFIGS: Record<TanstackFramework, TanstackFrameworkConfig> = {
  react: {
    pkg: '@tanstack/react-query',
    hookFn: 'use',
    typeFn: 'Use',
    exportPrefix: 'use',
  },
  vue: {
    pkg: '@tanstack/vue-query',
    hookFn: 'use',
    typeFn: 'Use',
    exportPrefix: 'use',
  },
  solid: {
    pkg: '@tanstack/solid-query',
    hookFn: 'create',
    typeFn: 'Create',
    exportPrefix: 'create',
  },
  svelte: {
    pkg: '@tanstack/svelte-query',
    hookFn: 'create',
    typeFn: 'Create',
    exportPrefix: 'create',
  },
};

export const getFrameworkConfig = (
  framework: TanstackFramework = 'react',
): TanstackFrameworkConfig => FRAMEWORK_CONFIGS[framework];

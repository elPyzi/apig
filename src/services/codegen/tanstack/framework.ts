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
  /**
   * Whether the hook takes its options as an accessor rather than an object.
   * Solid's bindings type `CreateQueryOptions` as `Accessor<…>`, so the options
   * have to be wrapped in a thunk and the user-facing type unwrapped from it.
   */
  optionsAreAccessors: boolean;
}

const FRAMEWORK_CONFIGS: Record<TanstackFramework, TanstackFrameworkConfig> = {
  react: {
    pkg: '@tanstack/react-query',
    hookFn: 'use',
    typeFn: 'Use',
    exportPrefix: 'use',
    optionsAreAccessors: false,
  },
  vue: {
    pkg: '@tanstack/vue-query',
    hookFn: 'use',
    typeFn: 'Use',
    exportPrefix: 'use',
    optionsAreAccessors: false,
  },
  solid: {
    pkg: '@tanstack/solid-query',
    hookFn: 'create',
    typeFn: 'Create',
    exportPrefix: 'create',
    optionsAreAccessors: true,
  },
  svelte: {
    pkg: '@tanstack/svelte-query',
    hookFn: 'create',
    typeFn: 'Create',
    exportPrefix: 'create',
    optionsAreAccessors: false,
  },
};

export const getFrameworkConfig = (
  framework: TanstackFramework = 'react',
): TanstackFrameworkConfig => FRAMEWORK_CONFIGS[framework];

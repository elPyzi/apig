import { describe, test, expect } from 'bun:test';
import { tanstackQuery, generateTanstack } from '../tanstack';
import { baseConfig, emptyIR, makeOperation, makeIR } from './fixtures';
import { HTTP_METHODS, DEFAULTS } from '@models';

const DEFAULT_OPTS = DEFAULTS.PLUGINS.TANSTACK;

describe('tanstack-query', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = tanstackQuery();
      expect(plugin.name).toBe('tanstack-query');
      expect(plugin.fileName).toBe('tanstack');
      expect(plugin.scope).toBe('operations');
    });

    test('queryKeysStyle: object adds generateRootFiles', () => {
      const plugin = tanstackQuery({ queryKeysStyle: 'object' });
      expect(plugin.generateRootFiles).toBeDefined();
    });

    test('queryKeysStyle: functions adds no generateRootFiles', () => {
      const plugin = tanstackQuery({ queryKeysStyle: 'functions' });
      expect(plugin.generateRootFiles).toBeUndefined();
    });

    test('generateRootFiles returns query-keys.ts', () => {
      const plugin = tanstackQuery({ queryKeysStyle: 'object' });
      const files = plugin.generateRootFiles!(emptyIR, baseConfig);
      expect(files).toHaveLength(1);
      expect(files[0]!.fileName).toBe('query-keys.ts');
    });
  });

  describe('empty IR', () => {
    test('contains the banner and tanstack-query imports', () => {
      const result = generateTanstack(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain('@tanstack/react-query');
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('GET operations (query)', () => {
    const getOp = makeOperation({
      id: 'getUsers',
      method: HTTP_METHODS.GET,
      path: '/users',
    });

    test('generates a queryKey function', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.code).toContain('getUsersQueryKey');
    });

    test('generates queryOptions', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.code).toContain('getUsersQueryOptions');
    });

    test('generates the useGetUsersQuery hook', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.code).toContain('useGetUsersQuery');
    });

    test('exports holds queryKey, queryOptions and the hook', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.exports).toContain('getUsersQueryKey');
      expect(result.exports).toContain('getUsersQueryOptions');
      expect(result.exports).toContain('useGetUsersQuery');
    });
  });

  describe('mutation operations', () => {
    const postOp = makeOperation({
      id: 'createUser',
      method: HTTP_METHODS.POST,
      path: '/users',
    });

    test('generates the useCreateUserMutation hook', () => {
      const result = generateTanstack(makeIR([postOp]), baseConfig);
      expect(result.code).toContain('useCreateUserMutation');
    });

    test('exports holds the mutation hook', () => {
      expect(generateTanstack(makeIR([postOp]), baseConfig).exports).toContain(
        'useCreateUserMutation',
      );
    });

    test('a DELETE operation generates a mutation', () => {
      const op = makeOperation({
        id: 'deleteUser',
        method: HTTP_METHODS.DELETE,
        path: '/users/1',
      });
      expect(generateTanstack(makeIR([op]), baseConfig).exports).toContain(
        'useDeleteUserMutation',
      );
    });
  });

  describe('options', () => {
    const getOp = makeOperation({ id: 'getItems', method: HTTP_METHODS.GET });

    test('query: false generates no query hooks', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './requests',
        './query-keys',
        { ...DEFAULT_OPTS, query: false },
      );
      expect(result.exports).not.toContain('useGetItemsQuery');
    });

    test('mutation: false generates no mutation hooks', () => {
      const postOp = makeOperation({
        id: 'createItem',
        method: HTTP_METHODS.POST,
      });
      const result = generateTanstack(
        makeIR([postOp]),
        baseConfig,
        './requests',
        './query-keys',
        { ...DEFAULT_OPTS, mutation: false },
      );
      expect(result.exports).not.toContain('useCreateItemMutation');
    });

    test('infinite: true generates an infinite query', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './requests',
        './query-keys',
        { ...DEFAULT_OPTS, infinite: true },
      );
      expect(result.exports).toContain('useInfinityGetItemsQuery');
    });

    test('suspense: true generates a suspense query', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './requests',
        './query-keys',
        { ...DEFAULT_OPTS, suspense: true },
      );
      expect(result.exports).toContain('useSuspenseGetItemsQuery');
    });
  });

  describe('queryKeysStyle: object', () => {
    const getOp = makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET });

    test('generates no standalone queryKey function', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './requests',
        './query-keys',
        { ...DEFAULT_OPTS, queryKeysStyle: 'object' },
      );
      expect(result.exports).not.toContain('getUsersQueryKey');
    });

    test('imports queryKeys from queryKeysImportPath', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './requests',
        './query-keys',
        { ...DEFAULT_OPTS, queryKeysStyle: 'object' },
      );
      expect(result.code).toContain("from './query-keys'");
    });
  });

  describe('type imports', () => {
    test('imports the response type when it has a name', () => {
      const op = makeOperation({
        response: { type: 'object', name: 'User' },
      });
      expect(generateTanstack(makeIR([op]), baseConfig).code).toContain('User');
    });

    test('imports the request function', () => {
      const op = makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET });
      expect(generateTanstack(makeIR([op]), baseConfig).code).toContain(
        "from './requests'",
      );
    });
  });

  describe('several operations', () => {
    test('generates hooks for every operation', () => {
      const ir = makeIR([
        makeOperation({
          id: 'getUsers',
          method: HTTP_METHODS.GET,
          path: '/users',
        }),
        makeOperation({
          id: 'getUser',
          method: HTTP_METHODS.GET,
          path: '/users/1',
        }),
        makeOperation({
          id: 'createUser',
          method: HTTP_METHODS.POST,
          path: '/users',
        }),
      ]);
      const result = generateTanstack(ir, baseConfig);
      expect(result.exports).toContain('useGetUsersQuery');
      expect(result.exports).toContain('useGetUserQuery');
      expect(result.exports).toContain('useCreateUserMutation');
    });
  });

  describe('framework', () => {
    const ir = makeIR([
      makeOperation({
        id: 'getUsers',
        method: HTTP_METHODS.GET,
        path: '/users',
      }),
      makeOperation({
        id: 'createUser',
        method: HTTP_METHODS.POST,
        path: '/users',
      }),
    ]);

    test('react (default) — imports from @tanstack/react-query with use* hooks', () => {
      const result = generateTanstack(ir, baseConfig);
      expect(result.code).toContain("from '@tanstack/react-query'");
      expect(result.code).toContain('useQuery');
      expect(result.code).toContain('useMutation');
      expect(result.exports).toContain('useGetUsersQuery');
      expect(result.exports).toContain('useCreateUserMutation');
    });

    test('vue — imports from @tanstack/vue-query with use* hooks', () => {
      const opts = {
        ...DEFAULT_OPTS,
        hookGenerationStrategies: {},
        framework: 'vue' as const,
      };
      const result = generateTanstack(
        ir,
        baseConfig,
        './requests',
        './query-keys',
        opts,
      );
      expect(result.code).toContain("from '@tanstack/vue-query'");
      expect(result.code).toContain('useQuery');
      expect(result.exports).toContain('useGetUsersQuery');
      expect(result.exports).toContain('useCreateUserMutation');
    });

    test('solid — imports from @tanstack/solid-query with create* hooks', () => {
      const opts = {
        ...DEFAULT_OPTS,
        hookGenerationStrategies: {},
        framework: 'solid' as const,
      };
      const result = generateTanstack(
        ir,
        baseConfig,
        './requests',
        './query-keys',
        opts,
      );
      expect(result.code).toContain("from '@tanstack/solid-query'");
      expect(result.code).toContain('createQuery');
      expect(result.code).toContain('createMutation');
      expect(result.exports).toContain('createGetUsersQuery');
      expect(result.exports).toContain('createCreateUserMutation');
    });

    test('svelte — imports from @tanstack/svelte-query with create* hooks', () => {
      const opts = {
        ...DEFAULT_OPTS,
        hookGenerationStrategies: {},
        framework: 'svelte' as const,
      };
      const result = generateTanstack(
        ir,
        baseConfig,
        './requests',
        './query-keys',
        opts,
      );
      expect(result.code).toContain("from '@tanstack/svelte-query'");
      expect(result.code).toContain('createQuery');
      expect(result.exports).toContain('createGetUsersQuery');
    });
  });
});

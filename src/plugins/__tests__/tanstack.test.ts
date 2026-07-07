import { describe, test, expect } from 'bun:test';
import { tanstackQuery, generateTanstack } from '../tanstack';
import { baseConfig, emptyIR, makeOperation, makeIR } from './fixtures';
import { HTTP_METHODS } from '@models';

const DEFAULT_OPTS = {
  query: true,
  mutation: true,
  infinite: false,
  suspense: false,
  queryKeysStyle: 'functions' as const,
};

describe('tanstack-query', () => {
  describe('фабрика', () => {
    test('возвращает плагин с правильными мета', () => {
      const plugin = tanstackQuery();
      expect(plugin.name).toBe('tanstack-query');
      expect(plugin.fileName).toBe('tanstack');
      expect(plugin.scope).toBe('operations');
    });

    test('queryKeysStyle: object добавляет generateRootFiles', () => {
      const plugin = tanstackQuery({ queryKeysStyle: 'object' });
      expect(plugin.generateRootFiles).toBeDefined();
    });

    test('queryKeysStyle: functions не добавляет generateRootFiles', () => {
      const plugin = tanstackQuery({ queryKeysStyle: 'functions' });
      expect(plugin.generateRootFiles).toBeUndefined();
    });

    test('generateRootFiles возвращает query-keys.ts', () => {
      const plugin = tanstackQuery({ queryKeysStyle: 'object' });
      const files = plugin.generateRootFiles!(emptyIR, baseConfig);
      expect(files).toHaveLength(1);
      expect(files[0].fileName).toBe('query-keys.ts');
    });
  });

  describe('пустой IR', () => {
    test('содержит banner и tanstack-query imports', () => {
      const result = generateTanstack(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
      expect(result.code).toContain('@tanstack/react-query');
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('GET операции (query)', () => {
    const getOp = makeOperation({
      id: 'getUsers',
      method: HTTP_METHODS.GET,
      path: '/users',
    });

    test('генерирует queryKey функцию', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.code).toContain('getUsersQueryKey');
    });

    test('генерирует queryOptions', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.code).toContain('getUsersQueryOptions');
    });

    test('генерирует useGetUsersQuery хук', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.code).toContain('useGetUsersQuery');
    });

    test('exports содержит queryKey, queryOptions и хук', () => {
      const result = generateTanstack(makeIR([getOp]), baseConfig);
      expect(result.exports).toContain('getUsersQueryKey');
      expect(result.exports).toContain('getUsersQueryOptions');
      expect(result.exports).toContain('useGetUsersQuery');
    });
  });

  describe('mutation операции', () => {
    const postOp = makeOperation({
      id: 'createUser',
      method: HTTP_METHODS.POST,
      path: '/users',
    });

    test('генерирует useCreateUserMutation хук', () => {
      const result = generateTanstack(makeIR([postOp]), baseConfig);
      expect(result.code).toContain('useCreateUserMutation');
    });

    test('exports содержит mutation хук', () => {
      expect(generateTanstack(makeIR([postOp]), baseConfig).exports).toContain(
        'useCreateUserMutation',
      );
    });

    test('DELETE операция генерирует mutation', () => {
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

  describe('опции', () => {
    const getOp = makeOperation({ id: 'getItems', method: HTTP_METHODS.GET });

    test('query: false не генерирует query хуки', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './sdk',
        './query-keys',
        { ...DEFAULT_OPTS, query: false },
      );
      expect(result.exports).not.toContain('useGetItemsQuery');
    });

    test('mutation: false не генерирует mutation хуки', () => {
      const postOp = makeOperation({
        id: 'createItem',
        method: HTTP_METHODS.POST,
      });
      const result = generateTanstack(
        makeIR([postOp]),
        baseConfig,
        './sdk',
        './query-keys',
        { ...DEFAULT_OPTS, mutation: false },
      );
      expect(result.exports).not.toContain('useCreateItemMutation');
    });

    test('infinite: true генерирует infinite query', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './sdk',
        './query-keys',
        { ...DEFAULT_OPTS, infinite: true },
      );
      expect(result.exports).toContain('useInfinityGetItemsQuery');
    });

    test('suspense: true генерирует suspense query', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './sdk',
        './query-keys',
        { ...DEFAULT_OPTS, suspense: true },
      );
      expect(result.exports).toContain('useSuspenseGetItemsQuery');
    });
  });

  describe('queryKeysStyle: object', () => {
    const getOp = makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET });

    test('не генерирует отдельную queryKey функцию', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './sdk',
        './query-keys',
        { ...DEFAULT_OPTS, queryKeysStyle: 'object' },
      );
      expect(result.exports).not.toContain('getUsersQueryKey');
    });

    test('импортирует queryKeys из queryKeysImportPath', () => {
      const result = generateTanstack(
        makeIR([getOp]),
        baseConfig,
        './sdk',
        './query-keys',
        { ...DEFAULT_OPTS, queryKeysStyle: 'object' },
      );
      expect(result.code).toContain("from './query-keys'");
    });
  });

  describe('импорт типов', () => {
    test('импортирует response type если есть name', () => {
      const op = makeOperation({
        response: { type: 'object', name: 'User' },
      });
      expect(generateTanstack(makeIR([op]), baseConfig).code).toContain('User');
    });

    test('импортирует SDK функцию', () => {
      const op = makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET });
      expect(generateTanstack(makeIR([op]), baseConfig).code).toContain(
        "from './sdk'",
      );
    });
  });

  describe('несколько операций', () => {
    test('генерирует хуки для всех операций', () => {
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
});

import { describe, test, expect } from 'bun:test';
import { swr, generateSwr } from '../swr';
import { baseConfig, emptyIR, makeOperation, makeIR } from './fixtures';
import { HTTP_METHODS } from '@models';

describe('swr', () => {
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = swr();
      expect(plugin.name).toBe('swr');
      expect(plugin.fileName).toBe('swr');
      expect(plugin.scope).toBe('operations');
    });

    test('queryKeysStyle: object adds generateRootFiles', () => {
      const plugin = swr({ queryKeysStyle: 'object' });
      expect(plugin.generateRootFiles).toBeDefined();
    });

    test('queryKeysStyle: functions adds no generateRootFiles', () => {
      expect(
        swr({ queryKeysStyle: 'functions' }).generateRootFiles,
      ).toBeUndefined();
    });

    test('generateRootFiles returns swr-keys.ts', () => {
      const files = swr({ queryKeysStyle: 'object' }).generateRootFiles!(
        emptyIR,
        baseConfig,
      );
      expect(files).toHaveLength(1);
      expect(files[0]!.fileName).toBe('swr-keys.ts');
    });
  });

  describe('empty IR', () => {
    test('contains the banner', () => {
      const result = generateSwr(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
    });

    test('empty exports', () => {
      const result = generateSwr(emptyIR, baseConfig);
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('GET operations', () => {
    const getOp = makeOperation({
      id: 'getUsers',
      method: HTTP_METHODS.GET,
      path: '/users',
    });

    test('generates an swrKey function', () => {
      expect(generateSwr(makeIR([getOp]), baseConfig).code).toContain(
        'getUsersSwrKey',
      );
    });

    test('generates the useGetUsers hook', () => {
      expect(generateSwr(makeIR([getOp]), baseConfig).code).toContain(
        'useGetUsers',
      );
    });

    test('exports holds swrKey and the hook', () => {
      const result = generateSwr(makeIR([getOp]), baseConfig);
      expect(result.exports).toContain('getUsersSwrKey');
      expect(result.exports).toContain('useGetUsers');
    });

    test('uses useSWR in the hook body', () => {
      expect(generateSwr(makeIR([getOp]), baseConfig).code).toContain(
        'useSWR<',
      );
    });
  });

  describe('mutation operations', () => {
    const postOp = makeOperation({
      id: 'createUser',
      method: HTTP_METHODS.POST,
      path: '/users',
    });

    test('imports useSWRMutation when there are mutations', () => {
      expect(generateSwr(makeIR([postOp]), baseConfig).code).toContain(
        "import useSWRMutation from 'swr/mutation'",
      );
    });

    test('generates the useCreateUserMutation hook', () => {
      expect(generateSwr(makeIR([postOp]), baseConfig).code).toContain(
        'useCreateUserMutation',
      );
    });

    test('exports holds the mutation hook', () => {
      expect(generateSwr(makeIR([postOp]), baseConfig).exports).toContain(
        'useCreateUserMutation',
      );
    });

    test('DELETE generates a mutation', () => {
      const op = makeOperation({
        id: 'deleteUser',
        method: HTTP_METHODS.DELETE,
        path: '/users/1',
      });
      expect(generateSwr(makeIR([op]), baseConfig).exports).toContain(
        'useDeleteUserMutation',
      );
    });

    test('PUT generates a mutation', () => {
      const op = makeOperation({
        id: 'updateUser',
        method: HTTP_METHODS.PUT,
        path: '/users/1',
      });
      expect(generateSwr(makeIR([op]), baseConfig).exports).toContain(
        'useUpdateUserMutation',
      );
    });
  });

  describe('queryKeysStyle: object', () => {
    const getOp = makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET });

    test('generates no standalone swrKey', () => {
      const result = generateSwr(
        makeIR([getOp]),
        baseConfig,
        './requests',
        './swr-keys',
        'object',
      );
      expect(result.exports).not.toContain('getUsersSwrKey');
    });

    test('imports swrKeys from swrKeysImportPath', () => {
      const result = generateSwr(
        makeIR([getOp]),
        baseConfig,
        './requests',
        './swr-keys',
        'object',
      );
      expect(result.code).toContain("from './swr-keys'");
    });
  });

  describe('type imports', () => {
    test('imports the response type when it has a name', () => {
      const op = makeOperation({
        response: { type: 'object', name: 'User' },
      });
      expect(generateSwr(makeIR([op]), baseConfig).code).toContain('User');
    });

    test('imports the body type when it has a name', () => {
      const op = makeOperation({
        method: HTTP_METHODS.POST,
        body: {
          schema: { type: 'object', name: 'CreateUserInput' },
          required: true,
        },
      });
      expect(generateSwr(makeIR([op]), baseConfig).code).toContain(
        'CreateUserInput',
      );
    });
  });

  describe('several operations', () => {
    test('generates hooks for every operation', () => {
      const ir = makeIR([
        makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET }),
        makeOperation({
          id: 'getUser',
          method: HTTP_METHODS.GET,
          path: '/users/1',
        }),
        makeOperation({ id: 'createUser', method: HTTP_METHODS.POST }),
      ]);
      const result = generateSwr(ir, baseConfig);
      expect(result.exports).toContain('useGetUsers');
      expect(result.exports).toContain('useGetUser');
      expect(result.exports).toContain('useCreateUserMutation');
    });
  });

  describe('custom requestsImportPath', () => {
    test('uses a custom requests path', () => {
      const ir = makeIR([
        makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET }),
      ]);
      expect(generateSwr(ir, baseConfig, '@/api/requests').code).toContain(
        "from '@/api/requests'",
      );
    });
  });
});

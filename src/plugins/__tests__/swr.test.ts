import { describe, test, expect } from 'bun:test';
import { swr, generateSwr } from '../swr';
import { baseConfig, emptyIR, makeOperation, makeIR } from './fixtures';
import { HTTP_METHODS } from '@models';

describe('swr', () => {
  describe('фабрика', () => {
    test('возвращает плагин с правильными мета', () => {
      const plugin = swr();
      expect(plugin.name).toBe('swr');
      expect(plugin.fileName).toBe('swr');
      expect(plugin.scope).toBe('operations');
    });

    test('queryKeysStyle: object добавляет generateRootFiles', () => {
      const plugin = swr({ queryKeysStyle: 'object' });
      expect(plugin.generateRootFiles).toBeDefined();
    });

    test('queryKeysStyle: functions не добавляет generateRootFiles', () => {
      expect(
        swr({ queryKeysStyle: 'functions' }).generateRootFiles,
      ).toBeUndefined();
    });

    test('generateRootFiles возвращает swr-keys.ts', () => {
      const files = swr({ queryKeysStyle: 'object' }).generateRootFiles!(
        emptyIR,
        baseConfig,
      );
      expect(files).toHaveLength(1);
      expect(files[0].fileName).toBe('swr-keys.ts');
    });
  });

  describe('пустой IR', () => {
    test('содержит banner', () => {
      const result = generateSwr(emptyIR, baseConfig);
      expect(result.code).toContain('auto-generated');
    });

    test('пустые exports', () => {
      const result = generateSwr(emptyIR, baseConfig);
      expect(result.exports).toEqual([]);
      expect(result.typeExports).toEqual([]);
    });
  });

  describe('GET операции', () => {
    const getOp = makeOperation({
      id: 'getUsers',
      method: HTTP_METHODS.GET,
      path: '/users',
    });

    test('генерирует swrKey функцию', () => {
      expect(generateSwr(makeIR([getOp]), baseConfig).code).toContain(
        'getUsersSwrKey',
      );
    });

    test('генерирует useGetUsers хук', () => {
      expect(generateSwr(makeIR([getOp]), baseConfig).code).toContain(
        'useGetUsers',
      );
    });

    test('exports содержит swrKey и хук', () => {
      const result = generateSwr(makeIR([getOp]), baseConfig);
      expect(result.exports).toContain('getUsersSwrKey');
      expect(result.exports).toContain('useGetUsers');
    });

    test('использует useSWR в теле хука', () => {
      expect(generateSwr(makeIR([getOp]), baseConfig).code).toContain(
        'useSWR<',
      );
    });
  });

  describe('mutation операции', () => {
    const postOp = makeOperation({
      id: 'createUser',
      method: HTTP_METHODS.POST,
      path: '/users',
    });

    test('импортирует useSWRMutation при наличии mutations', () => {
      expect(generateSwr(makeIR([postOp]), baseConfig).code).toContain(
        "import useSWRMutation from 'swr/mutation'",
      );
    });

    test('генерирует useCreateUserMutation хук', () => {
      expect(generateSwr(makeIR([postOp]), baseConfig).code).toContain(
        'useCreateUserMutation',
      );
    });

    test('exports содержит mutation хук', () => {
      expect(generateSwr(makeIR([postOp]), baseConfig).exports).toContain(
        'useCreateUserMutation',
      );
    });

    test('DELETE генерирует mutation', () => {
      const op = makeOperation({
        id: 'deleteUser',
        method: HTTP_METHODS.DELETE,
        path: '/users/1',
      });
      expect(generateSwr(makeIR([op]), baseConfig).exports).toContain(
        'useDeleteUserMutation',
      );
    });

    test('PUT генерирует mutation', () => {
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

    test('не генерирует отдельный swrKey', () => {
      const result = generateSwr(
        makeIR([getOp]),
        baseConfig,
        './sdk',
        './swr-keys',
        'object',
      );
      expect(result.exports).not.toContain('getUsersSwrKey');
    });

    test('импортирует swrKeys из swrKeysImportPath', () => {
      const result = generateSwr(
        makeIR([getOp]),
        baseConfig,
        './sdk',
        './swr-keys',
        'object',
      );
      expect(result.code).toContain("from './swr-keys'");
    });
  });

  describe('импорт типов', () => {
    test('импортирует response type если есть name', () => {
      const op = makeOperation({
        response: { type: 'object', name: 'User' },
      });
      expect(generateSwr(makeIR([op]), baseConfig).code).toContain('User');
    });

    test('импортирует body type если есть name', () => {
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

  describe('несколько операций', () => {
    test('генерирует хуки для всех операций', () => {
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

  describe('кастомный sdkImportPath', () => {
    test('использует кастомный путь sdk', () => {
      const ir = makeIR([
        makeOperation({ id: 'getUsers', method: HTTP_METHODS.GET }),
      ]);
      expect(generateSwr(ir, baseConfig, '@/api/sdk').code).toContain(
        "from '@/api/sdk'",
      );
    });
  });
});

# swr()

Генерирует [SWR](https://swr.vercel.app) хуки из OpenAPI операций. Требует `sdk()` в массиве плагинов.

## Использование

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## Опции

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**Тип:** `'functions' | 'object'`  
**По умолчанию:** `'functions'`

- `functions` — функция ключа экспортируется прямо в файле с хуком: `getUsersSwrKey(...)`
- `object` — общий файл `query-keys.ts` с объектом `swrKeys`, используется как `swrKeys.getUsers(...)`

### `hookGenerationStrategies`

Переопределение генерации хуков для конкретных операций по `operationId`:

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

По умолчанию: `GET` → `useSWR`, остальное → `useSWRMutation`.

## Именование сгенерированных хуков

Для операции с `operationId: getUsers`:

| Хук | Имя |
|-----|-----|
| `useSWR` | `useGetUsers` |
| Ключ (стиль `functions`) | `getUsersSwrKey` |

Для мутации (`operationId: createUser`):

| Хук | Имя |
|-----|-----|
| `useSWRMutation` | `useCreateUserMutation` |

## Пример вывода

```ts
export const useGetUsers = (
  params?: { page?: number; limit?: number },
  options?: SWRConfiguration<UserList>,
) => {
  return useSWR<UserList, ApigError>(getUsersSwrKey(params), () => getUsers(params), options);
};
```

```ts
export const useCreateUserMutation = (
  options?: SWRMutationConfiguration<User, ApigError, any, CreateUserInput>,
) => {
  return useSWRMutation<User, ApigError, any, CreateUserInput>(
    'createUser',
    (_key, { arg }: { arg: CreateUserInput }) => createUser(arg),
    options,
  );
};
```

Если у мутации нет тела запроса (`body`), ключ мутации остаётся тем же — просто без аргумента `arg` в вызове SDK функции.

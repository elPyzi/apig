# tanstackQuery()

Генерирует [TanStack Query v5](https://tanstack.com/query/latest) хуки из OpenAPI операций. Требует `sdk()` в массиве плагинов.

## Использование

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## Опции

```ts
tanstackQuery({
  query: true,               // useQuery хуки для GET
  mutation: true,             // useMutation хуки для не-GET
  infinite: false,             // useInfiniteQuery хуки для GET
  suspense: false,              // useSuspenseQuery хуки для GET
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**По умолчанию:** `query: true`, `mutation: true`, `infinite: false`, `suspense: false`

Управляют тем, какие хуки генерируются глобально. `infinite` и `suspense` генерируют дополнительные хуки поверх обычного `useQuery` для GET-операций.

### `queryKeysStyle`

**Тип:** `'functions' | 'object'`  
**По умолчанию:** `'functions'`

- `functions` — функция ключа экспортируется прямо в файле с хуком: `getUsersQueryKey(...)`
- `object` — общий файл `query-keys.ts` с объектом `queryKeys`, используется как `queryKeys.getUsers(...)`

### `hookGenerationStrategies`

Переопределение генерации хуков для конкретных операций по `operationId`. Полезно, например, когда POST используется как поисковый эндпоинт и должен генерировать `useQuery`, а не `useMutation`.

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

Каждое поле (`query`, `mutation`, `infinite`, `suspense`) переопределяет глобальную опцию плагина только для этой операции.

## Именование сгенерированных хуков

Для операции с `operationId: getUsers`:

| Хук | Имя |
|-----|-----|
| Query options helper | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| Ключ (стиль `functions`) | `getUsersQueryKey` |

Для мутации (`operationId: createUser`):

| Хук | Имя |
|-----|-----|
| `useMutation` | `useCreateUserMutation` |

## Пример вывода

```ts
export const getUsersQueryOptions = (params?: { page?: number; limit?: number }) =>
  queryOptions<UserList, ApigError>({
    queryKey: getUsersQueryKey(params),
    queryFn: () => getUsers(params),
  });

export const useGetUsersQuery = (
  params?: { page?: number; limit?: number },
  options?: Omit<UseQueryOptions<UserList, ApigError>, 'queryKey' | 'queryFn'>,
) =>
  useQuery<UserList, ApigError>({ ...getUsersQueryOptions(params), ...options });
```

```ts
export const useCreateUserMutation = (
  options?: Omit<UseMutationOptions<User, ApigError, { body: CreateUserInput }>, 'mutationFn'>,
) =>
  useMutation<User, ApigError, { body: CreateUserInput }>({
    mutationFn: (vars) => createUser(vars.body),
    ...options,
  });
```

С `tanstackQuery({ infinite: true })`:

```ts
export const useInfinityGetUsersQuery = (
  params?: { page?: number; limit?: number },
  options?: Omit<UseInfiniteQueryOptions<UserList, ApigError, InfiniteData<UserList>, readonly unknown[], number>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>,
) =>
  useInfiniteQuery<UserList, ApigError, InfiniteData<UserList>, readonly unknown[], number>({
    queryKey: getUsersQueryKey(params),
    queryFn: (_pageParam) => getUsers(params),
    getNextPageParam: () => undefined,
    initialPageParam: 0,
    ...options,
  });
```

`getNextPageParam` возвращает `undefined` по умолчанию — эту логику пагинации нужно реализовать самостоятельно под конкретный API.

## Использование с `queryOptions` в лоадере роутера

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

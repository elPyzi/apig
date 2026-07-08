# tanstackQuery()

Gera hooks [TanStack Query v5](https://tanstack.com/query/latest) a partir de operações OpenAPI. Requer `sdk()` no array de plugins.

## Uso

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## Opções

```ts
tanstackQuery({
  query: true,               // hooks useQuery para GET
  mutation: true,             // hooks useMutation para não-GET
  infinite: false,             // hooks useInfiniteQuery para GET
  suspense: false,              // hooks useSuspenseQuery para GET
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**Padrão:** `query: true`, `mutation: true`, `infinite: false`, `suspense: false`

Controlam quais hooks são gerados globalmente. `infinite` e `suspense` geram hooks adicionais além do `useQuery` comum para operações GET.

### `queryKeysStyle`

**Tipo:** `'functions' | 'object'`
**Padrão:** `'functions'`

- `functions` — a função de chave é exportada diretamente no arquivo do hook: `getUsersQueryKey(...)`
- `object` — um arquivo compartilhado `query-keys.ts` com um objeto `queryKeys`, usado como `queryKeys.getUsers(...)`

### `hookGenerationStrategies`

Sobrescreve a geração de hooks para operações específicas por `operationId`. Útil, por exemplo, quando um POST é usado como endpoint de busca e deve gerar `useQuery` em vez de `useMutation`.

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

Cada campo (`query`, `mutation`, `infinite`, `suspense`) sobrescreve a opção global do plugin apenas para essa operação.

## Nomenclatura dos hooks gerados

Para uma operação com `operationId: getUsers`:

| Hook | Nome |
|-----|-----|
| Helper de opções de query | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| Chave (estilo `functions`) | `getUsersQueryKey` |

Para uma mutação (`operationId: createUser`):

| Hook | Nome |
|-----|-----|
| `useMutation` | `useCreateUserMutation` |

## Exemplo de saída

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

Com `tanstackQuery({ infinite: true })`:

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

`getNextPageParam` retorna `undefined` por padrão — essa lógica de paginação precisa ser implementada por você mesmo, de acordo com a API específica.

## Uso com `queryOptions` em um loader de rota

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

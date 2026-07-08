# tanstackQuery()

Generiert [TanStack Query v5](https://tanstack.com/query/latest)-Hooks aus OpenAPI-Operationen. Erfordert `sdk()` im Plugins-Array.

## Verwendung

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## Optionen

```ts
tanstackQuery({
  query: true,               // useQuery-Hooks für GET
  mutation: true,             // useMutation-Hooks für Nicht-GET
  infinite: false,             // useInfiniteQuery-Hooks für GET
  suspense: false,              // useSuspenseQuery-Hooks für GET
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**Standard:** `query: true`, `mutation: true`, `infinite: false`, `suspense: false`

Steuern, welche Hooks global generiert werden. `infinite` und `suspense` generieren zusätzliche Hooks neben dem gewöhnlichen `useQuery` für GET-Operationen.

### `queryKeysStyle`

**Typ:** `'functions' | 'object'`  
**Standard:** `'functions'`

- `functions` — die Key-Funktion wird direkt in der Hook-Datei exportiert: `getUsersQueryKey(...)`
- `object` — eine gemeinsame Datei `query-keys.ts` mit einem Objekt `queryKeys`, verwendet als `queryKeys.getUsers(...)`

### `hookGenerationStrategies`

Überschreibt die Hook-Generierung für bestimmte Operationen anhand von `operationId`. Nützlich zum Beispiel, wenn POST als Such-Endpunkt verwendet wird und statt `useMutation` ein `useQuery` generiert werden soll.

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

Jedes Feld (`query`, `mutation`, `infinite`, `suspense`) überschreibt die globale Plugin-Option nur für diese Operation.

## Benennung der generierten Hooks

Für eine Operation mit `operationId: getUsers`:

| Hook | Name |
|------|------|
| Query-Options-Hilfsfunktion | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| Key (Stil `functions`) | `getUsersQueryKey` |

Für eine Mutation (`operationId: createUser`):

| Hook | Name |
|------|------|
| `useMutation` | `useCreateUserMutation` |

## Ausgabebeispiel

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

Mit `tanstackQuery({ infinite: true })`:

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

`getNextPageParam` gibt standardmäßig `undefined` zurück — diese Paginierungslogik musst du selbst passend zur jeweiligen API implementieren.

## Verwendung von `queryOptions` in einem Router-Loader

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

# tanstackQuery()

Génère des hooks [TanStack Query v5](https://tanstack.com/query/latest) depuis les opérations OpenAPI. Nécessite `sdk()` dans le tableau de plugins.

## Utilisation

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## Options

```ts
tanstackQuery({
  query: true,               // hooks useQuery pour GET
  mutation: true,             // hooks useMutation pour non-GET
  infinite: false,             // hooks useInfiniteQuery pour GET
  suspense: false,              // hooks useSuspenseQuery pour GET
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**Par défaut :** `query: true`, `mutation: true`, `infinite: false`, `suspense: false`

Contrôlent quels hooks sont générés globalement. `infinite` et `suspense` génèrent des hooks supplémentaires en plus du `useQuery` habituel pour les opérations GET.

### `queryKeysStyle`

**Type :** `'functions' | 'object'`  
**Par défaut :** `'functions'`

- `functions` — la fonction de clé est exportée directement dans le fichier du hook : `getUsersQueryKey(...)`
- `object` — un fichier partagé `query-keys.ts` avec un objet `queryKeys`, utilisé comme `queryKeys.getUsers(...)`

### `hookGenerationStrategies`

Remplace la génération de hooks pour des opérations précises par `operationId`. Utile, par exemple, quand un POST sert de endpoint de recherche et doit générer un `useQuery` plutôt qu'un `useMutation`.

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

Chaque champ (`query`, `mutation`, `infinite`, `suspense`) remplace l'option globale du plugin uniquement pour cette opération.

## Nommage des hooks générés

Pour une opération avec `operationId: getUsers` :

| Hook | Nom |
|------|-----|
| Helper query options | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| Clé (style `functions`) | `getUsersQueryKey` |

Pour une mutation (`operationId: createUser`) :

| Hook | Nom |
|------|-----|
| `useMutation` | `useCreateUserMutation` |

## Exemple de sortie

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

Avec `tanstackQuery({ infinite: true })` :

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

`getNextPageParam` renvoie `undefined` par défaut — cette logique de pagination doit être implémentée toi-même selon l'API concernée.

## Utilisation avec `queryOptions` dans un loader de routeur

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

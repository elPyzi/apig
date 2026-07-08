# tanstackQuery()

Genera hooks [TanStack Query v5](https://tanstack.com/query/latest) a partir de las operaciones OpenAPI. Requiere `sdk()` en el array de plugins.

## Uso

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## Opciones

```ts
tanstackQuery({
  query: true,               // hooks useQuery para GET
  mutation: true,             // hooks useMutation para no-GET
  infinite: false,             // hooks useInfiniteQuery para GET
  suspense: false,              // hooks useSuspenseQuery para GET
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**Por defecto:** `query: true`, `mutation: true`, `infinite: false`, `suspense: false`

Controlan qué hooks se generan globalmente. `infinite` y `suspense` generan hooks adicionales además del `useQuery` normal para las operaciones GET.

### `queryKeysStyle`

**Tipo:** `'functions' | 'object'`  
**Por defecto:** `'functions'`

- `functions` — la función de la clave se exporta directamente en el archivo del hook: `getUsersQueryKey(...)`
- `object` — un archivo compartido `query-keys.ts` con un objeto `queryKeys`, usado como `queryKeys.getUsers(...)`

### `hookGenerationStrategies`

Sobrescribe la generación de hooks para operaciones concretas por `operationId`. Útil, por ejemplo, cuando un POST se usa como endpoint de búsqueda y debe generar `useQuery` en lugar de `useMutation`.

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

Cada campo (`query`, `mutation`, `infinite`, `suspense`) sobrescribe la opción global del plugin solo para esa operación.

## Nomenclatura de los hooks generados

Para una operación con `operationId: getUsers`:

| Hook | Nombre |
|-----|-----|
| Helper de query options | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| Clave (estilo `functions`) | `getUsersQueryKey` |

Para una mutación (`operationId: createUser`):

| Hook | Nombre |
|-----|-----|
| `useMutation` | `useCreateUserMutation` |

## Ejemplo de salida

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

Con `tanstackQuery({ infinite: true })`:

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

`getNextPageParam` devuelve `undefined` por defecto — esta lógica de paginación hay que implementarla tú mismo según tu API concreta.

## Uso con `queryOptions` en un loader de router

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

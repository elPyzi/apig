# tanstackQuery()

Generates [TanStack Query v5](https://tanstack.com/query/latest) hooks from OpenAPI operations. Requires `sdk()` in the plugins array.

## Usage

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
  query: true,               // useQuery hooks for GET
  mutation: true,             // useMutation hooks for non-GET
  infinite: false,             // useInfiniteQuery hooks for GET
  suspense: false,              // useSuspenseQuery hooks for GET
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**Default:** `query: true`, `mutation: true`, `infinite: false`, `suspense: false`

Control which hooks are generated globally. `infinite` and `suspense` generate additional hooks on top of the regular `useQuery` for GET operations.

### `queryKeysStyle`

**Type:** `'functions' | 'object'`  
**Default:** `'functions'`

- `functions` — the key function is exported directly in the hook's file: `getUsersQueryKey(...)`
- `object` — a shared `query-keys.ts` file with a `queryKeys` object, used as `queryKeys.getUsers(...)`

### `hookGenerationStrategies`

Overrides hook generation for specific operations by `operationId`. Useful, for example, when a POST is used as a search endpoint and should generate a `useQuery` instead of a `useMutation`.

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

Each field (`query`, `mutation`, `infinite`, `suspense`) overrides the plugin's global option only for that operation.

## Generated hook names

For an operation with `operationId: getUsers`:

| Hook | Name |
|------|------|
| Query options helper | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| Key (`functions` style) | `getUsersQueryKey` |

For a mutation (`operationId: createUser`):

| Hook | Name |
|------|------|
| `useMutation` | `useCreateUserMutation` |

## Output example

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

With `tanstackQuery({ infinite: true })`:

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

`getNextPageParam` returns `undefined` by default — you need to implement this pagination logic yourself for your specific API.

## Using `queryOptions` in a router loader

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

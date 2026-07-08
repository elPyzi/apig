# tanstackQuery()

OpenAPIオペレーションから [TanStack Query v5](https://tanstack.com/query/latest) フックを生成する。プラグイン配列に `sdk()` が必要。

## 使用方法

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## オプション

```ts
tanstackQuery({
  query: true,               // GET用の useQuery フック
  mutation: true,             // 非GET用の useMutation フック
  infinite: false,             // GET用の useInfiniteQuery フック
  suspense: false,              // GET用の useSuspenseQuery フック
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**デフォルト:** `query: true`、`mutation: true`、`infinite: false`、`suspense: false`

グローバルにどのフックが生成されるかを制御する。`infinite` と `suspense` は、GETオペレーションに対して通常の `useQuery` に加えて追加のフックを生成する。

### `queryKeysStyle`

**型:** `'functions' | 'object'`  
**デフォルト:** `'functions'`

- `functions` — キー関数はフックと同じファイルで直接エクスポートされる: `getUsersQueryKey(...)`
- `object` — `queryKeys` オブジェクトを持つ共有ファイル `query-keys.ts`、`queryKeys.getUsers(...)` として使用

### `hookGenerationStrategies`

`operationId` ごとに特定のオペレーションのフック生成を上書きする。例えば、POSTが検索エンドポイントとして使われ、`useMutation` ではなく `useQuery` を生成すべき場合に便利。

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

各フィールド（`query`、`mutation`、`infinite`、`suspense`）は、そのオペレーションに対してのみグローバルなプラグインオプションを上書きする。

## 生成されるフックの命名

`operationId: getUsers` を持つオペレーションの場合:

| フック | 名前 |
|-----|-----|
| Query optionsヘルパー | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| キー（`functions` スタイル） | `getUsersQueryKey` |

ミューテーション（`operationId: createUser`）の場合:

| フック | 名前 |
|-----|-----|
| `useMutation` | `useCreateUserMutation` |

## 出力例

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

`tanstackQuery({ infinite: true })` の場合:

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

`getNextPageParam` はデフォルトで `undefined` を返す — このページネーションロジックは、具体的なAPIに合わせて自分で実装する必要がある。

## ルーターローダーでの `queryOptions` の使用

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

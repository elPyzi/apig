# tanstackQuery()

从 OpenAPI 操作生成 [TanStack Query v5](https://tanstack.com/query/latest) 钩子。需要插件数组中包含 `sdk()`。

## 用法

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## 选项

```ts
tanstackQuery({
  query: true,               // 为 GET 生成 useQuery 钩子
  mutation: true,             // 为非 GET 生成 useMutation 钩子
  infinite: false,             // 为 GET 生成 useInfiniteQuery 钩子
  suspense: false,              // 为 GET 生成 useSuspenseQuery 钩子
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**默认值：** `query: true`、`mutation: true`、`infinite: false`、`suspense: false`

控制全局生成哪些钩子。`infinite` 和 `suspense` 会在 GET 操作的普通 `useQuery` 基础上额外生成钩子。

### `queryKeysStyle`

**类型：** `'functions' | 'object'`
**默认值：** `'functions'`

- `functions` — 键函数直接在钩子所在文件中导出：`getUsersQueryKey(...)`
- `object` — 使用共享文件 `query-keys.ts`，导出 `queryKeys` 对象，用法为 `queryKeys.getUsers(...)`

### `hookGenerationStrategies`

按 `operationId` 覆盖特定操作的钩子生成方式。例如当 POST 被用作搜索端点，应生成 `useQuery` 而不是 `useMutation` 时很有用。

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

每个字段（`query`、`mutation`、`infinite`、`suspense`）仅针对该操作覆盖插件的全局选项。

## 生成钩子的命名规则

对于 `operationId: getUsers` 的操作：

| 钩子 | 名称 |
|-----|-----|
| Query options 辅助函数 | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| 键（`functions` 风格） | `getUsersQueryKey` |

对于 mutation（`operationId: createUser`）：

| 钩子 | 名称 |
|-----|-----|
| `useMutation` | `useCreateUserMutation` |

## 输出示例

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

使用 `tanstackQuery({ infinite: true })` 时：

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

`getNextPageParam` 默认返回 `undefined`——具体 API 的分页逻辑需要你自己实现。

## 在路由加载器中使用 `queryOptions`

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

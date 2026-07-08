# swr()

从 OpenAPI 操作生成 [SWR](https://swr.vercel.app) 钩子。需要插件数组中包含 `sdk()`。

## 用法

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## 选项

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**类型：** `'functions' | 'object'`
**默认值：** `'functions'`

- `functions` — 键函数直接在钩子所在文件中导出：`getUsersSwrKey(...)`
- `object` — 使用共享文件 `query-keys.ts`，导出 `swrKeys` 对象，用法为 `swrKeys.getUsers(...)`

### `hookGenerationStrategies`

按 `operationId` 覆盖特定操作的钩子生成方式：

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

默认情况下：`GET` → `useSWR`，其他 → `useSWRMutation`。

## 生成钩子的命名规则

对于 `operationId: getUsers` 的操作：

| 钩子 | 名称 |
|-----|-----|
| `useSWR` | `useGetUsers` |
| 键（`functions` 风格） | `getUsersSwrKey` |

对于 mutation（`operationId: createUser`）：

| 钩子 | 名称 |
|-----|-----|
| `useSWRMutation` | `useCreateUserMutation` |

## 输出示例

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

如果某个 mutation 没有请求体（`body`），mutation 键保持不变——只是在调用 SDK 函数时不带 `arg` 参数。

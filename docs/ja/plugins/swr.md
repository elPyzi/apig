# swr()

OpenAPIオペレーションから [SWR](https://swr.vercel.app) フックを生成する。プラグイン配列に `sdk()` が必要。

## 使用方法

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## オプション

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**型:** `'functions' | 'object'`  
**デフォルト:** `'functions'`

- `functions` — キー関数はフックと同じファイルで直接エクスポートされる: `getUsersSwrKey(...)`
- `object` — `swrKeys` オブジェクトを持つ共有ファイル `query-keys.ts`、`swrKeys.getUsers(...)` として使用

### `hookGenerationStrategies`

`operationId` ごとに特定のオペレーションのフック生成を上書きする:

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

デフォルト: `GET` → `useSWR`、それ以外 → `useSWRMutation`。

## 生成されるフックの命名

`operationId: getUsers` を持つオペレーションの場合:

| フック | 名前 |
|-----|-----|
| `useSWR` | `useGetUsers` |
| キー（`functions` スタイル） | `getUsersSwrKey` |

ミューテーション（`operationId: createUser`）の場合:

| フック | 名前 |
|-----|-----|
| `useSWRMutation` | `useCreateUserMutation` |

## 出力例

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

ミューテーションにリクエストボディ（`body`）がない場合、ミューテーションキーは同じままである — SDK関数の呼び出しに `arg` 引数がないだけである。

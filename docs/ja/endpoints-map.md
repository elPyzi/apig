# endpointsMap

`endpointsMap: true` の場合、apig は各オペレーションのパスを持つ型付き定数を含む `endpoints.ts` ファイルを生成する。

## 設定

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## 出力例

```ts
// endpoints.ts
export const ENDPOINTS = {
  getUsers: '/users',
  createUser: '/users',
  getUserById: '/users/{id}',
  updateUser: '/users/{id}',
  deleteUser: '/users/{id}',
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
```

パスは元のOpenAPI形式（`{id}`）のまま保持され、Express/MSW形式（`:id`）への変換は行われない。

## 使用方法

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

ロギング、分析、権限チェックなど、文字列をハードコーディングせずにAPIパスを参照する必要がある場所で便利。

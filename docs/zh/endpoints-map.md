# endpointsMap

当设置 `endpointsMap: true` 时，apig 会生成一个 `endpoints.ts` 文件，其中包含每个操作对应路径的类型化常量。

## 配置

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## 输出示例

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

路径保留 OpenAPI 原始格式（`{id}`），不会转换为 Express/MSW 格式（`:id`）。

## 用法

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

适用于日志记录、埋点分析、权限校验——任何需要引用 API 路径而不想硬编码字符串的场景。

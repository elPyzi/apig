# sdk()

为规范中的每个操作生成类型化请求函数。

`sdk()` 不接受任何选项。HTTP 客户端和行为在 `defineConfig` 级别配置。

## 用法

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## 影响 sdk() 的配置选项

以下选项在 `defineConfig` 中设置，而不是在 `sdk()` 中：

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // 返回 { body, status, headers } 而不是响应体
  apiLogging: false,              // 在每个函数中添加 console.log
  errorHandling: true,            // 非 2xx 响应时抛出 ApigError
  plugins: [sdk()],
})
```

### `httpClient`

**类型：** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`
**默认值：** `{ name: 'fetch' }`

生成函数中使用的 HTTP 客户端。对于 `axios`、`ky`、`ofetch`——需要提供指向你的客户端实例的 `path` 和 `export`。

```ts
// axios 示例
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**类型：** `boolean`
**默认值：** `false`

为 `true` 时，函数返回 `{ body, status, headers }`，而不仅仅是响应体。

### `apiLogging`

**类型：** `boolean`
**默认值：** `false`

为 `true` 时，为每个函数添加 `console.log` 以便调试。

### `errorHandling`

**类型：** `boolean | { path: string; export: string }`
**默认值：** `true`

为 `true` 时，非 2xx 响应会抛出 `ApigError`。传入 `{ path, export }` 可使用自定义错误类。

## 输出示例

```ts
export const getUsers = (params?: { page?: number }) =>
  fetch(`/users?${new URLSearchParams(params)}`).then(r => r.json() as Promise<UserList>)

export const createUser = (body: CreateUserInput) =>
  fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json() as Promise<User>)

export const deleteUser = (id: string) =>
  fetch(`/users/${id}`, { method: 'DELETE' })
```

## Multipart 表单数据

`requestBody` 类型为 `multipart/form-data` 的操作会被自动识别，并使用 `FormData`：

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

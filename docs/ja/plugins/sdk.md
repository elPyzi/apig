# sdk()

仕様内の各オペレーションに対して型付きリクエスト関数を生成する。

`sdk()` はオプションを受け取らない。HTTPクライアントと動作は `defineConfig` レベルで設定する。

## 使用方法

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## sdk() に影響する設定オプション

これらのオプションは `sdk()` ではなく `defineConfig` で指定する:

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // ボディだけでなく { body, status, headers } を返す
  apiLogging: false,              // 各関数に console.log を追加
  errorHandling: true,            // 非2xxレスポンスで ApigError をスロー
  plugins: [sdk()],
})
```

### `httpClient`

**型:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**デフォルト:** `{ name: 'fetch' }`

生成された関数で使用されるHTTPクライアント。`axios`、`ky`、`ofetch` の場合 — クライアントインスタンスを指す `path` と `export` を指定する。

```ts
// axios の例
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**型:** `boolean`  
**デフォルト:** `false`

`true` の場合、関数はレスポンスボディだけでなく `{ body, status, headers }` を返す。

### `apiLogging`

**型:** `boolean`  
**デフォルト:** `false`

`true` の場合、デバッグ用に各関数に `console.log` を追加する。

### `errorHandling`

**型:** `boolean | { path: string; export: string }`  
**デフォルト:** `true`

`true` の場合、非2xxレスポンスで `ApigError` をスローする。カスタムエラークラスを使用するには `{ path, export }` を渡す。

## 出力例

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

## マルチパートフォームデータ

`multipart/form-data` 型の `requestBody` を持つオペレーションは自動的に検出され、`FormData` を使用する:

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

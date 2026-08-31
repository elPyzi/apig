# requests()

Generates typed request functions for every operation in the spec.

`requests()` has no options. HTTP client and behavior are configured at the `defineConfig` level.

## Usage

```ts
import { defineConfig, typescript, requests } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), requests()],
})
```

## Config options that affect requests()

These options are set in `defineConfig`, not in `requests()`:

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // return { body, status, headers } instead of body
  apiLogging: false,              // add console.log to each generated function
  errorHandling: true,            // throw ApigError on non-2xx responses
  plugins: [requests()],
})
```

### `httpClient`

**Type:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Default:** `{ name: 'fetch' }`

The HTTP client used in generated functions. For `axios`, `ky`, `ofetch` — provide `path` and `export` pointing to your client instance.

```ts
// axios example
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [requests()],
})
```

### `rawResponse`

**Type:** `boolean`  
**Default:** `false`

When `true`, functions return `{ body, status, headers }` instead of just the response body.

### `apiLogging`

**Type:** `boolean`  
**Default:** `false`

When `true`, adds `console.log` to each generated function for debugging.

### `errorHandling`

**Type:** `boolean | { path: string; export: string }`  
**Default:** `true`

When `true`, throws `ApigError` on non-2xx responses. Pass `{ path, export }` to use a custom error class.

## Output example

```ts
// GET /users
export const getUsers = (params?: { page?: number; limit?: number }) =>
  fetch(`/users?${new URLSearchParams(params)}`).then(r => r.json() as Promise<UserList>)

// POST /users
export const createUser = (body: CreateUserInput) =>
  fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json() as Promise<User>)

// DELETE /users/:id
export const deleteUser = (id: string) =>
  fetch(`/users/${id}`, { method: 'DELETE' })
```

## Multipart form data

Operations with `requestBody` of type `multipart/form-data` are detected automatically and use `FormData`:

```ts
export const uploadAvatar = (body: UploadAvatarInput) => {
  const form = new FormData()
  form.append('file', body.file)
  return fetch('/avatar', { method: 'POST', body: form })
}
```

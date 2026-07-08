# sdk()

사양의 모든 작업에 대해 타입이 지정된 요청 함수를 생성합니다.

`sdk()`는 옵션을 받지 않습니다. HTTP 클라이언트와 동작은 `defineConfig` 수준에서 설정합니다.

## 사용법

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## sdk()에 영향을 미치는 설정 옵션

이 옵션들은 `sdk()`가 아닌 `defineConfig`에서 지정합니다:

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // 본문만이 아니라 { body, status, headers } 반환
  apiLogging: false,              // 각 함수에 console.log 추가
  errorHandling: true,            // 비 2xx 응답에서 ApigError throw
  plugins: [sdk()],
})
```

### `httpClient`

**타입:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**기본값:** `{ name: 'fetch' }`

생성된 함수에서 사용되는 HTTP 클라이언트. `axios`, `ky`, `ofetch`의 경우 클라이언트 인스턴스를 가리키는 `path`와 `export`를 지정하세요.

```ts
// axios 예시
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**타입:** `boolean`  
**기본값:** `false`

`true`이면 함수는 응답 본문만이 아니라 `{ body, status, headers }`를 반환합니다.

### `apiLogging`

**타입:** `boolean`  
**기본값:** `false`

`true`이면 디버깅을 위해 각 함수에 `console.log`를 추가합니다.

### `errorHandling`

**타입:** `boolean | { path: string; export: string }`  
**기본값:** `true`

`true`이면 비 2xx 응답에서 `ApigError`를 throw합니다. 사용자 지정 오류 클래스를 사용하려면 `{ path, export }`를 전달하세요.

## 출력 예시

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

## 멀티파트 폼 데이터

`requestBody`가 `multipart/form-data` 타입인 작업은 자동으로 감지되어 `FormData`를 사용합니다:

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

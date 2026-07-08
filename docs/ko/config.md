# 설정

`apig.config.ts`는 모든 설정의 진입점입니다. 단일 설정 또는 설정 배열을 내보냅니다.

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

여러 설정(예: 한 프로젝트 안에서 여러 API를 다룰 때):

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## 옵션

### `name`

**타입:** `string`

이 설정을 위한 레이블로, 여러 설정을 사용할 때 CLI 출력에 표시됩니다.

```ts
name: 'users-api'
```

---

### `input`

**타입:** `string | (() => Promise<string>)`  
**필수:** 예

OpenAPI 사양의 경로, URL, 또는 경로/URL을 반환하는 비동기 함수. OpenAPI 3.0과 Swagger 2.0을 지원합니다(자동으로 업그레이드됨).

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**타입:** `string | { path: string; clean?: boolean }`  
**기본값:** `.apig/generated`

생성된 파일이 작성되는 디렉터리. 문자열을 전달하면 `clean`은 기본적으로 `true`입니다(생성 전에 디렉터리를 정리).

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**타입:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**기본값:** `{ name: 'fetch' }`

`sdk()`로 생성된 함수에서 사용되는 HTTP 클라이언트. `axios`, `ky`, `ofetch`, `wretch`의 경우 `path`와 `export`가 필수입니다 — 클라이언트 인스턴스가 있는 파일 경로와 이름이 지정된 export입니다. `fetch`의 경우 필요하지 않습니다.

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**타입:** `ApigPlugin[]`

플러그인 배열. 전체 목록은 [플러그인](./plugins/index.md)을 참조하세요.

---

### `baseUrl`

**타입:** `string`

모든 요청 경로에 추가되는 접두사.

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**타입:** `'none' | 'tags' | 'endpoints' | 'operations'`  
**기본값:** `'none'`

생성된 파일의 분할 방법을 제어합니다:

- `none` — 모든 출력이 `output` 디렉터리 안에, 하위 폴더 없이 (`sdk.ts`, `types.ts`, ...)
- `tags` — OpenAPI 태그마다 하나의 하위 폴더 (`users/users.sdk.ts`)
- `endpoints` — 태그별 하위 폴더, 그 안에 각 작업마다 하위 폴더 (`users/get-user/get-user.sdk.ts`)
- `operations` — 태그로 그룹화하지 않고 각 작업마다 하위 폴더 (`get-user/get-user.sdk.ts`)

---

### `fileNaming`

**타입:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**기본값:** `'kebab-case'`

생성된 파일 및 디렉터리의 명명 규칙(`groupBy`가 `none`이 아닐 때 사용됨).

---

### `functionNaming`

**타입:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**기본값:** `'camelCase'`

생성된 SDK 함수의 명명 규칙.

---

### `enumStyle`

**타입:** `'union' | 'enum' | 'const'`

모든 플러그인(`typescript`, `zod`, `valibot`, `yup`)에 걸쳐 열거형 생성을 제어합니다. 이것은 개별 플러그인의 옵션이 아니라 `defineConfig`의 전역 옵션입니다.

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

`enumStyle`을 명시적으로 지정하지 않으면 `typescript()` 플러그인은 기본적으로 `'const'`를 사용하고, `zod()`/`valibot()`/`yup()`은 `'union'`을 사용합니다.

---

### `typeStyle`

**타입:** `'type' | 'interface'`  
**기본값:** `'type'`

`typescript()`에서 객체 스키마에 대한 타입 선언 스타일. 이것은 `defineConfig`의 전역 옵션입니다.

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**타입:** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

작업 포함 또는 제외:

```ts
filter: {
  tags: ['users', 'orders'], // 이 태그들만 생성
  exclude: ['internal'],     // 이 태그들 제외
  deprecated: false,         // deprecated 작업 포함 여부 (기본값 false)
}
```

---

### `rename`

**타입:** `Record<string, string>`

생성 전에 `operationId` 이름 변경:

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**타입:** `boolean`

> **알려진 특이사항:** 현재 이 필드는 설정 유효성 검사 시 타입 체크를 제외하면 코드 생성 어디에서도 읽히지 않습니다 — 실제 동작에는 영향을 주지 않습니다. 이 옵션에 의존하지 마세요.

---

### `endpointsMap`

**타입:** `boolean`  
**기본값:** `false`

모든 API 경로에 대한 타입이 지정된 상수가 담긴 `endpoints.ts` 파일을 생성합니다. [endpointsMap](./endpoints-map.md)을 참조하세요.

---

### `index`

**타입:** `boolean`  
**기본값:** `true`

생성된 모든 파일을 재내보내는 `index.ts` 생성 여부를 제어합니다.

---

### `formatter`

**타입:** `'prettier' | 'biome' | 'oxfmt' | 'none'`  
**기본값:** `'none'`

작성 후 생성된 파일을 포맷합니다.

---

### `cache`

**타입:** `boolean`  
**기본값:** `false`

파싱된 IR을 디스크에 캐시합니다(`.apig/cache`). 사양이 변경되지 않았다면 이후 실행에서 파싱을 건너뜁니다(URL의 경우 ETag, 로컬 파일의 경우 해시 사용). [캐시](./cache.md)를 참조하세요.

---

### `apiLogging`

**타입:** `boolean`  
**기본값:** `false`

생성된 각 SDK 함수에 `console.log(functionName, response)`를 추가합니다.

---

### `cliLogging`

**타입:** `{ level?: 'minimal' | 'normal' | 'detailed' }`  
**기본값:** `{ level: 'minimal' }`

생성 중 CLI 로그의 상세 수준.

---

### `errorHandling`

**타입:** `boolean | { path: string; export: string }`  
**기본값:** `true`

SDK 함수의 오류 처리:

- `true` (기본값) — 출력 디렉터리 안의 `config.ts` 파일에 내장 `ApigError` 클래스를 생성
- `false` — 오류 처리를 완전히 비활성화
- `{ path, export }` — 지정된 경로에서 사용자 지정 오류 클래스를 사용

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

[ApigError 클라이언트](./client.md)를 참조하세요.

---

### `rawResponse`

**타입:** `boolean`  
**기본값:** `false`

데이터만 반환하는 대신 전체 응답 객체 `{ body, status, headers }`를 반환합니다.

---

### `hooks`

**타입:** `{ afterAllFilesWrite?: string }`

모든 파일이 작성된 후 실행되는 셸 명령:

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**타입:** `string`

다음 생성 시 버전 관리 스냅샷에 첨부되는 코멘트.

```ts
comment: 'before auth refactor'
```

---

## 버전 관리

**타입:** `Versioning`

```ts
versioning: {
  enabled: true,
  storage: '.apig/versions',
  maxSaves: 10,
  saveSpec: true,
  pinVersions: ['abc123'],
  aliasTemplate: 'v{apiVersion}-gen{generation}',
}
```

| 필드 | 타입 | 기본값 | 설명 |
|------|-----|--------|------|
| `enabled` | `boolean` | `false` | 스냅샷 버전 관리 활성화 |
| `storage` | `string` | `.apig/versions` | 스냅샷 저장 디렉터리 |
| `saveSpec` | `boolean` | `false` | 각 스냅샷에 원본 OpenAPI 사양 저장 |
| `maxSaves` | `number` | 제한 없음 | 보관할 최대 스냅샷 수; 오래된 것부터 삭제됨 |
| `pinVersions` | `string[]` | — | 자동으로 삭제되지 않는 스냅샷 ID |
| `aliasTemplate` | `string` | `gen{generation}` | 스냅샷 별칭 템플릿 |

사용 가능한 템플릿 변수: `{generation}`, `{apiVersion}`, `{date}`.

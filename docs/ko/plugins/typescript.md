# typescript()

OpenAPI 스키마에서 TypeScript 타입을 생성합니다.

`typescript()`는 옵션을 받지 않습니다. 생성 스타일은 `defineConfig`의 전역 옵션으로 제어됩니다.

## 사용법

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## typescript()에 영향을 미치는 설정 옵션

이 옵션들은 `typescript()`가 아닌 `defineConfig`에서 지정합니다:

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface', 기본값 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const', 이 플러그인의 기본값은 'const'
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type' (기본값)
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const' (typescript()의 기본값)
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## 지원되는 OpenAPI 기능

- 기본 타입: `string`, `number`, `boolean`
- 문자열 형식: `email`, `uuid`, `uri`, `date-time`
- 배열: `string[]`, `User[]`
- 필수/선택 속성이 있는 객체
- `nullable: true` → `T | null`
- `allOf` → 교차 타입 `A & B`
- `oneOf` / `anyOf` → 유니온 타입 `A | B`
- `discriminator`가 있는 `oneOf` → 판별 유니온
- 열거형 → `enumStyle`로 제어
- `$ref` → 명명된 타입 참조

## 출력 예시

```ts
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

export type User = {
  id: string
  email: string
  bio?: string | null
  role?: Role
}
```

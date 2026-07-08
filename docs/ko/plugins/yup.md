# yup()

OpenAPI 스키마에서 [Yup](https://github.com/jquense/yup) 스키마를 생성합니다.

## 사용법

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## 옵션

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**기본값:** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

타입 중복을 피하려면 별도의 `typescript()`를 사용할 때 비활성화하세요.

### `schemaSuffix`

**기본값:** `'Schema'` — `User` → `UserSchema`

## 전역 옵션 `enumStyle`

열거형 생성 스타일은 `yup()`이 아닌 `defineConfig`에서 지정합니다:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', yup()의 기본값은 'union'
  plugins: [yup()],
})
```

## OpenAPI → Yup 매핑

| OpenAPI | Yup |
|---------|-----|
| `string` | `yup.string()` |
| `string` + `format: email` | `yup.string().email()` |
| `string` + `format: uuid` | `yup.string().uuid()` |
| `string` + `format: uri`/`url` | `yup.string().url()` |
| `string` + `minLength/maxLength` | `yup.string().min().max()` |
| `string` + `pattern` | `yup.string().matches(/.../)` |
| `number` + `minimum/maximum` | `yup.number().min().max()` |
| `boolean` | `yup.boolean()` |
| `array` | `yup.array().of(...)` (+ minItems/maxItems를 위한 `.min()`/`.max()`) |
| `enum` | `yup.mixed().oneOf([...]).required()` (`enumStyle`로 제어) |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| 필수 속성 | `.required()` |
| 선택적 속성 | `.optional()` |

`yup`은 문자열의 `date-time`/`date` 형식을 지원하지 않습니다 — 무시되며, 일반 `yup.string()`이 생성됩니다.

## 출력 예시

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

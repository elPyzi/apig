# valibot()

OpenAPI 스키마에서 [Valibot](https://valibot.dev) 스키마를 생성합니다.

## 사용법

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## 옵션

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**기본값:** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

타입 중복을 피하려면 별도의 `typescript()`를 사용할 때 비활성화하세요.

### `schemaSuffix`

**기본값:** `'Schema'` — `User` → `UserSchema`

## 전역 옵션 `enumStyle`

열거형 생성 스타일은 `valibot()`이 아닌 `defineConfig`에서 지정합니다:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', valibot()의 기본값은 'union'
  plugins: [valibot()],
})
```

## OpenAPI → Valibot 매핑

| OpenAPI | Valibot |
|---------|---------|
| `string` | `v.string()` |
| `string` + `format: email` | `v.pipe(v.string(), v.email())` |
| `string` + `format: uuid` | `v.pipe(v.string(), v.uuid())` |
| `string` + `format: uri`/`url` | `v.pipe(v.string(), v.url())` |
| `string` + `format: date-time` | `v.pipe(v.string(), v.isoTimestamp())` |
| `string` + `format: date` | `v.pipe(v.string(), v.isoDate())` |
| `string` + `minLength/maxLength` | `v.pipe(v.string(), v.minLength(), v.maxLength())` |
| `string` + `pattern` | `v.pipe(v.string(), v.regex(/.../))` |
| `number` + `minimum/maximum` | `v.pipe(v.number(), v.minValue(), v.maxValue())` |
| `enum` | `v.picklist([...])` (`enumStyle`로 제어) |
| `allOf` | `v.intersect([...])` |
| discriminator가 있는 `oneOf`/`anyOf` | `v.variant('key', [...])` |
| discriminator가 없는 `oneOf`/`anyOf` | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| 선택적 속성 | `v.optional(...)` |

## 출력 예시

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

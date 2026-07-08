# zod()

OpenAPI 스키마에서 [Zod](https://zod.dev) 스키마를 생성합니다.

## 사용법

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## 옵션

```ts
zod({
  withTypes: true,        // 스키마와 함께 타입 export
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // validateXResponse() 생성
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**기본값:** `true`

`infer`/`input`/`output` 중 하나가 함께 활성화된 경우 타입 export를 활성화합니다. 타입 중복을 피하려면 별도의 `typescript()`를 사용할 때 비활성화하세요.

### `infer`

**기본값:** `false`

`true`이면 스키마 이름으로 `z.infer<typeof Schema>`를 export합니다. 별도의 `typescript()` 플러그인이 필요 없게 됩니다.

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**기본값:** `false`

`z.input<>`/`z.output<>`을 export합니다 — 스키마에서 `.transform()`을 사용하는 경우에만 의미가 있습니다.

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**기본값:** `false`

`true`이면 각 스키마에 대해 응답 검증 함수를 생성합니다:

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**기본값:** `'Schema'` — `User` → `UserSchema`

## 전역 옵션 `enumStyle`

열거형 생성 스타일은 `zod()`가 아닌 `defineConfig`에서 지정합니다:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', zod()의 기본값은 'union'
  plugins: [zod()],
})
```

## OpenAPI → Zod 매핑

| OpenAPI | Zod |
|---------|-----|
| `string` | `z.string()` |
| `string` + `format: email` | `z.string().email()` |
| `string` + `format: uuid` | `z.string().uuid()` |
| `string` + `format: uri`/`url` | `z.string().url()` |
| `string` + `format: date-time` | `z.string().datetime()` |
| `string` + `format: date` | `z.string().date()` |
| `string` + `minLength/maxLength` | `z.string().min().max()` |
| `string` + `pattern` | `z.string().regex(/.../)` |
| `number` + `minimum/maximum` | `z.number().min().max()` |
| `boolean` | `z.boolean()` |
| `array` | `z.array(...)` |
| `object` | `z.object({ ... })` |
| `enum` | `z.enum([...])` (`enumStyle`로 제어) |
| `allOf` | `.and(...)` |
| discriminator가 있는 `oneOf`/`anyOf` | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| 선택적 속성 | `.optional()` |

## 출력 예시

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

`zod({ infer: true })`인 경우:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

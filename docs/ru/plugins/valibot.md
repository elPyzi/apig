# valibot()

Генерирует [Valibot](https://valibot.dev) схемы из OpenAPI схем.

## Использование

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## Опции

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**По умолчанию:** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

Отключи, если используешь отдельный `typescript()` во избежание дублирования типов.

### `schemaSuffix`

**По умолчанию:** `'Schema'` — `User` → `UserSchema`

## Глобальная опция `enumStyle`

Стиль генерации перечислений задаётся в `defineConfig`, а не в `valibot()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', по умолчанию 'union' для valibot()
  plugins: [valibot()],
})
```

## Маппинг OpenAPI → Valibot

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
| `enum` | `v.picklist([...])` (управляется `enumStyle`) |
| `allOf` | `v.intersect([...])` |
| `oneOf`/`anyOf` с discriminator | `v.variant('key', [...])` |
| `oneOf`/`anyOf` без discriminator | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| опциональное свойство | `v.optional(...)` |

## Пример вывода

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

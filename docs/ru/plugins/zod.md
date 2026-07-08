# zod()

Генерирует [Zod](https://zod.dev) схемы из OpenAPI схем.

## Использование

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## Опции

```ts
zod({
  withTypes: true,        // экспортировать типы вместе со схемами
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // генерировать validateXResponse()
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**По умолчанию:** `true`

Включает экспорт типов, если также включён `infer`/`input`/`output`. Отключи, если используешь отдельный `typescript()` во избежание дублирования типов.

### `infer`

**По умолчанию:** `false`

При `true` экспортирует `z.infer<typeof Schema>` под именем схемы. Убирает необходимость в отдельном `typescript()` плагине.

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**По умолчанию:** `false`

Экспортируют `z.input<>`/`z.output<>` — актуально только если в схемах используется `.transform()`.

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**По умолчанию:** `false`

При `true` генерирует функцию валидации ответа для каждой схемы:

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**По умолчанию:** `'Schema'` — `User` → `UserSchema`

## Глобальная опция `enumStyle`

Стиль генерации перечислений задаётся в `defineConfig`, а не в `zod()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', по умолчанию 'union' для zod()
  plugins: [zod()],
})
```

## Маппинг OpenAPI → Zod

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
| `enum` | `z.enum([...])` (управляется `enumStyle`) |
| `allOf` | `.and(...)` |
| `oneOf`/`anyOf` с discriminator | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| опциональное свойство | `.optional()` |

## Пример вывода

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

С `zod({ infer: true })`:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

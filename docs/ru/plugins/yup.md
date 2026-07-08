# yup()

Генерирует [Yup](https://github.com/jquense/yup) схемы из OpenAPI схем.

## Использование

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## Опции

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**По умолчанию:** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

Отключи, если используешь отдельный `typescript()` во избежание дублирования типов.

### `schemaSuffix`

**По умолчанию:** `'Schema'` — `User` → `UserSchema`

## Глобальная опция `enumStyle`

Стиль генерации перечислений задаётся в `defineConfig`, а не в `yup()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', по умолчанию 'union' для yup()
  plugins: [yup()],
})
```

## Маппинг OpenAPI → Yup

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
| `array` | `yup.array().of(...)` (+ `.min()`/`.max()` для minItems/maxItems) |
| `enum` | `yup.mixed().oneOf([...]).required()` (управляется `enumStyle`) |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| обязательное свойство | `.required()` |
| опциональное свойство | `.optional()` |

`yup` не поддерживает формат `date-time`/`date` для строк — он игнорируется, генерируется обычный `yup.string()`.

## Пример вывода

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

# yup()

Generates [Yup](https://github.com/jquense/yup) schemas from OpenAPI schemas.

## Usage

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## Options

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Default:** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

Disable this if you use a separate `typescript()` plugin, to avoid duplicate types.

### `schemaSuffix`

**Default:** `'Schema'` — `User` → `UserSchema`

## Global `enumStyle` option

Enum generation style is set in `defineConfig`, not in `yup()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', defaults to 'union' for yup()
  plugins: [yup()],
})
```

## OpenAPI → Yup mapping

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
| `array` | `yup.array().of(...)` (+ `.min()`/`.max()` for minItems/maxItems) |
| `enum` | `yup.mixed().oneOf([...]).required()` (controlled by `enumStyle`) |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| required property | `.required()` |
| optional property | `.optional()` |

`yup` does not support the `date-time`/`date` string format — it's ignored, and a plain `yup.string()` is generated instead.

## Output example

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

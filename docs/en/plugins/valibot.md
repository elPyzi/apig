# valibot()

Generates [Valibot](https://valibot.dev) schemas from OpenAPI schemas.

## Usage

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## Options

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Default:** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

Disable this if you use a separate `typescript()` plugin, to avoid duplicate types.

### `schemaSuffix`

**Default:** `'Schema'` — `User` → `UserSchema`

## Global `enumStyle` option

Enum generation style is set in `defineConfig`, not in `valibot()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', defaults to 'union' for valibot()
  plugins: [valibot()],
})
```

## OpenAPI → Valibot mapping

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
| `enum` | `v.picklist([...])` (controlled by `enumStyle`) |
| `allOf` | `v.intersect([...])` |
| `oneOf`/`anyOf` with discriminator | `v.variant('key', [...])` |
| `oneOf`/`anyOf` without discriminator | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| optional property | `v.optional(...)` |

## Output example

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

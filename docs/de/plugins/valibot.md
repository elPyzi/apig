# valibot()

Generiert [Valibot](https://valibot.dev)-Schemata aus OpenAPI-Schemata.

## Verwendung

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## Optionen

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Standard:** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

Deaktiviere dies, wenn du ein separates `typescript()` verwendest, um doppelte Typen zu vermeiden.

### `schemaSuffix`

**Standard:** `'Schema'` — `User` → `UserSchema`

## Globale Option `enumStyle`

Der Generierungsstil für Enums wird in `defineConfig` festgelegt, nicht in `valibot()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', Standard 'union' für valibot()
  plugins: [valibot()],
})
```

## Zuordnung OpenAPI → Valibot

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
| `enum` | `v.picklist([...])` (gesteuert durch `enumStyle`) |
| `allOf` | `v.intersect([...])` |
| `oneOf`/`anyOf` mit discriminator | `v.variant('key', [...])` |
| `oneOf`/`anyOf` ohne discriminator | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| optionale Eigenschaft | `v.optional(...)` |

## Ausgabebeispiel

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

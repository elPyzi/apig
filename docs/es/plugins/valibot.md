# valibot()

Genera esquemas [Valibot](https://valibot.dev) a partir de esquemas OpenAPI.

## Uso

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## Opciones

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Por defecto:** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

Desactívalo si usas un `typescript()` independiente para evitar tipos duplicados.

### `schemaSuffix`

**Por defecto:** `'Schema'` — `User` → `UserSchema`

## Opción global `enumStyle`

El estilo de generación de enumeraciones se establece en `defineConfig`, no en `valibot()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', por defecto 'union' para valibot()
  plugins: [valibot()],
})
```

## Mapeo OpenAPI → Valibot

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
| `enum` | `v.picklist([...])` (controlado por `enumStyle`) |
| `allOf` | `v.intersect([...])` |
| `oneOf`/`anyOf` con discriminator | `v.variant('key', [...])` |
| `oneOf`/`anyOf` sin discriminator | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| propiedad opcional | `v.optional(...)` |

## Ejemplo de salida

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

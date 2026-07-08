# valibot()

Gera esquemas [Valibot](https://valibot.dev) a partir de esquemas OpenAPI.

## Uso

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## Opções

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Padrão:** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

Desative se você usa um `typescript()` separado, para evitar duplicação de tipos.

### `schemaSuffix`

**Padrão:** `'Schema'` — `User` → `UserSchema`

## Opção global `enumStyle`

O estilo de geração de enums é definido em `defineConfig`, não em `valibot()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', padrão 'union' para valibot()
  plugins: [valibot()],
})
```

## Mapeamento OpenAPI → Valibot

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
| `oneOf`/`anyOf` com discriminator | `v.variant('key', [...])` |
| `oneOf`/`anyOf` sem discriminator | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| propriedade opcional | `v.optional(...)` |

## Exemplo de saída

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

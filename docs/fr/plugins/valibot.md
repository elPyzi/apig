# valibot()

Génère des schémas [Valibot](https://valibot.dev) depuis les schémas OpenAPI.

## Utilisation

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

**Par défaut :** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

Désactive-le si tu utilises un `typescript()` séparé, pour éviter de dupliquer les types.

### `schemaSuffix`

**Par défaut :** `'Schema'` — `User` → `UserSchema`

## Option globale `enumStyle`

Le style de génération des énumérations est défini dans `defineConfig`, pas dans `valibot()` :

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', par défaut 'union' pour valibot()
  plugins: [valibot()],
})
```

## Correspondance OpenAPI → Valibot

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
| `enum` | `v.picklist([...])` (contrôlé par `enumStyle`) |
| `allOf` | `v.intersect([...])` |
| `oneOf`/`anyOf` avec discriminator | `v.variant('key', [...])` |
| `oneOf`/`anyOf` sans discriminator | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| propriété optionnelle | `v.optional(...)` |

## Exemple de sortie

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

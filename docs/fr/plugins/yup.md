# yup()

Génère des schémas [Yup](https://github.com/jquense/yup) depuis les schémas OpenAPI.

## Utilisation

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

**Par défaut :** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

Désactive-le si tu utilises un `typescript()` séparé, pour éviter de dupliquer les types.

### `schemaSuffix`

**Par défaut :** `'Schema'` — `User` → `UserSchema`

## Option globale `enumStyle`

Le style de génération des énumérations est défini dans `defineConfig`, pas dans `yup()` :

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', par défaut 'union' pour yup()
  plugins: [yup()],
})
```

## Correspondance OpenAPI → Yup

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
| `array` | `yup.array().of(...)` (+ `.min()`/`.max()` pour minItems/maxItems) |
| `enum` | `yup.mixed().oneOf([...]).required()` (contrôlé par `enumStyle`) |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| propriété requise | `.required()` |
| propriété optionnelle | `.optional()` |

`yup` ne prend pas en charge le format `date-time`/`date` pour les chaînes — il est ignoré, un simple `yup.string()` est généré.

## Exemple de sortie

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

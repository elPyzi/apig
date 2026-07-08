# yup()

Generiert [Yup](https://github.com/jquense/yup)-Schemata aus OpenAPI-Schemata.

## Verwendung

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## Optionen

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Standard:** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

Deaktiviere dies, wenn du ein separates `typescript()` verwendest, um doppelte Typen zu vermeiden.

### `schemaSuffix`

**Standard:** `'Schema'` — `User` → `UserSchema`

## Globale Option `enumStyle`

Der Generierungsstil für Enums wird in `defineConfig` festgelegt, nicht in `yup()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', Standard 'union' für yup()
  plugins: [yup()],
})
```

## Zuordnung OpenAPI → Yup

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
| `array` | `yup.array().of(...)` (+ `.min()`/`.max()` für minItems/maxItems) |
| `enum` | `yup.mixed().oneOf([...]).required()` (gesteuert durch `enumStyle`) |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| erforderliche Eigenschaft | `.required()` |
| optionale Eigenschaft | `.optional()` |

`yup` unterstützt die Formate `date-time`/`date` für Strings nicht — sie werden ignoriert, es wird ein gewöhnliches `yup.string()` generiert.

## Ausgabebeispiel

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

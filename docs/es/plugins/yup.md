# yup()

Genera esquemas [Yup](https://github.com/jquense/yup) a partir de esquemas OpenAPI.

## Uso

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## Opciones

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Por defecto:** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

Desactívalo si usas un `typescript()` independiente para evitar tipos duplicados.

### `schemaSuffix`

**Por defecto:** `'Schema'` — `User` → `UserSchema`

## Opción global `enumStyle`

El estilo de generación de enumeraciones se establece en `defineConfig`, no en `yup()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', por defecto 'union' para yup()
  plugins: [yup()],
})
```

## Mapeo OpenAPI → Yup

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
| `array` | `yup.array().of(...)` (+ `.min()`/`.max()` para minItems/maxItems) |
| `enum` | `yup.mixed().oneOf([...]).required()` (controlado por `enumStyle`) |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| propiedad obligatoria | `.required()` |
| propiedad opcional | `.optional()` |

`yup` no admite el formato `date-time`/`date` para cadenas — se ignora y se genera un `yup.string()` normal.

## Ejemplo de salida

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

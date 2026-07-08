# zod()

Genera esquemas [Zod](https://zod.dev) a partir de esquemas OpenAPI.

## Uso

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## Opciones

```ts
zod({
  withTypes: true,        // exportar tipos junto con los esquemas
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // generar validateXResponse()
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Por defecto:** `true`

Activa la exportación de tipos, si además está activado `infer`/`input`/`output`. Desactívalo si usas un `typescript()` independiente para evitar tipos duplicados.

### `infer`

**Por defecto:** `false`

Cuando es `true`, exporta `z.infer<typeof Schema>` con el nombre del esquema. Elimina la necesidad de un plugin `typescript()` independiente.

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**Por defecto:** `false`

Exportan `z.input<>`/`z.output<>` — relevante solo si en los esquemas se usa `.transform()`.

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**Por defecto:** `false`

Cuando es `true`, genera una función de validación de respuesta para cada esquema:

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**Por defecto:** `'Schema'` — `User` → `UserSchema`

## Opción global `enumStyle`

El estilo de generación de enumeraciones se establece en `defineConfig`, no en `zod()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', por defecto 'union' para zod()
  plugins: [zod()],
})
```

## Mapeo OpenAPI → Zod

| OpenAPI | Zod |
|---------|-----|
| `string` | `z.string()` |
| `string` + `format: email` | `z.string().email()` |
| `string` + `format: uuid` | `z.string().uuid()` |
| `string` + `format: uri`/`url` | `z.string().url()` |
| `string` + `format: date-time` | `z.string().datetime()` |
| `string` + `format: date` | `z.string().date()` |
| `string` + `minLength/maxLength` | `z.string().min().max()` |
| `string` + `pattern` | `z.string().regex(/.../)` |
| `number` + `minimum/maximum` | `z.number().min().max()` |
| `boolean` | `z.boolean()` |
| `array` | `z.array(...)` |
| `object` | `z.object({ ... })` |
| `enum` | `z.enum([...])` (controlado por `enumStyle`) |
| `allOf` | `.and(...)` |
| `oneOf`/`anyOf` con discriminator | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| propiedad opcional | `.optional()` |

## Ejemplo de salida

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

Con `zod({ infer: true })`:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

# zod()

Generates [Zod](https://zod.dev) schemas from OpenAPI schemas.

## Usage

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## Options

```ts
zod({
  withTypes: true,        // export types alongside schemas
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // generate validateXResponse()
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Default:** `true`

Enables type exports when `infer`/`input`/`output` is also enabled. Disable this if you use a separate `typescript()` plugin, to avoid duplicate types.

### `infer`

**Default:** `false`

When `true`, exports `z.infer<typeof Schema>` under the schema's name. Removes the need for a separate `typescript()` plugin.

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**Default:** `false`

Export `z.input<>`/`z.output<>` — relevant only if your schemas use `.transform()`.

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**Default:** `false`

When `true`, generates a response validation function for each schema:

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**Default:** `'Schema'` — `User` → `UserSchema`

## Global `enumStyle` option

Enum generation style is set in `defineConfig`, not in `zod()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', defaults to 'union' for zod()
  plugins: [zod()],
})
```

## OpenAPI → Zod mapping

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
| `enum` | `z.enum([...])` (controlled by `enumStyle`) |
| `allOf` | `.and(...)` |
| `oneOf`/`anyOf` with discriminator | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| optional property | `.optional()` |

## Output example

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

With `zod({ infer: true })`:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

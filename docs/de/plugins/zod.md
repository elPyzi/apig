# zod()

Generiert [Zod](https://zod.dev)-Schemata aus OpenAPI-Schemata.

## Verwendung

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## Optionen

```ts
zod({
  withTypes: true,        // Typen zusammen mit den Schemata exportieren
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // validateXResponse() generieren
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Standard:** `true`

Aktiviert den Typ-Export, wenn zusätzlich `infer`/`input`/`output` aktiviert ist. Deaktiviere dies, wenn du ein separates `typescript()` verwendest, um doppelte Typen zu vermeiden.

### `infer`

**Standard:** `false`

Bei `true` wird `z.infer<typeof Schema>` unter dem Namen des Schemas exportiert. Macht ein separates `typescript()`-Plugin überflüssig.

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**Standard:** `false`

Exportieren `z.input<>`/`z.output<>` — relevant nur, wenn in den Schemata `.transform()` verwendet wird.

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**Standard:** `false`

Bei `true` wird für jedes Schema eine Antwort-Validierungsfunktion generiert:

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**Standard:** `'Schema'` — `User` → `UserSchema`

## Globale Option `enumStyle`

Der Generierungsstil für Enums wird in `defineConfig` festgelegt, nicht in `zod()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', Standard 'union' für zod()
  plugins: [zod()],
})
```

## Zuordnung OpenAPI → Zod

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
| `enum` | `z.enum([...])` (gesteuert durch `enumStyle`) |
| `allOf` | `.and(...)` |
| `oneOf`/`anyOf` mit discriminator | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| optionale Eigenschaft | `.optional()` |

## Ausgabebeispiel

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

Mit `zod({ infer: true })`:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

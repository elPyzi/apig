# zod()

Génère des schémas [Zod](https://zod.dev) depuis les schémas OpenAPI.

## Utilisation

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
  withTypes: true,        // exporter les types avec les schémas
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // générer validateXResponse()
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Par défaut :** `true`

Active l'export des types si `infer`/`input`/`output` est également activé. Désactive-le si tu utilises un `typescript()` séparé, pour éviter de dupliquer les types.

### `infer`

**Par défaut :** `false`

Si `true`, exporte `z.infer<typeof Schema>` sous le nom du schéma. Supprime le besoin d'un plugin `typescript()` séparé.

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**Par défaut :** `false`

Exportent `z.input<>`/`z.output<>` — pertinent uniquement si les schémas utilisent `.transform()`.

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**Par défaut :** `false`

Si `true`, génère une fonction de validation de réponse pour chaque schéma :

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**Par défaut :** `'Schema'` — `User` → `UserSchema`

## Option globale `enumStyle`

Le style de génération des énumérations est défini dans `defineConfig`, pas dans `zod()` :

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', par défaut 'union' pour zod()
  plugins: [zod()],
})
```

## Correspondance OpenAPI → Zod

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
| `enum` | `z.enum([...])` (contrôlé par `enumStyle`) |
| `allOf` | `.and(...)` |
| `oneOf`/`anyOf` avec discriminator | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| propriété optionnelle | `.optional()` |

## Exemple de sortie

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

Avec `zod({ infer: true })` :

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

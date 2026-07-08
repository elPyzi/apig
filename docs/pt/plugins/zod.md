# zod()

Gera esquemas [Zod](https://zod.dev) a partir de esquemas OpenAPI.

## Uso

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## Opções

```ts
zod({
  withTypes: true,        // exportar tipos junto com os esquemas
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // gerar validateXResponse()
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Padrão:** `true`

Habilita a exportação de tipos, caso `infer`/`input`/`output` também estejam habilitados. Desative se você usa um `typescript()` separado, para evitar duplicação de tipos.

### `infer`

**Padrão:** `false`

Quando `true`, exporta `z.infer<typeof Schema>` com o nome do esquema. Elimina a necessidade de um plugin `typescript()` separado.

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**Padrão:** `false`

Exportam `z.input<>`/`z.output<>` — relevante apenas se os esquemas usarem `.transform()`.

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**Padrão:** `false`

Quando `true`, gera uma função de validação de resposta para cada esquema:

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**Padrão:** `'Schema'` — `User` → `UserSchema`

## Opção global `enumStyle`

O estilo de geração de enums é definido em `defineConfig`, não em `zod()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', padrão 'union' para zod()
  plugins: [zod()],
})
```

## Mapeamento OpenAPI → Zod

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
| `oneOf`/`anyOf` com discriminator | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| propriedade opcional | `.optional()` |

## Exemplo de saída

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

Com `zod({ infer: true })`:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

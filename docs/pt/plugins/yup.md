# yup()

Gera esquemas [Yup](https://github.com/jquense/yup) a partir de esquemas OpenAPI.

## Uso

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## Opções

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**Padrão:** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

Desative se você usa um `typescript()` separado, para evitar duplicação de tipos.

### `schemaSuffix`

**Padrão:** `'Schema'` — `User` → `UserSchema`

## Opção global `enumStyle`

O estilo de geração de enums é definido em `defineConfig`, não em `yup()`:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const', padrão 'union' para yup()
  plugins: [yup()],
})
```

## Mapeamento OpenAPI → Yup

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
| propriedade obrigatória | `.required()` |
| propriedade opcional | `.optional()` |

`yup` não suporta o formato `date-time`/`date` para strings — ele é ignorado, sendo gerado um `yup.string()` comum.

## Exemplo de saída

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

# typescript()

Gera tipos TypeScript a partir de esquemas OpenAPI.

`typescript()` não aceita opções. O estilo de geração é controlado pelas opções globais do `defineConfig`.

## Uso

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## Opções da configuração que afetam typescript()

Essas opções são definidas em `defineConfig`, não em `typescript()`:

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface', padrão 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const', padrão 'const' para este plugin
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type' (padrão)
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const' (padrão para typescript())
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## Recursos do OpenAPI suportados

- Primitivos: `string`, `number`, `boolean`
- Formatos de string: `email`, `uuid`, `uri`, `date-time`
- Arrays: `string[]`, `User[]`
- Objetos com propriedades obrigatórias/opcionais
- `nullable: true` → `T | null`
- `allOf` → interseção `A & B`
- `oneOf` / `anyOf` → união `A | B`
- `oneOf` com `discriminator` → união discriminada
- Enums → controlado por `enumStyle`
- `$ref` → referência a um tipo nomeado

## Exemplo de saída

```ts
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

export type User = {
  id: string
  email: string
  bio?: string | null
  role?: Role
}
```

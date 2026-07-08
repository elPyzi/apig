# typescript()

Genera tipos TypeScript a partir de esquemas OpenAPI.

`typescript()` no acepta opciones. El estilo de generación se controla mediante las opciones globales de `defineConfig`.

## Uso

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## Opciones de configuración que afectan a typescript()

Estas opciones se establecen en `defineConfig`, no en `typescript()`:

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface', por defecto 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const', por defecto 'const' para este plugin
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type' (por defecto)
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const' (por defecto para typescript())
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## Características de OpenAPI admitidas

- Tipos primitivos: `string`, `number`, `boolean`
- Formatos de cadena: `email`, `uuid`, `uri`, `date-time`
- Arrays: `string[]`, `User[]`
- Objetos con propiedades obligatorias/opcionales
- `nullable: true` → `T | null`
- `allOf` → intersección `A & B`
- `oneOf` / `anyOf` → unión `A | B`
- `oneOf` con `discriminator` → unión discriminada
- Enumeraciones → controladas mediante `enumStyle`
- `$ref` → referencia a un tipo con nombre

## Ejemplo de salida

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

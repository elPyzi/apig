# typescript()

Generiert TypeScript-Typen aus OpenAPI-Schemata.

`typescript()` nimmt keine Optionen entgegen. Der Generierungsstil wird über die globalen Optionen von `defineConfig` gesteuert.

## Verwendung

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## Konfigurationsoptionen, die typescript() beeinflussen

Diese Optionen werden in `defineConfig` gesetzt, nicht in `typescript()`:

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface', Standard 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const', Standard 'const' für dieses Plugin
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type' (Standard)
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const' (Standard für typescript())
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## Unterstützte OpenAPI-Funktionen

- Primitive Typen: `string`, `number`, `boolean`
- Zeichenkettenformate: `email`, `uuid`, `uri`, `date-time`
- Arrays: `string[]`, `User[]`
- Objekte mit erforderlichen/optionalen Eigenschaften
- `nullable: true` → `T | null`
- `allOf` → Schnittmengentyp `A & B`
- `oneOf` / `anyOf` → Vereinigungstyp `A | B`
- `oneOf` mit `discriminator` → diskriminierte Union
- Enums → gesteuert durch `enumStyle`
- `$ref` → Referenz auf einen benannten Typ

## Ausgabebeispiel

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

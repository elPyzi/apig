# typescript()

Generates TypeScript types from OpenAPI schemas.

`typescript()` has no options. Generation style is controlled by global `defineConfig` options.

## Usage

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## Config options that affect typescript()

These options are set in `defineConfig`, not in `typescript()`:

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface', defaults to 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const', defaults to 'const' for this plugin
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type' (default)
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const' (default for typescript())
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## OpenAPI features supported

- Primitive types: `string`, `number`, `boolean`
- String formats: `email`, `uuid`, `uri`, `date-time`
- Arrays: `string[]`, `User[]`
- Objects with required/optional properties
- `nullable: true` → `T | null`
- `allOf` → intersection type `A & B`
- `oneOf` / `anyOf` → union type `A | B`
- `oneOf` with `discriminator` → discriminated union
- Enums → controlled by `enumStyle`
- `$ref` → references named type

## Output example

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

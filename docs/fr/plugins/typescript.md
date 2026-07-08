# typescript()

Génère des types TypeScript depuis les schémas OpenAPI.

`typescript()` n'accepte pas d'options. Le style de génération est contrôlé par les options globales de `defineConfig`.

## Utilisation

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## Options de configuration influençant typescript()

Ces options sont définies dans `defineConfig`, pas dans `typescript()` :

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface', par défaut 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const', par défaut 'const' pour ce plugin
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type' (par défaut)
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const' (par défaut pour typescript())
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## Fonctionnalités OpenAPI prises en charge

- Types primitifs : `string`, `number`, `boolean`
- Formats de chaîne : `email`, `uuid`, `uri`, `date-time`
- Tableaux : `string[]`, `User[]`
- Objets avec propriétés requises/optionnelles
- `nullable: true` → `T | null`
- `allOf` → intersection `A & B`
- `oneOf` / `anyOf` → union `A | B`
- `oneOf` avec `discriminator` → union discriminée
- Énumérations → contrôlées via `enumStyle`
- `$ref` → référence à un type nommé

## Exemple de sortie

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

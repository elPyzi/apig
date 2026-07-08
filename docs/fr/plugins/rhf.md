# rhf()

Génère des résolveurs [React Hook Form](https://react-hook-form.com) — **un par schéma** issu d'OpenAPI, et non un par formulaire/opération.

Nécessite la présence de l'un des plugins `zod()`, `valibot()` ou `yup()` dans le tableau de plugins, avec le même `schemaSuffix`.

## Utilisation

```ts
import { defineConfig, zod, rhf } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    zod(),
    rhf({ resolver: 'zod' }),
  ],
})
```

## Options

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — obligatoire
  schemaSuffix: 'Schema',        // doit correspondre au schemaSuffix du plugin de validation
  schemasImportPath: './zod',    // par défaut './<resolver>'
})
```

### `resolver`

**Obligatoire.** Bibliothèque de validation pour laquelle les résolveurs sont générés. Doit correspondre à l'un des plugins configurés (`zod()`, `valibot()`, `yup()`).

### `schemaSuffix`

**Par défaut :** `'Schema'`

Doit correspondre au `schemaSuffix` indiqué dans le plugin de validation — c'est grâce à lui que `rhf()` retrouve les noms des schémas (`UserSchema`, `CreateUserInputSchema`, ...).

### `schemasImportPath`

**Par défaut :** `'./<resolver>'` (par exemple `'./zod'`)

Chemin d'import du fichier de schémas, s'il diffère du chemin standard.

## Nommage des résolveurs

Pour chaque schéma nommé `X`, un résolveur `${camelCase(X)}Resolver` est généré :

| Schéma | Résolveur |
|--------|-----------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## Exemple de sortie

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

Utilisation dans un composant :

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

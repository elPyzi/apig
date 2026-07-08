# rhf()

Generiert [React Hook Form](https://react-hook-form.com)-Resolver — **einen pro Schema** aus der OpenAPI-Spezifikation, nicht einen pro Formular/Operation.

Erfordert, dass eines der Plugins `zod()`, `valibot()` oder `yup()` im Plugins-Array vorhanden ist, mit demselben `schemaSuffix`.

## Verwendung

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

## Optionen

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — erforderlich
  schemaSuffix: 'Schema',        // muss mit dem schemaSuffix des Validierungsplugins übereinstimmen
  schemasImportPath: './zod',    // Standard './<resolver>'
})
```

### `resolver`

**Erforderlich.** Die Validierungsbibliothek, für die Resolver generiert werden. Muss zu einem der eingebundenen Plugins (`zod()`, `valibot()`, `yup()`) passen.

### `schemaSuffix`

**Standard:** `'Schema'`

Muss mit dem im Validierungsplugin angegebenen `schemaSuffix` übereinstimmen — danach findet `rhf()` die Schema-Namen (`UserSchema`, `CreateUserInputSchema`, ...).

### `schemasImportPath`

**Standard:** `'./<resolver>'` (zum Beispiel `'./zod'`)

Importpfad der Datei mit den Schemata, falls er vom Standard abweicht.

## Benennung der Resolver

Für jedes Schema mit dem Namen `X` wird ein Resolver `${camelCase(X)}Resolver` generiert:

| Schema | Resolver |
|--------|----------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## Ausgabebeispiel

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

Verwendung in einer Komponente:

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

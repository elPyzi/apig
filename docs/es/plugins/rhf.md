# rhf()

Genera resolvers de [React Hook Form](https://react-hook-form.com) — **uno por cada esquema** de OpenAPI, no uno por formulario/operación.

Requiere que uno de `zod()`, `valibot()` o `yup()` esté presente en el array de plugins, con el mismo `schemaSuffix`.

## Uso

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

## Opciones

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — obligatorio
  schemaSuffix: 'Schema',        // debe coincidir con el schemaSuffix del plugin de validación
  schemasImportPath: './zod',    // por defecto './<resolver>'
})
```

### `resolver`

**Obligatorio.** Biblioteca de validación para la que se generan los resolvers. Debe coincidir con uno de los plugins conectados (`zod()`, `valibot()`, `yup()`).

### `schemaSuffix`

**Por defecto:** `'Schema'`

Debe coincidir con el `schemaSuffix` indicado en el plugin de validación — a partir de él `rhf()` encuentra los nombres de los esquemas (`UserSchema`, `CreateUserInputSchema`, ...).

### `schemasImportPath`

**Por defecto:** `'./<resolver>'` (por ejemplo `'./zod'`)

Ruta de importación del archivo de esquemas, si difiere de la ruta estándar.

## Nomenclatura de los resolvers

Para cada esquema con nombre `X` se genera un resolver `${camelCase(X)}Resolver`:

| Esquema | Resolver |
|-------|----------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## Ejemplo de salida

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

Uso en un componente:

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

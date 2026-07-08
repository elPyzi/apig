# rhf()

Generates [React Hook Form](https://react-hook-form.com) resolvers — **one per schema** from OpenAPI, not one per form/operation.

Requires one of `zod()`, `valibot()`, or `yup()` in the plugins array, with the same `schemaSuffix`.

## Usage

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
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — required
  schemaSuffix: 'Schema',        // must match the validation plugin's schemaSuffix
  schemasImportPath: './zod',    // defaults to './<resolver>'
})
```

### `resolver`

**Required.** The validation library the resolvers are generated for. Must match one of the enabled plugins (`zod()`, `valibot()`, `yup()`).

### `schemaSuffix`

**Default:** `'Schema'`

Must match the `schemaSuffix` set on the validation plugin — `rhf()` uses it to find schema names (`UserSchema`, `CreateUserInputSchema`, ...).

### `schemasImportPath`

**Default:** `'./<resolver>'` (e.g. `'./zod'`)

Import path to the schemas file, if it differs from the default.

## Resolver naming

For each schema named `X`, a resolver `${camelCase(X)}Resolver` is generated:

| Schema | Resolver |
|--------|----------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## Output example

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

Usage in a component:

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

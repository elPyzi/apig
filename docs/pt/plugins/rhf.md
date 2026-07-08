# rhf()

Gera resolvers [React Hook Form](https://react-hook-form.com) — **um para cada esquema** do OpenAPI, e não um por formulário/operação.

Requer a presença de `zod()`, `valibot()` ou `yup()` no array de plugins, com o mesmo `schemaSuffix`.

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

## Opções

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — obrigatório
  schemaSuffix: 'Schema',        // deve coincidir com o schemaSuffix do plugin de validação
  schemasImportPath: './zod',    // padrão './<resolver>'
})
```

### `resolver`

**Obrigatório.** A biblioteca de validação para a qual os resolvers são gerados. Deve coincidir com um dos plugins habilitados (`zod()`, `valibot()`, `yup()`).

### `schemaSuffix`

**Padrão:** `'Schema'`

Deve coincidir com o `schemaSuffix` definido no plugin de validação — é por meio dele que o `rhf()` encontra os nomes dos esquemas (`UserSchema`, `CreateUserInputSchema`, ...).

### `schemasImportPath`

**Padrão:** `'./<resolver>'` (por exemplo `'./zod'`)

Caminho de importação do arquivo de esquemas, caso seja diferente do padrão.

## Nomenclatura dos resolvers

Para cada esquema chamado `X`, é gerado um resolver `${camelCase(X)}Resolver`:

| Esquema | Resolver |
|-------|----------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## Exemplo de saída

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

Uso em um componente:

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

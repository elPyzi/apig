# rhf()

Генерирует [React Hook Form](https://react-hook-form.com) резолверы — **по одному на каждую схему** из OpenAPI, а не по одному на форму/операцию.

Требует наличия одного из `zod()`, `valibot()` или `yup()` в массиве плагинов, с тем же `schemaSuffix`.

## Использование

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

## Опции

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — обязательно
  schemaSuffix: 'Schema',        // должен совпадать со schemaSuffix валидационного плагина
  schemasImportPath: './zod',    // по умолчанию './<resolver>'
})
```

### `resolver`

**Обязательно.** Библиотека валидации, для которой генерируются резолверы. Должна совпадать с одним из подключённых плагинов (`zod()`, `valibot()`, `yup()`).

### `schemaSuffix`

**По умолчанию:** `'Schema'`

Должен совпадать с `schemaSuffix`, указанным в валидационном плагине — по нему `rhf()` находит имена схем (`UserSchema`, `CreateUserInputSchema`, ...).

### `schemasImportPath`

**По умолчанию:** `'./<resolver>'` (например `'./zod'`)

Путь импорта файла со схемами, если он отличается от стандартного.

## Именование резолверов

Для каждой схемы с именем `X` генерируется резолвер `${camelCase(X)}Resolver`:

| Схема | Резолвер |
|-------|----------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## Пример вывода

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

Использование в компоненте:

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

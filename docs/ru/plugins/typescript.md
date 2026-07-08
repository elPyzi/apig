# typescript()

Генерирует TypeScript типы из OpenAPI схем.

`typescript()` не принимает опций. Стиль генерации управляется глобальными опциями `defineConfig`.

## Использование

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## Опции конфига, влияющие на typescript()

Эти опции задаются в `defineConfig`, а не в `typescript()`:

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface', по умолчанию 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const', по умолчанию 'const' для этого плагина
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type' (по умолчанию)
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const' (по умолчанию для typescript())
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## Поддерживаемые возможности OpenAPI

- Примитивы: `string`, `number`, `boolean`
- Форматы строк: `email`, `uuid`, `uri`, `date-time`
- Массивы: `string[]`, `User[]`
- Объекты с обязательными/опциональными свойствами
- `nullable: true` → `T | null`
- `allOf` → пересечение `A & B`
- `oneOf` / `anyOf` → объединение `A | B`
- `oneOf` с `discriminator` → размеченное объединение
- Перечисления → управляется через `enumStyle`
- `$ref` → ссылка на именованный тип

## Пример вывода

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

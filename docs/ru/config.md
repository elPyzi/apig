# Конфигурация

`apig.config.ts` — точка входа для всей конфигурации. Экспортируй один конфиг или массив конфигов.

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

Несколько конфигов (например, для разных API в одном проекте):

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## Опции

### `name`

**Тип:** `string`

Метка для этого конфига, показывается в выводе CLI при использовании нескольких конфигов.

```ts
name: 'users-api'
```

---

### `input`

**Тип:** `string | (() => Promise<string>)`  
**Обязательно:** да

Путь, URL или асинхронная функция, возвращающая путь/URL до OpenAPI спецификации. Поддерживает OpenAPI 3.0 и Swagger 2.0 (автоматически апгрейдится).

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**Тип:** `string | { path: string; clean?: boolean }`  
**По умолчанию:** `.apig/generated`

Директория куда записываются сгенерированные файлы. При передаче строки `clean` по умолчанию `true` (директория очищается перед генерацией).

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**Тип:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**По умолчанию:** `{ name: 'fetch' }`

HTTP клиент, используемый в функциях, сгенерированных `sdk()`. Для `axios`, `ky`, `ofetch`, `wretch` обязательны `path` и `export` — путь к файлу и именованный экспорт твоего инстанса клиента. Для `fetch` они не нужны.

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**Тип:** `ApigPlugin[]`

Массив плагинов. См. [Плагины](./plugins/index.md) для полного списка.

---

### `baseUrl`

**Тип:** `string`

Префикс добавляемый ко всем путям запросов.

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**Тип:** `'none' | 'tags' | 'endpoints' | 'operations'`  
**По умолчанию:** `'none'`

Управляет разбиением сгенерированных файлов:

- `none` — весь вывод в директории `output`, без подпапок (`sdk.ts`, `types.ts`, ...)
- `tags` — подпапка на каждый тег OpenAPI (`users/users.sdk.ts`)
- `endpoints` — подпапка на тег, внутри неё подпапка на каждую операцию (`users/get-user/get-user.sdk.ts`)
- `operations` — подпапка на каждую операцию без группировки по тегу (`get-user/get-user.sdk.ts`)

---

### `fileNaming`

**Тип:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**По умолчанию:** `'kebab-case'`

Соглашение об именовании сгенерированных файлов и директорий (используется при `groupBy` отличном от `none`).

---

### `functionNaming`

**Тип:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**По умолчанию:** `'camelCase'`

Соглашение об именовании сгенерированных SDK функций.

---

### `enumStyle`

**Тип:** `'union' | 'enum' | 'const'`

Управляет генерацией перечислений во всех плагинах (`typescript`, `zod`, `valibot`, `yup`). Это глобальная опция `defineConfig`, а не опция отдельного плагина.

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

По умолчанию плагин `typescript()` использует `'const'`, а `zod()`/`valibot()`/`yup()` используют `'union'`, если `enumStyle` не указан явно.

---

### `typeStyle`

**Тип:** `'type' | 'interface'`  
**По умолчанию:** `'type'`

Стиль объявления типов для объектных схем в `typescript()`. Это глобальная опция `defineConfig`.

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**Тип:** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

Включение или исключение операций:

```ts
filter: {
  tags: ['users', 'orders'], // генерировать только эти теги
  exclude: ['internal'],     // исключить эти теги
  deprecated: false,         // включать deprecated операции (по умолчанию false)
}
```

---

### `rename`

**Тип:** `Record<string, string>`

Переименование `operationId` перед генерацией:

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**Тип:** `boolean`

> **Известная особенность:** на текущий момент это поле нигде не считывается в кодогенерации, кроме проверки типа при валидации конфига — оно не влияет на реальное поведение. Не полагайся на него.

---

### `endpointsMap`

**Тип:** `boolean`  
**По умолчанию:** `false`

Генерировать файл `endpoints.ts` с типизированной константой всех путей API. См. [endpointsMap](./endpoints-map.md).

---

### `index`

**Тип:** `boolean`  
**По умолчанию:** `true`

Управление генерацией `index.ts` с реэкспортами всех сгенерированных файлов.

---

### `formatter`

**Тип:** `'prettier' | 'biome' | 'oxfmt' | 'none'`  
**По умолчанию:** `'none'`

Форматирование сгенерированных файлов после записи.

---

### `cache`

**Тип:** `boolean`  
**По умолчанию:** `false`

Кэшировать распарсенный IR на диске (`.apig/cache`). При повторных запусках пропускает парсинг, если спецификация не изменилась (ETag для URL, хэш для локальных файлов). См. [Кэш](./cache.md).

---

### `apiLogging`

**Тип:** `boolean`  
**По умолчанию:** `false`

Добавляет `console.log(functionName, response)` в каждую сгенерированную SDK функцию.

---

### `cliLogging`

**Тип:** `{ level?: 'minimal' | 'normal' | 'detailed' }`  
**По умолчанию:** `{ level: 'minimal' }`

Уровень подробности логов CLI во время генерации.

---

### `errorHandling`

**Тип:** `boolean | { path: string; export: string }`  
**По умолчанию:** `true`

Обработка ошибок в SDK функциях:

- `true` (по умолчанию) — генерирует встроенный класс `ApigError` в файл `config.ts` в директории вывода
- `false` — отключает обработку ошибок полностью
- `{ path, export }` — использует твой кастомный класс ошибки из указанного пути

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

См. [Клиент ApigError](./client.md).

---

### `rawResponse`

**Тип:** `boolean`  
**По умолчанию:** `false`

Возвращать полный объект ответа `{ body, status, headers }` вместо только данных.

---

### `hooks`

**Тип:** `{ afterAllFilesWrite?: string }`

Команда оболочки выполняемая после записи всех файлов:

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**Тип:** `string`

Комментарий, прикрепляемый к снапшоту версионирования при следующей генерации.

```ts
comment: 'before auth refactor'
```

---

## Версионирование

**Тип:** `Versioning`

```ts
versioning: {
  enabled: true,
  storage: '.apig/versions',
  maxSaves: 10,
  saveSpec: true,
  pinVersions: ['abc123'],
  aliasTemplate: 'v{apiVersion}-gen{generation}',
}
```

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `boolean` | `false` | Включить снапшот-версионирование |
| `storage` | `string` | `.apig/versions` | Директория для хранения снапшотов |
| `saveSpec` | `boolean` | `false` | Сохранять исходную OpenAPI спецификацию в каждом снапшоте |
| `maxSaves` | `number` | без ограничений | Максимум хранимых снапшотов; старые удаляются первыми |
| `pinVersions` | `string[]` | — | ID снапшотов, которые никогда не удаляются автоматически |
| `aliasTemplate` | `string` | `gen{generation}` | Шаблон алиаса снапшота |

Доступные переменные шаблона: `{generation}`, `{apiVersion}`, `{date}`.

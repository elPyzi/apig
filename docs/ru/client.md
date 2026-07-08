# Клиент ApigError

## Класс `ApigError`

Когда `errorHandling` включён (по умолчанию `true`), apig генерирует класс `ApigError` прямо в директорию вывода — в файл `config.ts`. Это **не** экспорт из пакета `@travjek/apig` — это сгенерированный код, который лежит рядом с твоим SDK.

```ts
// сгенерированный ./src/api/config.ts
export class ApigError<T = unknown> extends Error {
  status: number
  body: T
  constructor(status: number, body: T) {
    super(`ApigError ${status}`)
    this.name = 'ApigError'
    this.status = status
    this.body = body
  }
}
```

Сгенерированные SDK функции выбрасывают этот класс при ответах не 2xx.

### Перехват ошибок

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // тело ответа сервера
  }
}
```

## `@travjek/apig/client`

Небольшая runtime библиотека с типобезопасными guard-функциями — полезна, когда неудобно импортировать сгенерированный класс `ApigError` (например, в общих утилитах вне директории вывода).

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

Проверяет, что ошибка была выброшена сгенерированным SDK (по `error.name === 'ApigError'`), без импорта конкретного класса:

```ts
import { isApigError } from '@travjek/apig/client'

try {
  await getUser('123')
} catch (e) {
  if (isApigError(e)) {
    console.log(e.status)
    console.log(e.body)
  }
}
```

### `isApigStatus(error, status)`

Проверяет ошибку и конкретный HTTP статус за один вызов:

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## Кастомный класс ошибки

Класс `ApigError` можно заменить своим через `defineConfig`:

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

Сгенерированные функции будут выбрасывать `MyCustomError` вместо `ApigError`. Класс должен быть импортируемым из указанного пути.

## Отключение обработки ошибок

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

Сгенерированные функции не будут оборачивать ошибки — `fetch`/`axios` и т.д. пробрасывают исключения как есть.

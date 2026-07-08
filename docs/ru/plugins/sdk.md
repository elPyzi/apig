# sdk()

Генерирует типизированные функции запросов для каждой операции в спецификации.

`sdk()` не принимает опций. HTTP-клиент и поведение настраиваются на уровне `defineConfig`.

## Использование

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## Опции конфига, влияющие на sdk()

Эти опции задаются в `defineConfig`, а не в `sdk()`:

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // возвращать { body, status, headers } вместо тела
  apiLogging: false,              // добавить console.log в каждую функцию
  errorHandling: true,            // выбрасывать ApigError при не-2xx ответах
  plugins: [sdk()],
})
```

### `httpClient`

**Тип:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**По умолчанию:** `{ name: 'fetch' }`

HTTP-клиент, используемый в сгенерированных функциях. Для `axios`, `ky`, `ofetch` — укажите `path` и `export`, указывающие на ваш экземпляр клиента.

```ts
// пример с axios
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**Тип:** `boolean`  
**По умолчанию:** `false`

При `true` функции возвращают `{ body, status, headers }` вместо только тела ответа.

### `apiLogging`

**Тип:** `boolean`  
**По умолчанию:** `false`

При `true` добавляет `console.log` в каждую функцию для отладки.

### `errorHandling`

**Тип:** `boolean | { path: string; export: string }`  
**По умолчанию:** `true`

При `true` выбрасывает `ApigError` при не-2xx ответах. Передайте `{ path, export }` для использования кастомного класса ошибки.

## Пример вывода

```ts
export const getUsers = (params?: { page?: number }) =>
  fetch(`/users?${new URLSearchParams(params)}`).then(r => r.json() as Promise<UserList>)

export const createUser = (body: CreateUserInput) =>
  fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json() as Promise<User>)

export const deleteUser = (id: string) =>
  fetch(`/users/${id}`, { method: 'DELETE' })
```

## Multipart form data

Операции с `requestBody` типа `multipart/form-data` определяются автоматически и используют `FormData`:

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

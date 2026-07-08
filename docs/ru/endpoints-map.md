# endpointsMap

При `endpointsMap: true` apig генерирует файл `endpoints.ts` с типизированной константой путей для каждой операции.

## Конфигурация

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## Пример вывода

```ts
// endpoints.ts
export const ENDPOINTS = {
  getUsers: '/users',
  createUser: '/users',
  getUserById: '/users/{id}',
  updateUser: '/users/{id}',
  deleteUser: '/users/{id}',
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
```

Пути сохраняются в исходном формате OpenAPI (`{id}`), без конвертации в формат Express/MSW (`:id`).

## Использование

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

Удобно для логирования, аналитики, проверки прав доступа — везде где нужно ссылаться на пути API без хардкода строк.

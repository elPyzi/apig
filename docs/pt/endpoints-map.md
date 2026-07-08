# endpointsMap

Quando `endpointsMap: true`, o apig gera um arquivo `endpoints.ts` com uma constante tipada de caminhos para cada operação.

## Configuração

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## Exemplo de saída

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

Os caminhos são mantidos no formato original do OpenAPI (`{id}`), sem conversão para o formato Express/MSW (`:id`).

## Uso

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

Útil para logging, analytics, verificação de permissões — em qualquer lugar onde seja necessário referenciar caminhos da API sem codificar strings.

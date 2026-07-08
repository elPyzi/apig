# endpointsMap

Con `endpointsMap: true`, apig genera un archivo `endpoints.ts` con una constante tipada de rutas para cada operación.

## Configuración

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## Ejemplo de salida

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

Las rutas se conservan en el formato original de OpenAPI (`{id}`), sin convertirlas al formato Express/MSW (`:id`).

## Uso

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

Útil para logging, analítica, comprobación de permisos — en cualquier lugar donde necesites referenciar rutas de la API sin codificar cadenas de texto directamente.

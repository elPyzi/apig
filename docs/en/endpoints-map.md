# endpointsMap

When `endpointsMap: true` is set, apig generates an `endpoints.ts` file with a typed constant of paths for every operation.

## Config

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## Output example

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

Paths are kept in the original OpenAPI format (`{id}`), not converted to Express/MSW-style (`:id`).

## Usage

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

Useful for logging, analytics, permission checks — anywhere you need to reference API paths without hardcoding strings.

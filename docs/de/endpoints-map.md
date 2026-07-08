# endpointsMap

Wenn `endpointsMap: true` gesetzt ist, generiert apig eine Datei `endpoints.ts` mit einer typisierten Konstante der Pfade für jede Operation.

## Konfiguration

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## Ausgabebeispiel

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

Die Pfade bleiben im ursprünglichen OpenAPI-Format (`{id}`) erhalten, ohne Umwandlung in das Express/MSW-Format (`:id`).

## Verwendung

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

Nützlich für Logging, Analytics, Berechtigungsprüfungen — überall dort, wo auf API-Pfade verwiesen werden muss, ohne Zeichenketten fest zu kodieren.

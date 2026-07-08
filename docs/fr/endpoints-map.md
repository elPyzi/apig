# endpointsMap

Avec `endpointsMap: true`, apig génère un fichier `endpoints.ts` avec une constante typée regroupant les chemins de chaque opération.

## Configuration

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## Exemple de sortie

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

Les chemins sont conservés dans leur format OpenAPI d'origine (`{id}`), sans conversion vers le format Express/MSW (`:id`).

## Utilisation

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

Pratique pour la journalisation, l'analytique, la vérification des droits d'accès — partout où il faut référencer les chemins d'API sans coder de chaînes en dur.

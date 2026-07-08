# sdk()

Génère des fonctions de requête typées pour chaque opération de la spécification.

`sdk()` n'accepte pas d'options. Le client HTTP et le comportement se configurent au niveau de `defineConfig`.

## Utilisation

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## Options de configuration influençant sdk()

Ces options sont définies dans `defineConfig`, pas dans `sdk()` :

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // renvoyer { body, status, headers } au lieu du seul corps
  apiLogging: false,              // ajouter console.log dans chaque fonction
  errorHandling: true,            // lever ApigError sur les réponses non-2xx
  plugins: [sdk()],
})
```

### `httpClient`

**Type :** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Par défaut :** `{ name: 'fetch' }`

Client HTTP utilisé dans les fonctions générées. Pour `axios`, `ky`, `ofetch` — indique `path` et `export`, pointant vers ton instance de client.

```ts
// exemple avec axios
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**Type :** `boolean`  
**Par défaut :** `false`

Si `true`, les fonctions renvoient `{ body, status, headers }` au lieu du seul corps de la réponse.

### `apiLogging`

**Type :** `boolean`  
**Par défaut :** `false`

Si `true`, ajoute `console.log` dans chaque fonction pour le débogage.

### `errorHandling`

**Type :** `boolean | { path: string; export: string }`  
**Par défaut :** `true`

Si `true`, lève `ApigError` sur les réponses non-2xx. Passe `{ path, export }` pour utiliser une classe d'erreur personnalisée.

## Exemple de sortie

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

Les opérations avec un `requestBody` de type `multipart/form-data` sont détectées automatiquement et utilisent `FormData` :

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

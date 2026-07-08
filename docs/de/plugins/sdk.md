# sdk()

Generiert typisierte Anfragefunktionen für jede Operation in der Spezifikation.

`sdk()` nimmt keine Optionen entgegen. HTTP-Client und Verhalten werden auf Ebene von `defineConfig` konfiguriert.

## Verwendung

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## Konfigurationsoptionen, die sdk() beeinflussen

Diese Optionen werden in `defineConfig` gesetzt, nicht in `sdk()`:

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // { body, status, headers } statt nur den Körper zurückgeben
  apiLogging: false,              // console.log in jede Funktion einfügen
  errorHandling: true,            // ApigError bei Nicht-2xx-Antworten werfen
  plugins: [sdk()],
})
```

### `httpClient`

**Typ:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Standard:** `{ name: 'fetch' }`

HTTP-Client, der in den generierten Funktionen verwendet wird. Für `axios`, `ky`, `ofetch` — gib `path` und `export` an, die auf deine Client-Instanz zeigen.

```ts
// Beispiel mit axios
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**Typ:** `boolean`  
**Standard:** `false`

Bei `true` geben die Funktionen `{ body, status, headers }` zurück statt nur den Antwortkörper.

### `apiLogging`

**Typ:** `boolean`  
**Standard:** `false`

Bei `true` wird `console.log` zu jeder Funktion zu Debugzwecken hinzugefügt.

### `errorHandling`

**Typ:** `boolean | { path: string; export: string }`  
**Standard:** `true`

Bei `true` wird `ApigError` bei Nicht-2xx-Antworten geworfen. Übergib `{ path, export }`, um eine eigene Fehlerklasse zu verwenden.

## Ausgabebeispiel

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

## Multipart-Formulardaten

Operationen mit `requestBody` vom Typ `multipart/form-data` werden automatisch erkannt und verwenden `FormData`:

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

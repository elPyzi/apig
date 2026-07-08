# sdk()

Genera funciones de solicitud tipadas para cada operación de la especificación.

`sdk()` no acepta opciones. El cliente HTTP y el comportamiento se configuran a nivel de `defineConfig`.

## Uso

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## Opciones de configuración que afectan a sdk()

Estas opciones se establecen en `defineConfig`, no en `sdk()`:

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // devolver { body, status, headers } en vez de solo el cuerpo
  apiLogging: false,              // añadir console.log en cada función
  errorHandling: true,            // lanzar ApigError en respuestas no 2xx
  plugins: [sdk()],
})
```

### `httpClient`

**Tipo:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Por defecto:** `{ name: 'fetch' }`

Cliente HTTP usado en las funciones generadas. Para `axios`, `ky`, `ofetch` — indica `path` y `export`, apuntando a tu instancia de cliente.

```ts
// ejemplo con axios
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**Tipo:** `boolean`  
**Por defecto:** `false`

Cuando es `true`, las funciones devuelven `{ body, status, headers }` en lugar de solo el cuerpo de la respuesta.

### `apiLogging`

**Tipo:** `boolean`  
**Por defecto:** `false`

Cuando es `true`, añade `console.log` en cada función para depuración.

### `errorHandling`

**Tipo:** `boolean | { path: string; export: string }`  
**Por defecto:** `true`

Cuando es `true`, lanza `ApigError` en respuestas no 2xx. Pasa `{ path, export }` para usar una clase de error personalizada.

## Ejemplo de salida

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

Las operaciones con `requestBody` de tipo `multipart/form-data` se detectan automáticamente y usan `FormData`:

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

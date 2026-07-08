# sdk()

Gera funções de requisição tipadas para cada operação na especificação.

`sdk()` não tem opções. O cliente HTTP e o comportamento são configurados no nível de `defineConfig`.

## Uso

```ts
import { defineConfig, typescript, sdk } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk()],
})
```

## Opções de configuração que afetam sdk()

Estas opções são definidas em `defineConfig`, não em `sdk()`:

```ts
defineConfig({
  httpClient: { name: 'fetch' },  // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'
  rawResponse: false,             // retornar { body, status, headers } em vez do corpo
  apiLogging: false,              // adicionar console.log a cada função gerada
  errorHandling: true,            // lançar ApigError em respostas não-2xx
  plugins: [sdk()],
})
```

### `httpClient`

**Tipo:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Padrão:** `{ name: 'fetch' }`

O cliente HTTP usado nas funções geradas. Para `axios`, `ky`, `ofetch` — forneça `path` e `export` apontando para sua instância de cliente.

```ts
// exemplo com axios
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

### `rawResponse`

**Tipo:** `boolean`  
**Padrão:** `false`

Quando `true`, as funções retornam `{ body, status, headers }` em vez de apenas o corpo da resposta.

### `apiLogging`

**Tipo:** `boolean`  
**Padrão:** `false`

Quando `true`, adiciona `console.log` a cada função gerada para depuração.

### `errorHandling`

**Tipo:** `boolean | { path: string; export: string }`  
**Padrão:** `true`

Quando `true`, lança `ApigError` em respostas não-2xx. Passe `{ path, export }` para usar uma classe de erro personalizada.

## Exemplo de saída

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

## Dados de formulário multipart

Operações com `requestBody` do tipo `multipart/form-data` são detectadas automaticamente e usam `FormData`:

```ts
export const uploadAvatar = (file: File | Blob) => {
  const _fd = new FormData();
  if (file !== undefined) _fd.append('file', file);
  return fetch('/avatar', { method: 'POST', body: _fd });
};
```

# Configuração

`apig.config.ts` é o ponto de entrada para toda a configuração. Exporte uma única configuração ou um array de configurações.

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

Múltiplas configurações (por exemplo, para diferentes APIs no mesmo projeto):

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## Opções

### `name`

**Tipo:** `string`

Rótulo para esta configuração, exibido na saída do CLI quando há múltiplas configurações.

```ts
name: 'users-api'
```

---

### `input`

**Tipo:** `string | (() => Promise<string>)`
**Obrigatório:** sim

Caminho, URL ou função assíncrona que retorna o caminho/URL da especificação OpenAPI. Suporta OpenAPI 3.0 e Swagger 2.0 (atualizado automaticamente).

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**Tipo:** `string | { path: string; clean?: boolean }`
**Padrão:** `.apig/generated`

Diretório onde os arquivos gerados são escritos. Ao passar uma string, `clean` é `true` por padrão (o diretório é limpo antes da geração).

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**Tipo:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`
**Padrão:** `{ name: 'fetch' }`

Cliente HTTP usado nas funções geradas pelo `sdk()`. Para `axios`, `ky`, `ofetch`, `wretch` são obrigatórios `path` e `export` — o caminho do arquivo e a exportação nomeada da sua instância do cliente. Para `fetch` eles não são necessários.

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**Tipo:** `ApigPlugin[]`

Array de plugins. Veja [Plugins](./plugins/index.md) para a lista completa.

---

### `baseUrl`

**Tipo:** `string`

Prefixo adicionado a todos os caminhos de requisição.

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**Tipo:** `'none' | 'tags' | 'endpoints' | 'operations'`
**Padrão:** `'none'`

Controla como os arquivos gerados são divididos:

- `none` — toda a saída no diretório `output`, sem subpastas (`sdk.ts`, `types.ts`, ...)
- `tags` — uma subpasta por tag OpenAPI (`users/users.sdk.ts`)
- `endpoints` — uma subpasta por tag, e dentro dela uma subpasta por operação (`users/get-user/get-user.sdk.ts`)
- `operations` — uma subpasta por operação, sem agrupamento por tag (`get-user/get-user.sdk.ts`)

---

### `fileNaming`

**Tipo:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`
**Padrão:** `'kebab-case'`

Convenção de nomenclatura para os arquivos e diretórios gerados (usada quando `groupBy` é diferente de `none`).

---

### `functionNaming`

**Tipo:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`
**Padrão:** `'camelCase'`

Convenção de nomenclatura para as funções SDK geradas.

---

### `enumStyle`

**Tipo:** `'union' | 'enum' | 'const'`

Controla a geração de enums em todos os plugins (`typescript`, `zod`, `valibot`, `yup`). É uma opção global do `defineConfig`, não uma opção de plugin individual.

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

Por padrão, o plugin `typescript()` usa `'const'`, enquanto `zod()`/`valibot()`/`yup()` usam `'union'`, caso `enumStyle` não seja definido explicitamente.

---

### `typeStyle`

**Tipo:** `'type' | 'interface'`
**Padrão:** `'type'`

Estilo de declaração de tipos para esquemas de objeto em `typescript()`. É uma opção global do `defineConfig`.

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**Tipo:** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

Inclusão ou exclusão de operações:

```ts
filter: {
  tags: ['users', 'orders'], // gerar apenas essas tags
  exclude: ['internal'],     // excluir essas tags
  deprecated: false,         // incluir operações deprecated (padrão false)
}
```

---

### `rename`

**Tipo:** `Record<string, string>`

Renomear `operationId` antes da geração:

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**Tipo:** `boolean`

> **Particularidade conhecida:** atualmente esse campo não é lido em nenhum lugar da geração de código, exceto na verificação de tipo ao validar a configuração — ele não afeta o comportamento real. Não confie nele.

---

### `endpointsMap`

**Tipo:** `boolean`
**Padrão:** `false`

Gera um arquivo `endpoints.ts` com uma constante tipada de todos os caminhos da API. Veja [endpointsMap](./endpoints-map.md).

---

### `index`

**Tipo:** `boolean`
**Padrão:** `true`

Controla a geração do `index.ts` com re-exportações de todos os arquivos gerados.

---

### `formatter`

**Tipo:** `'prettier' | 'biome' | 'oxfmt' | 'none'`
**Padrão:** `'none'`

Formatação dos arquivos gerados após a escrita.

---

### `cache`

**Tipo:** `boolean`
**Padrão:** `false`

Faz cache do IR já analisado em disco (`.apig/cache`). Em execuções seguintes, pula a análise caso a especificação não tenha mudado (ETag para URL, hash para arquivos locais). Veja [Cache](./cache.md).

---

### `apiLogging`

**Tipo:** `boolean`
**Padrão:** `false`

Adiciona `console.log(functionName, response)` em cada função SDK gerada.

---

### `cliLogging`

**Tipo:** `{ level?: 'minimal' | 'normal' | 'detailed' }`
**Padrão:** `{ level: 'minimal' }`

Nível de detalhe dos logs do CLI durante a geração.

---

### `errorHandling`

**Tipo:** `boolean | { path: string; export: string }`
**Padrão:** `true`

Tratamento de erros nas funções SDK:

- `true` (padrão) — gera a classe `ApigError` embutida no arquivo `config.ts` no diretório de saída
- `false` — desabilita totalmente o tratamento de erros
- `{ path, export }` — usa sua classe de erro personalizada a partir do caminho indicado

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

Veja [Cliente ApigError](./client.md).

---

### `rawResponse`

**Tipo:** `boolean`
**Padrão:** `false`

Retorna o objeto de resposta completo `{ body, status, headers }` em vez de apenas os dados.

---

### `hooks`

**Tipo:** `{ afterAllFilesWrite?: string }`

Comando de shell executado após a escrita de todos os arquivos:

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**Tipo:** `string`

Comentário anexado ao snapshot de versionamento na próxima geração.

```ts
comment: 'before auth refactor'
```

---

## Versionamento

**Tipo:** `Versioning`

```ts
versioning: {
  enabled: true,
  storage: '.apig/versions',
  maxSaves: 10,
  saveSpec: true,
  pinVersions: ['abc123'],
  aliasTemplate: 'v{apiVersion}-gen{generation}',
}
```

| Campo | Tipo | Padrão | Descrição |
|------|-----|--------------|----------|
| `enabled` | `boolean` | `false` | Habilita o versionamento por snapshots |
| `storage` | `string` | `.apig/versions` | Diretório para armazenar os snapshots |
| `saveSpec` | `boolean` | `false` | Salva a especificação OpenAPI original em cada snapshot |
| `maxSaves` | `number` | sem limite | Número máximo de snapshots mantidos; os mais antigos são removidos primeiro |
| `pinVersions` | `string[]` | — | IDs de snapshot que nunca são removidos automaticamente |
| `aliasTemplate` | `string` | `gen{generation}` | Modelo do alias do snapshot |

Variáveis de modelo disponíveis: `{generation}`, `{apiVersion}`, `{date}`.

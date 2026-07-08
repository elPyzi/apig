# @travjek/apig

Um gerador de código OpenAPI poderoso e amigável para desenvolvedores que elimina a dor da integração de APIs — e torna o seu dia um pouco mais feliz.

## Instalação

```bash
npm install -D @travjek/apig
```

## Início rápido

```ts
// apig.config.ts
import { defineConfig, typescript, sdk, zod, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery(),
  ],
})
```

```bash
npx apig generate
```

## Plugins

| Plugin | Descrição |
|--------|-----------|
| `typescript()` | Tipos TypeScript a partir de esquemas OpenAPI |
| `sdk()` | Funções de requisição tipadas (`fetch`, `axios`, `ky`, `ofetch`, `wretch`) |
| `zod()` | Esquemas Zod com email, uuid, min/max, uniões discriminadas |
| `valibot()` | Esquemas Valibot |
| `yup()` | Esquemas Yup |
| `tanstackQuery()` | Hooks TanStack Query v5 |
| `swr()` | Hooks SWR |
| `rhf()` | Resolvers React Hook Form |
| `faker()` | Fábricas Faker.js |
| `msw()` | Handlers Mock Service Worker |

## CLI

```bash
apig generate           # gerar código
apig generate --watch   # modo de observação
apig generate --dry-run # pré-visualização sem escrever arquivos
apig versions           # listar snapshots salvos
apig info               # estatísticas da especificação sem gerar código
```

## Documentação

- [Configuração](./config.md)
- [CLI](./cli.md)
- [Plugins](./plugins/index.md)
  - [typescript()](./plugins/typescript.md)
  - [sdk()](./plugins/sdk.md)
  - [zod()](./plugins/zod.md)
  - [valibot()](./plugins/valibot.md)
  - [yup()](./plugins/yup.md)
  - [tanstackQuery()](./plugins/tanstack-query.md)
  - [swr()](./plugins/swr.md)
  - [rhf()](./plugins/rhf.md)
  - [faker()](./plugins/faker.md)
  - [msw()](./plugins/msw.md)
- [Criar plugin personalizado](./custom-plugin.md)
- [Cliente ApigError](./client.md)
- [Cache](./cache.md)
- [endpointsMap](./endpoints-map.md)

## Licença

MIT

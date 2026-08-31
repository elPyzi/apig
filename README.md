# @travjek/apig

OpenAPI code generator for TypeScript with a plugin system.

A powerful, developer-friendly OpenAPI code generator that takes the pain out of API integration — and makes your day a little happier.

## Install

```bash
npm install -D @travjek/apig
```

## Quick start

```ts
// apig.config.ts
import { defineConfig, typescript, requests, zod, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    requests(),
    zod({ withTypes: true }),
    tanstackQuery(),
  ],
})
```

```bash
npx apig generate
```

## Plugins

| Plugin | Description |
|--------|-------------|
| `typescript()` | TypeScript types from OpenAPI schemas |
| `requests()` | Typed request functions (`fetch`, `axios`, `ky`, `ofetch`, `wretch`) |
| `zod()` | Zod schemas with email, uuid, min/max, discriminated unions |
| `valibot()` | Valibot schemas |
| `yup()` | Yup schemas |
| `tanstackQuery()` | TanStack Query v5 hooks (`useQuery`, `useMutation`, `useInfiniteQuery`, `useSuspenseQuery`) — React, Vue, Svelte, Solid |
| `swr()` | SWR hooks (`useSWR`, `useSWRMutation`) — React, Vue |
| `rhf()` | React Hook Form resolvers (zod / valibot / yup) |
| `faker()` | Faker.js factories from schema formats and field-name heuristics |
| `msw()` | Mock Service Worker handlers |
| `playwright()` | Playwright API client and test fixture |
| `mcp()` | MCP server exposing the request functions as tools |

## CLI

```bash
apig generate           # generate code
apig generate --watch   # watch mode
apig generate --dry-run # preview without writing
apig versions           # list saved snapshots
apig info               # show spec stats without generating
```

## Documentation

- [Configuration](./docs/en/config.md)
- [CLI](./docs/en/cli.md)
- [Plugins](./docs/en/plugins/index.md)
  - [typescript()](./docs/en/plugins/typescript.md)
  - [requests()](./docs/en/plugins/requests.md)
  - [zod()](./docs/en/plugins/zod.md)
  - [valibot()](./docs/en/plugins/valibot.md)
  - [yup()](./docs/en/plugins/yup.md)
  - [tanstackQuery()](./docs/en/plugins/tanstack-query.md)
  - [swr()](./docs/en/plugins/swr.md)
  - [rhf()](./docs/en/plugins/rhf.md)
  - [faker()](./docs/en/plugins/faker.md)
  - [msw()](./docs/en/plugins/msw.md)
  - [playwright()](./docs/en/plugins/playwright.md)
- [Creating a custom plugin](./docs/en/custom-plugin.md)
- [ApigError client](./docs/en/client.md)
- [Cache](./docs/en/cache.md)
- [endpointsMap](./docs/en/endpoints-map.md)

## License

MIT

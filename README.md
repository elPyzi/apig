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

Full reference for every plugin, CLI command and config option:
**https://apig-docs.vercel.app**

The `docs/` directory here is a mirror synced from that site.

## License

MIT

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

| Plugin | Description |
|--------|-------------|
| `typescript()` | TypeScript types from OpenAPI schemas |
| `sdk()` | Typed request functions (`fetch`, `axios`, `ky`, `ofetch`, `wretch`) |
| `zod()` | Zod schemas with email, uuid, min/max, discriminated unions |
| `valibot()` | Valibot schemas |
| `yup()` | Yup schemas |
| `tanstackQuery()` | TanStack Query v5 hooks (`useQuery`, `useMutation`, `useInfiniteQuery`, `useSuspenseQuery`) |
| `swr()` | SWR hooks (`useSWR`, `useSWRMutation`) |
| `rhf()` | React Hook Form resolvers (zod / valibot / yup) |
| `faker()` | Faker.js factories with semantic field name heuristics |
| `msw()` | Mock Service Worker handlers |

## CLI

```bash
apig generate           # generate code
apig generate --watch   # watch mode
apig generate --dry-run # preview without writing
apig versions           # list saved snapshots
apig info               # show resolved config
```

## License

MIT

# @travjek/apig

Generate TypeScript types, request functions, Zod/Valibot/Yup schemas, TanStack Query/SWR hooks, React Hook Form resolvers, Faker factories, MSW handlers, a Playwright API client and an MCP server from OpenAPI specs.

The complete reference is [`llms.txt`](https://github.com/elPyzi/apig/blob/main/llms.txt) and the README.

## Quick Start

```bash
npm install -D @travjek/apig
```

```ts
// apig.config.ts
import { defineConfig, typescript, requests, zod, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json', // local file or URL
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

## Plugin Selection Guide

| Goal | Plugins to use |
|------|----------------|
| Just TypeScript types | `typescript()` |
| Types + fetch functions | `typescript()`, `requests()` |
| Types + Zod validation | `typescript()`, `zod()` |
| React Query hooks | `typescript()`, `requests()`, `tanstackQuery()` |
| SWR hooks | `typescript()`, `requests()`, `swr()` |
| Form validation | `typescript()`, `zod()`, `rhf({ resolver: 'zod' })` |
| MSW mocks for testing | `typescript()`, `faker()`, `msw()` |
| Playwright API tests | `typescript()`, `playwright()` |
| MCP server over the API | `typescript()`, `requests()`, `zod()`, `mcp()` |
| Everything | `typescript()`, `requests()`, `zod()`, `tanstackQuery()`, `faker()`, `msw()` |

## Key API Details (don't get these wrong)

- `playwright()` generates the API **client and fixture, not the tests** — it never writes `test(...)` bodies or assertions.
- `requests()`, `typescript()`, `msw()` take **no options** (`faker()` takes only `locale`). HTTP client, enum style, and type style are `defineConfig`-level options, not plugin options.
- `rhf()` generates **one resolver per schema** (`userResolver`, `createUserInputResolver`), not one resolver per form/operation.
- `ApigError` is **generated into the user's own output directory** (as `config.ts`) — it is not exported from `@travjek/apig/client`. That subpath only exports `isApigError()`/`isApigStatus()` guard functions.
- TanStack Query hook names: `useGetUsersQuery`, `useInfinityGetUsersQuery`, `useSuspenseGetUsersQuery`, `useCreateUserMutation`. Query key function: `getUsersQueryKey`.
- SWR hook names: query stays `useGetUsers`, but mutation is `useCreateUserMutation` (with the `Mutation` suffix). Key function: `getUsersSwrKey`.
- `faker()` field-name heuristics only cover: `username`, `email`, `password`, `phone`, `url`/`photo`, `firstName`, `lastName`, `name`, `date`, `status`, `id`. Everything else falls back to a generic value by schema type.
- `endpointsMap: true` generates `ENDPOINTS` (a plain `{ key: '/path' }` map) and an `EndpointKey` type — not an object with `{ method, path }`.
- `filter.deprecated` (not `filter.includeDeprecated`).
- When `zod()`/`valibot()`/`yup()` runs with `withTypes: true` (the default) it emits the types itself and **`types.ts` is not written** — request functions import types from `zod.ts`. Pass `withTypes: false` to keep `types.ts`.
- Request function arguments: path params (one each) → `params` (query object) → `body` → `headers` (header object). TanStack/SWR mutation variables are an object: `mutate({ id, body })`.
- A response with no JSON body (`204`) is typed `void` and never parsed. `default`/`4XX` error responses are typed `status: number` in the `<Op>Errors` union. `<Op>Errors` types are imported from `./requests`, not from `index.ts`.
- Specs behind HTTP Basic Auth: top-level `auth: { username: process.env.X, password: process.env.Y }` — sent only to the spec's own origin.
- Moving from another generator: `npx apig migrate orval|kubb|hey-api` writes `apig.config.ts` and marks anything unmappable as `TODO(migrate)`.
- The default export of `apig.config.ts` must be an object or an array of objects — a function is not supported by the CLI.

## Configuration Reference

```ts
defineConfig({
  // Input
  input: './openapi.json',          // local path (JSON/YAML), URL, or () => Promise<string>
  auth: { username: process.env.SWAGGER_USER, password: process.env.SWAGGER_PASSWORD }, // optional basic auth

  // Output
  output: './src/api',              // output directory (default: .apig/generated)

  // HTTP client (used by requests()) — a defineConfig option, requests() itself has no options
  httpClient: { name: 'fetch' },    // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'

  // Enum/type style — also defineConfig options, not plugin options
  enumStyle: 'const',               // 'union' | 'enum' | 'const'
  typeStyle: 'type',                // 'type' | 'interface'

  // Plugins — a valid set; see the notes below for the alternatives
  plugins: [
    typescript(),                    // no options
    requests(),                      // no options — see httpClient above
    zod({
      withTypes: true,              // emit TS types here (types.ts is then skipped)
      infer: true,                   // export type X = z.infer<typeof XSchema> (default: true)
      schemaSuffix: 'Schema',       // suffix for schema names (default: 'Schema')
    }),
    // valibot() / yup() instead of zod() — only one validator may have withTypes: true
    tanstackQuery({
      query: true,                   // useQuery hooks (default: true)
      mutation: true,                // useMutation hooks (default: true)
      infinite: true,               // generate useInfiniteQuery hooks (named useInfinityXQuery)
      suspense: true,               // generate useSuspenseQuery hooks
    }),
    // swr() instead of tanstackQuery() — both together need index: false
    rhf({
      resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — required
    }),
    faker({ locale: 'en' }),         // 'en' | 'ru'
    msw(),                          // no options — requires faker()
  ],
})
```

## CLI Reference

```bash
apig generate             # run generation once (alias: g)
apig generate --watch     # watch mode, re-generate on spec changes
apig generate --dry-run   # preview output without writing files
apig start                # interactive setup wizard (alias: s)
apig config               # scaffold a new apig.config.ts (alias: c); --preset <name>, --list-presets
apig info                 # show spec stats without generating (alias: i)
apig migrate <orval|kubb|hey-api>  # convert another generator's config (alias: m); --target <path>, --clean
apig cache status         # show the parsed-spec cache
apig cache clear          # drop the cache
apig versions             # list saved snapshots
apig version checkout <id>  # regenerate from a saved snapshot
apig version show <id>      # show snapshot details
```

## requests Client Options

| Client | Install |
|--------|---------|
| `fetch` (default) | built-in, no install needed |
| `axios` | `npm install axios` |
| `ky` | `npm install ky` |
| `ofetch` | `npm install ofetch` |
| `wretch` | `npm install wretch` — register `wretch/addons/queryString` on your instance, the generated calls use `.query()` |

## Detailed Guides

- [plugins.md](./plugins.md) — all plugins with options and output examples
- [custom-plugin.md](./custom-plugin.md) — how to write your own plugin
- [cache.md](./cache.md) — caching the parsed spec (`ttl`, `maxEntries`)

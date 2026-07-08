# @travjek/apig

Generate TypeScript types, SDK clients, Zod/Valibot/Yup schemas, TanStack Query/SWR hooks, React Hook Form resolvers, Faker factories, and MSW handlers from OpenAPI specs.

## Quick Start

```bash
npm install -D @travjek/apig
```

```ts
// apig.config.ts
import { defineConfig, typescript, sdk, zod, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json', // local file or URL
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

## Plugin Selection Guide

| Goal | Plugins to use |
|------|----------------|
| Just TypeScript types | `typescript()` |
| Types + fetch functions | `typescript()`, `sdk()` |
| Types + Zod validation | `typescript()`, `zod()` |
| React Query hooks | `typescript()`, `sdk()`, `tanstackQuery()` |
| SWR hooks | `typescript()`, `sdk()`, `swr()` |
| Form validation | `typescript()`, `zod()`, `rhf({ resolver: 'zod' })` |
| MSW mocks for testing | `typescript()`, `faker()`, `msw()` |
| Everything | `typescript()`, `sdk()`, `zod()`, `tanstackQuery()`, `faker()`, `msw()` |

## Key API Details (don't get these wrong)

- `sdk()`, `typescript()`, `faker()`, `msw()` take **no options**. HTTP client, enum style, and type style are `defineConfig`-level options, not plugin options.
- `rhf()` generates **one resolver per schema** (`userResolver`, `createUserInputResolver`), not one resolver per form/operation.
- `ApigError` is **generated into the user's own output directory** (as `config.ts`) — it is not exported from `@travjek/apig/client`. That subpath only exports `isApigError()`/`isApigStatus()` guard functions.
- TanStack Query hook names: `useGetUsersQuery`, `useInfinityGetUsersQuery`, `useSuspenseGetUsersQuery`, `useCreateUserMutation`. Query key function: `getUsersQueryKey`.
- SWR hook names: query stays `useGetUsers`, but mutation is `useCreateUserMutation` (with the `Mutation` suffix). Key function: `getUsersSwrKey`.
- `faker()` field-name heuristics only cover: `username`, `email`, `password`, `phone`, `url`/`photo`, `firstName`, `lastName`, `name`, `date`, `status`, `id`. Everything else falls back to a generic value by schema type.
- `endpointsMap: true` generates `ENDPOINTS` (a plain `{ key: '/path' }` map) and an `EndpointKey` type — not an object with `{ method, path }`.
- `filter.deprecated` (not `filter.includeDeprecated`).

## Configuration Reference

```ts
defineConfig({
  // Input
  input: './openapi.json',          // local path or URL
  
  // Output
  output: './src/api',              // output directory (default: .apig/generated)

  // HTTP client (used by sdk()) — a defineConfig option, sdk() itself has no options
  httpClient: { name: 'fetch' },    // 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'

  // Enum/type style — also defineConfig options, not plugin options
  enumStyle: 'const',               // 'union' | 'enum' | 'const'
  typeStyle: 'type',                // 'type' | 'interface'

  // Plugins
  plugins: [
    typescript(),                    // no options
    sdk(),                            // no options — see httpClient above
    zod({
      withTypes: true,              // re-export TS types from schemas
      infer: true,                   // export type X = z.infer<typeof XSchema>
      schemaSuffix: 'Schema',       // suffix for schema names (default: 'Schema')
    }),
    valibot(),
    yup(),
    tanstackQuery({
      query: true,                   // useQuery hooks (default: true)
      mutation: true,                // useMutation hooks (default: true)
      infinite: true,               // generate useInfiniteQuery hooks (named useInfinityXQuery)
      suspense: true,               // generate useSuspenseQuery hooks
    }),
    swr(),
    rhf({
      resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — required
    }),
    faker(),                         // no options
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
apig versions             # list saved snapshots
apig version checkout <id>  # regenerate from a saved snapshot
apig version show <id>      # show snapshot details
```

## SDK Client Options

| Client | Install |
|--------|---------|
| `fetch` (default) | built-in, no install needed |
| `axios` | `npm install axios` |
| `ky` | `npm install ky` |
| `ofetch` | `npm install ofetch` |
| `wretch` | `npm install wretch` |

## Detailed Guides

- [plugins.md](./plugins.md) — all plugins with options and output examples
- [custom-plugin.md](./custom-plugin.md) — how to write your own plugin
- [cache.md](./cache.md) — ETag-based caching for remote specs

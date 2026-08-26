# Changelog

All notable changes to `@travjek/apig` will be documented in this file.

## [0.10.1]

### Fixed
- `homepage` in `package.json` pointed at the GitHub README instead of the docs site
- Doc links in the banner, `apig start`/`apig config`, and config-validation errors pointed at a placeholder domain (`example.com`) instead of the real docs site

---

## [0.10.0]

### Added
- `mcp()` plugin — generates an MCP server exposing every operation as a tool, so an AI assistant can call the API through the generated SDK. Requires `sdk()` and `zod()`
- Plugin dependency validation — `msw()` without `faker()`, `mcp()` without `sdk()`/`zod()`, and `rhf()` without a validation plugin are now caught during config validation instead of failing mid-generation
- `schemaSuffix` is exposed on validation plugins, so `mcp()` resolves imported schema names without the option being repeated by hand
- `@modelcontextprotocol/sdk` declared as an optional peer dependency, alongside a runtime-requirements header in the generated `mcp.ts` — a missing install otherwise shows up only as the MCP client closing the connection with no reason
- `apiLogging` combined with `mcp()` is now a config error: the SDK's `console.log` writes to stdout, which is the MCP transport

### Fixed
- A non-JSON error response (a gateway 502, a plain-text 404) made the generated fetch SDK throw a JSON parse error and lose the status code entirely. Error bodies now go through a `parseErrorBody` helper that falls back to text

---

## [0.9.0]

### Added
- `framework` option for `tanstackQuery()` and `swr()` — Vue, Solid and Svelte targets alongside React
- Plugin option types (`ZodOptions`, `TanstackQueryOptions`, `SdkOptions`, …) are now exported from the package root
- `toQuery` helper is emitted into `config.ts` when generating fetch-based SDKs with query parameters

### Fixed
- `msw()` emitted an internal `@/plugins/faker` import into user code, so the generated `msw.ts` never compiled
- Generated fetch calls passed the typed params object straight to `new URLSearchParams`, which fails `tsc --strict` on any non-string query parameter, always appended a trailing `?`, serialized `undefined` as the string `"undefined"` and ignored array values
- `zod({ withTypes: false })` (and the valibot/yup equivalents) still made the SDK import its types from the validation file, which no longer exported them
- Root-scoped plugins (`faker()`, `msw()`, `rhf()`) built import paths as if they were nested, breaking every layout except `groupBy: 'none'`
- Custom `fileName` on a plugin was ignored by importers, which always assumed the default name
- `apig --version` reported a hardcoded `0.0.1`; it now reads the installed package version
- `allOf` with an empty `schemas` list crashed zod and yup generation

### Changed
- `clean` no longer deletes the whole output directory — only files carrying the generator's banner are removed, and anything else is kept and reported. `deletedFiles` in the run summary is now accurate instead of always `0`
- Generated `config.ts` carries the standard banner like every other generated file
- The five HTTP client adapters were collapsed into one table-driven module

### Removed
- `validate` config option from the docs — it was never read by `ApigConfig`, and passing it fails validation as an unknown property

---

## [0.8.1]

### Changed
- Plugin default values centralized into a single `DEFAULTS` constant
- `@faker-js/faker` dropped from devDependencies

---

## [0.8.0]

### Added
- `groupBy` option: `none` | `tags` | `endpoints` | `operations` — split generated files by structure
- `version checkout <id|alias>` CLI command — regenerate code from a saved snapshot
- `wretch` HTTP client support (`httpClient: { name: 'wretch' }`)
- File-based IR cache with ETag support (`cache: true`) — avoids re-downloading unchanged specs
- `apig versions` — list snapshots with alias, ID, and creation date columns
- `apig info` — displays resolved config and spec summary
- `apig config` — displays current config
- `@travjek/apig/client` — `ApigError` client library for runtime error handling
- `output` is now optional — defaults to `.apig/generated`

### Fixed
- `$ref` schemas inside object properties now resolve correctly instead of falling back to `unknown`
- Inline object indentation in generated zod/valibot/yup schemas

---

## [0.7.0]

### Added
- `versioning` — snapshot-based versioning of generated IR
  - `enabled`, `storage`, `maxSaves`, `saveSpec` options
  - `pinVersions` — array of snapshot IDs protected from auto-deletion
  - `aliasTemplate` — template for snapshot names (`{generation}`, `{apiVersion}`, `{date}`)
- Warning when spec has no `info.version`
- Warning when `aliasTemplate` produces a duplicate alias

---

## [0.6.0]

### Added
- `swr()` plugin — generates SWR hooks
  - `useSWR` query hooks with `SWRConfiguration` options
  - `useSWRMutation` mutation hooks with `SWRMutationConfiguration` options
  - `queryKeysStyle`: `functions` | `object`
  - `hookGenerationStrategies` — per-operationId override
- `rhf()` plugin — generates React Hook Form resolvers
  - Supports `zod`, `valibot`, `yup` resolvers
  - `resolver` option to specify which validation library to use

---

## [0.5.0]

### Added
- `faker()` plugin — generates Faker.js factories for all schemas
  - Semantic field name heuristics (`email`, `name`, `phone`, `url`, `date`, `id`, etc.)
  - Enum fields use `faker.helpers.arrayElement`
  - Array fields use `faker.helpers.multiple`
  - Inline object array items generated correctly
- `msw()` plugin — generates Mock Service Worker request handlers
  - Requires `faker()` plugin — throws clear error if missing
  - DELETE and no-response endpoints return `HttpResponse(null, { status: 204 })`
  - Path params use MSW `:param` format

---

## [0.4.0]

### Added
- `valibot()` plugin — generates Valibot schemas
  - `v.picklist` for enums, `v.pipe` for string/number constraints
  - `v.intersect` for `allOf`, `v.variant` for `oneOf` with discriminator
  - `v.nullable`, `v.optional`, `v.isoTimestamp`, `v.email`, `v.uuid`, `v.url`
  - `enumStyle`: `union` | `enum` | `const`
  - `withTypes` — emit `v.InferOutput<>` type aliases
- `yup()` plugin — generates Yup schemas
  - `.concat()` for `allOf`, `.oneOf()` for enums and unions
  - `.required()` / `.optional()` inferred from OpenAPI `required` array
  - `.nullable()`, `.email()`, `.uuid()`, `.url()`, `.min()`, `.max()`, `.matches()`
  - `enumStyle`: `union` | `enum` | `const`
  - `withTypes` — emit `yup.InferType<>` type aliases

---

## [0.3.0]

### Added
- `zod()` plugin — generates Zod schemas
  - `z.enum` for enums, `z.discriminatedUnion` for `oneOf` with discriminator
  - `z.string().email()`, `.uuid()`, `.url()`, `.datetime()`
  - `z.string().min()` / `.max()` from `minLength` / `maxLength`
  - `allOf` → `.and()`, nullable → `.nullable()`, optional → `.optional()`
  - `schemaSuffix` option — customize schema variable name suffix (default `Schema`)
  - `withTypes` — emit `z.infer<>` type aliases alongside schemas
  - `infer`, `input`, `output` — fine-grained type emission control
  - `validateResponse` — generates `validateXxxResponse(data: unknown): Xxx` functions
  - `enumStyle`: `union` | `enum` | `const`

---

## [0.2.0]

### Added
- `tanstackQuery()` plugin — generates TanStack Query v5 hooks
  - `useQuery` with `queryOptions` helper for prefetch / router loaders
  - `useMutation` with typed variables and `ApigError` generics
  - `useInfiniteQuery` with `InfiniteData<T>` generics and `getNextPageParam`
  - `useSuspenseQuery` with `UseSuspenseQueryOptions` options
  - `queryKeysStyle`: `functions` | `object`
  - `hookGenerationStrategies` — per-operationId override (e.g. make a POST generate a query)
  - `options` parameter on all hooks for passthrough configuration

---

## [0.1.0]

### Added
- `typescript()` plugin — generates TypeScript types from OpenAPI schemas
  - `typeStyle`: `type` | `interface`
  - `enumStyle`: `union` | `enum` | `const`
  - Supports `allOf`, `oneOf`, `anyOf`, nullable, optional, array, enum
- `sdk()` plugin — generates typed request functions
  - HTTP clients: `fetch`, `axios`, `ky`, `ofetch`
  - `errorHandling` — built-in `ApigError` or custom error class
  - `rawResponse` — returns `{ body, status, headers }` instead of just data
  - `apiLogging` — adds `console.log` to each function
  - Multipart form data support
- `defineConfig()` helper with full TypeScript autocomplete
- Multiple configs in a single file (`export default [config1, config2]`)
- `fileNaming` / `functionNaming` — naming convention options
- `filter` — include/exclude operations by tag, include deprecated
- `rename` — rename `operationId` before generation
- `baseUrl` — prefix for all request paths
- `endpointsMap` — generates `endpoints.ts` with typed path constants
- `index` — controls `index.ts` re-export generation
- `hooks.afterAllFilesWrite` — shell command executed after generation
- `formatter`: `prettier` | `biome` | `oxfmt` | `none`
- `--dry-run` flag — shows what would be generated without writing files
- `--watch` flag — watches spec and config for changes
- `--config` / `-c` flag — custom config file path
- Config validation with clear error messages and doc links
- Swagger 2.0 → OpenAPI 3.0 auto-upgrade via `@scalar/openapi-upgrader`

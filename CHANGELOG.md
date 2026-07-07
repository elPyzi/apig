# Changelog

All notable changes to `@travjek/apig` will be documented in this file.

## [0.8.0] - 2025-07-07

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

## [0.7.0] - 2025-06-01

### Added
- `versioning` — snapshot-based versioning of generated IR
  - `enabled`, `storage`, `maxSaves`, `saveSpec` options
  - `pinVersions` — array of snapshot IDs protected from auto-deletion
  - `aliasTemplate` — template for snapshot names (`{generation}`, `{apiVersion}`, `{date}`)
- Warning when spec has no `info.version`
- Warning when `aliasTemplate` produces a duplicate alias

---

## [0.6.0] - 2025-05-01

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

## [0.5.0] - 2025-04-01

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

## [0.4.0] - 2025-03-01

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

## [0.3.0] - 2025-02-15

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

## [0.2.0] - 2025-02-01

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

## [0.1.0] - 2025-01-15

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

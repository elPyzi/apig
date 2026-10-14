# Changelog

All notable changes to `@travjek/apig` will be documented in this file.

## [0.12.1]

### Fixed
- An `operationId` that is a JavaScript reserved word generated `export const delete = …`, which does not parse. Reserved words are now escaped with a leading underscore (`_delete`, `_new`), and every plugin that declares or calls a request function — `requests()`, `tanstackQuery()`, `swr()`, `mcp()`, `playwright()` — derives the name through one helper so the declaration and its callers cannot drift apart
- Query parameter names that are not valid JavaScript identifiers were emitted as bare keys in the inline parameter type: `{ employee-search-form-selection: string }` is a syntax error, and it took `requests.ts` down along with every file importing from it. Such keys are now quoted, as header parameters already were
- A schema the spec leaves empty (`ErrorInfo: {}`) was silently skipped by `zod()` while still being referenced by the schemas that used it, and still listed in the generated `index.ts` — `Cannot find name 'ErrorInfoSchema'`. A declared schema now always gets a declaration, falling back to `z.unknown()`
- `zod()` sorted schemas by a dependency graph that disagreed with the code it emits: it counted only property-less schemas as references, while the generator emits a reference for any declared name. Schemas that carried properties were therefore left out of the graph and declared after their first use, landing in the temporal dead zone (`Block-scoped variable 'RolesSchema' used before its declaration`). Both now apply the same rule
- A schema declared as an alias of another (`Envelope: { allOf: [{ $ref: Payload }] }`, or a bare `$ref`) took the target's name instead of its own. That declared a second schema called `Payload` and dropped `Envelope` entirely, so `types.ts` held a duplicate identifier and a type alias that circularly referenced itself, while anything importing `Envelope` pointed at a name that was never emitted
- `zod()` emitted a reference to an unrelated schema whenever a property name matched a declared component. On a spec with a `status` component (an array filter) and a `tenant.status` property (`"PUBLIC" | "UNPUBLIC"`), `TenantSchema` validated `status` as an array of unrelated enum values — `parse` rejected the correct value and accepted a wrong one. Nothing caught it because `z.infer` faithfully derived the type from the wrong schema, so the file still compiled. The reference check now runs after the content-bearing branches, the way the typescript plugin has always ordered it
- A path parameter that is not a valid identifier (`{structure-type}`, `{2nd}`) was emitted verbatim as a positional argument, which does not parse, and its placeholder was left literal in the URL because the substitution pattern only matched `\w`. Such names are now renamed for the signature, the URL and the MSW handler path alike
- `zod()` generated recursive schemas that could not be type-checked: `z.lazy(() => XSchema)` gives TypeScript nothing to infer from, and `z.infer` off it is circular. Schemas that reach themselves now carry an explicit `z.ZodType<X>` annotation with the type spelled out, and every reference inside a cycle is lazy — two schemas pointing at each other could not both be declared first
- `valibot()` and `yup()` carried the same defects zod had just been fixed for, being parallel implementations of the same job: no declaration ordering at all, references emitted to schemas that were never declared, unquoted property keys, and no handling for recursion. The ordering, the reference rule and the cycle detection now live in one shared module the three plugins call, so they cannot drift apart again
- `yup()` generated `yup.mixed().oneOf([...])` for an enum, which infers as `AnyPresentValue` and matches no annotated type. The generic is now spelled out
- `faker()` referenced factories for schemas it never declared, skipped compositions entirely — a `$ref` wrapped in a single-member `allOf` fell through to a lorem word typed as the referenced object — and typed an array of enums as `string[]`
- `rhf()` built resolvers for schemas no form can use: non-object schemas, and recursive ones whose annotation the resolvers reject
- `swr({ framework: 'vue' })` never produced compiling code. It swapped the imports for `swrv` but the generated hooks still called `useSWR` and `useSWRMutation`, which swrv does not export. Queries now use `useSWRV` with its `IConfig` options and a mutable key, and mutations — swrv has no mutation hook — are generated as a plain async call followed by `mutate`
- A cache that could not be written took the whole run down with it: a read-only `.apig`, a full disk or a locked-down container failed on `EACCES: permission denied, mkdir` before a single file was generated. The cache is an optimization, so a failed write, a failed sweep and an unreadable directory now degrade to a warning and the run continues uncached
- `cache: true` failed outright on a spec that references a neighbouring file. The two paths reached the parser differently: without the cache apig hands it the input path, so a relative `$ref` resolves against the file's own directory; with the cache it handed over the fetched text, which carries no location, and the run died on `No content found`. A miss now parses through exactly the same call an uncached run makes, so enabling the cache cannot change the outcome — and the second loader, which existed only for this path, is gone
- `cache` handed back an empty document on a hit, and versioning takes both the API version and the saved spec from it — so every snapshot written off a warm cache was recorded as `api_vunknown` with a two-byte `spec.json`, and generation counting collapsed. The spec is now cached alongside the IR and returned with it
- `cache` asked for a `304` even when it had no IR to fall back on, then tried to parse the empty body of that response — a cleared `*.ir.json` or a partially restored CI cache surfaced as `Can't resolve external reference:` with nothing naming the cache. A half-present entry now counts as absent
- `cache` did not record which apig wrote an entry, so a warm cache survived an upgrade and kept serving an IR built by the previous release — hiding whatever that release fixed. Entries now carry the version that wrote them and are discarded on a mismatch
- Three commands printed nothing at all under the default log level: `apig versions` on an empty store, and the next-steps lines after `apig config`. Their output went through the same logger call as generation progress, which the minimal level silences — an answer to a command the user typed is not a progress line and now always prints
- `formatter` shelled out to `npx <tool>`, which downloads a missing formatter from the registry mid-generation — a surprising thing for a code generator to do, and a hang when offline. The call now passes `--no-install`, so a missing formatter fails instead and reaches the message that already existed telling you what to install
- `cliLogging` had two different defaults: the documented one and the constant both said `normal`, while the writer fell back to `minimal` — and nothing ever read the constant, so `minimal` is what every run has actually done. The three levels themselves work and differ. Behaviour is unchanged; the constant is now the single source the writer reads, and the documentation matches it
- `functionNaming` was honoured by the plugins but ignored by the generators that reference what those plugins declare, so anything but the default `camelCase` produced a file declaring `get_clients` and a barrel importing `getClients`. The naming now travels with the config to every site; the parameter that used to default silently to camelCase is required, which is what surfaced all twelve places it had been dropped
- `functionNaming` also accepted two conventions that cannot work: `kebab-case` is not an identifier at all, and `PascalCase` puts a function in the same namespace as the generated types — an operation `checkPassPermissions` and a `CheckPassPermissions` schema became one declaration. The option is now typed and validated down to `camelCase | snake_case`
- Snapshot directories were named with the display date, which separates hours from minutes with a colon — a character Windows forbids in a path, so `versioning` could not create a snapshot there at all. The directory now uses a dash; only the prefix before `" - "` is ever parsed back, so snapshots written by earlier versions still list and resolve
- Two `operationId`s that differ only in separators — `getUser`, `get_user`, `get-user` — normalize to one identifier, and the generator declared it two or three times. Under `groupBy` it was worse than a compile error: all of them resolved to the same directory, so the later operations silently overwrote the earlier ones and disappeared from the output. Colliding ids now get a numeric suffix, applied to the id itself so the function, the directory, the query key and the MCP tool all stay in agreement, with a warning naming the operation
- `tanstackQuery({ framework: 'solid' })` never produced compiling code. Solid's bindings type their options as an accessor rather than an object, so the hook has to be handed a thunk and the caller-facing type unwrapped from the function — and its overloads split on `initialData`, which the general options shape satisfies neither way
- A request body that the spec declares inline was typed `unknown`, which axios happened to accept and `ky`, `ofetch` and `wretch` all reject. The shape is now spelled out, and the schemas an inline body embeds are imported alongside it
- The `ky` adapter passed the typed params object to `searchParams`, which takes a flat record of scalars — a nested object or an array parameter did not fit. It now goes through the same `toQuery` helper as the fetch path, which also means `ky` honours `style`/`explode` instead of silently dropping them
- The `wretch` adapter passed an optional body straight to `.json()`, which takes an object — the same gap its `.query()` had
- A query parameter whose schema is an object or a `$ref` was typed `string` by every plugin that emits a signature. The type now resolves properly and the schemas it names are imported alongside the response and body types
- A `$ref` into a neighbouring file resolved to nothing, with or without the cache. The parser hands the entrypoint back exactly as it was read — apig resolves references itself, by the name the pointer ends in — so `./models/pets.json#/components/schemas/Pet` named a `Pet` that lived in a file nothing ever read: `types.ts` did not declare it and every file importing it failed to compile. External targets are now copied into the document's own `components.schemas` and the references retargeted at the copies, which covers a file referencing a third file, a `#/…` pointer inside an external file (which resolves against that file, not the entrypoint), a schema that reaches itself, and a name the entrypoint already uses. The same file reached under two spellings — `./shared.json` from a sibling, `./models/shared.json` from the root — is copied once
- Cache entries were written in place, so a run interrupted mid-write left a file holding a fragment of one and two concurrent runs could leave an IR that does not match the meta describing it — a complete, valid file generated from the wrong spec, with nothing to signal it. Each file is now written to a scratch name and renamed into place, which is atomic within a filesystem: a reader sees the previous entry whole or the new one whole. The meta is still written last, so an entry only becomes usable once its data is already there
- The fetch request functions returned `r.json() as Promise<T>` from an `async` function. Valid, but it tripped the "missing await" inspection in every generated function, and apig's own raw-response path already awaited. They now `return (await r.json()) as T`

### Added
- `cache.maxEntries` bounds how many entries are kept — one per spec — removing the oldest once the count goes over, the way `versioning.maxSaves` bounds snapshots. An entry with no timestamp goes first. Omitted means no limit
- `cache.ttl` gives a cached entry a lifetime, written as an amount and a unit — `30s`, `15m`, `12h`, `7d`. Passing the object turns the cache on by itself, so `cache: { ttl: "7d" }` needs no separate flag, and leaving `ttl` out keeps the old behaviour of entries that never age out. Expired entries are swept on the next run, including ones for specs nobody generates any more — until now nothing ever removed an entry
- `apig cache clear` drops every cached spec so the next run parses again, and `apig cache status` shows what is there. Two of the cache defects above surfaced as a partially present entry whose only cure was knowing to delete `.apig/` by hand

### Changed
- A matrix of thirty-one plugin and config combinations was run against a real 500-schema spec — every validation plugin, all four TanStack Query framework targets, all four HTTP clients compiled against a real instance of each, all four `groupBy` layouts, `rawResponse`, `errorHandling: false`, the Vue SWR target, and every `groupBy` layout crossed with the full plugin set and with a non-fetch client. `typeStyle` in both forms (`interface` emits 207 interfaces on a real spec, leaving only the enums and aliases an interface cannot express), `hooks.afterAllFilesWrite` (a successful command, a failing one, and one that does not exist), `formatter` (each of the four, with and without a config file present), `name` (including a multi-config run), `comment` on a snapshot, `cliLogging` at every level, `fileNaming` (all four conventions, each crossed with `groupBy`) and `filter` (by tag, by exclusion, by `deprecated`, and a filter matching nothing) were verified too. `cache` was exercised across both of its forms, every ttl unit, expiry, the sweep, and a ttl the validator has to reject. Snapshot versioning was exercised end to end as well — generation counting, `maxSaves` pruning, `pinVersions`, checkout by id and by alias, and checkout from a snapshot saved without its spec. Only the combination already in use compiled; the fixes above come from that run
- The MCP server needs a single `zod` install to type-check: two copies of the same version are still two nominally different sets of types, and the SDK's schemas will not match the generated ones
- The hostile spec (`examples/edge-cases`) now also covers a property name colliding with a component name, path parameters that are not identifiers, and self- and mutually recursive schemas. Verified against eleven real-world specs (6.7 MB, up to 2.3 MB each): every generated file compiles under `--strict`, matching orval on the same input
- The end-to-end suite gained a deliberately hostile spec (`examples/edge-cases`) built from shapes that are legal in OpenAPI and illegal in TypeScript. Every fix above is covered by generating from it and type-checking the result, plus an explicit check that no schema is used before it is declared

---

## [0.12.0]

### Breaking
- **`sdk()` is now `requests()`.** "SDK" described the shape of the output rather than what the plugin does, and it read as the umbrella for everything apig generates — the hooks, the schemas and the mocks are just as much an SDK as the request functions are. The plugin now says what it emits.

  There is no compatibility alias: `sdk` is no longer exported, so a stale config fails at the import rather than silently generating into a file nobody reads.

  **Migration**

  ```ts
  // apig.config.ts
  - import { defineConfig, typescript, sdk } from '@travjek/apig'
  + import { defineConfig, typescript, requests } from '@travjek/apig'

    export default defineConfig({
      plugins: [
        typescript(),
  -     sdk(),
  +     requests(),
      ],
    })
  ```

  What changes in the output:
  - The generated file is `requests.ts`, not `sdk.ts` — delete the stale `sdk.ts` if your output directory is not cleaned on generation. Under `groupBy` it is `<group>.requests.ts`.
  - Anything importing from `'./sdk'` in your own code moves to `'./requests'`. Generated cross-plugin imports (`tanstack`, `swr`, `mcp`, `playwright`) are updated automatically.
  - The exported function names inside the file are unchanged — only the file they live in is renamed.

  For custom plugins: `PluginContext.sdkImportPath` is now `requestsImportPath`, and the `SdkOptions` type is `RequestsOptions`.

### Fixed
- `tanstackQuery()` typed a query hook's error as a bare `ApigError` while its own `queryOptions` helper used `ApigError<XErrors>`. The helper is spread into the hook, so any operation with declared error responses produced a hook that did not compile. `useSuspense*Query` had the same mismatch and additionally ignored a custom `errorHandling` class, always emitting `ApigError`
- `swr()` generated mutation hooks whose `SWRMutationConfiguration` generics did not match the `useSWRMutation` call — an operation with no request body pins SWR's `Arg` to `never`, and the options argument stopped being assignable. The fetcher's unused `_key` parameter was also unannotated, an implicit `any` in any strict project
- The `wretch` adapter passed `params` straight into `.query()`, which takes `string | object`, so an operation with only optional query parameters did not compile
- `tanstackQuery()` and `swr()` together generate the same `use<Operation>Mutation` names, and the generated `index.ts` re-exported both — a barrel that never compiled. This is now a config error pointing at the collision
- `apig start` did not offer `playwright()` — the plugin shipped in 0.11.0 but was missing from the interactive wizard's plugin list, so the only way to add it was by hand

---

## [0.11.0]

### Added
- `playwright()` plugin — generates a typed Playwright API client (`createApiClient(ctx)`) and a `test.extend()` fixture from OpenAPI operations. The factory takes any `APIRequestContext`, so one client covers both standalone `request` tests and `page.request` calls that share the browser's session. It generates the client, not the tests — assertions stay yours
- `playwright()` options: `testName` and `fixtureName` for the generated exports, `baseUrl` to override the project's `baseURL`, and `withFaker` to re-export the `faker()` factories as `sample<Operation>()`
- `playwright({ authFixture })` — an extra fixture that logs in first, with a `cookie` strategy (the request context replays `Set-Cookie` on its own, so httpOnly tokens work) and a `bearer` strategy (token read from the login response, attached to a context of its own). The login payload is passed straight through as an inline expression or an import, so apig never touches credentials
- `@playwright/test` declared as an optional peer dependency

### Fixed
- `faker()` guessed a value's **type** from its field name, so the generated factories did not compile against the generated types. A field named `id` or `*Id` became `faker.number.int()` even when the spec declared it a `string` — on a spec with uuid ids, every factory holding one failed `tsc`. Name heuristics now apply only when they agree with the declared type, and a string id falls back to `faker.string.uuid()`
- `faker()` ignored the schema's `format`. `uuid`, `email`, `uri`, `date` and `date-time` fields now generate matching values instead of `faker.lorem.word()` — a `createdAt` with `format: date-time` was previously a random word
- `faker()` treated any field name *containing* `id` as an id, so `video` and `width` were generated as numbers. The match is now anchored to the end of the name (`id`, `ownerId`, `user_id`)

### Changed
- The end-to-end suite now type-checks **every** generated file, not just the four that import nothing. The peer libraries are dev dependencies for this reason alone — they are not new runtime dependencies and consumers install nothing extra. Coverage was extended to all four `groupBy` layouts and to every `httpClient`, each compiled against a real instance of the client it names. Every fix listed above was found by this change, not by hand
- `wretch` users must register the `queryString` addon on their client instance — the generated calls use `.query()`, which the addon provides. Documented in the `httpClient` config reference
- Documentation is now English-only — the eight machine-translated locales under `docs/` were dropped, since they drifted from the source with every release. Full docs live at https://apig-docs.vercel.app
- `README.md`, `README.npm.md` and `llms.txt` now list `mcp()`, the `framework` option on `tanstackQuery()`/`swr()`, and the new plugin — all three had fallen behind the code

---

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

# zvyappy

**OpenAPI code generator for TypeScript with a plugin system.** Point it at an OpenAPI spec and it writes the typed code your app needs to talk to that API — types, request functions, validation schemas, data-fetching hooks, form resolvers, mock data, mock handlers, end-to-end test clients and an MCP server — from one config file and one command.

```bash
npm install -D zvyappy
npx zvyappy generate   # or the short alias: npx zvy generate
```

- **One spec, many outputs.** Each output is a plugin; enable only what you use.
- **Compiles under `--strict`.** Generated code is type-checked against real-world specs, including the awkward ones — non-identifier names, dotted schema names, recursive schemas, `default` responses, bodiless responses.
- **Five HTTP clients.** `fetch` (no dependency), `axios`, `ky`, `ofetch` or `wretch` — using your own configured instance.
- **Typed errors.** Every request throws a typed `ZvyappyError` whose body is a union of the error responses the spec declares.
- **Works with your stack.** TanStack Query (React, Vue, Svelte, Solid), SWR (React, Vue), Zod, Valibot, Yup, React Hook Form, Faker, MSW, Playwright, MCP.
- **Migrates from orval, kubb and Hey API** with `zvyappy migrate`.

Full documentation: **https://apig-docs.vercel.app**

---

## Contents

- [Quick start](#quick-start)
- [What gets generated](#what-gets-generated)
- [Using the generated code](#using-the-generated-code)
- [Configuration](#configuration)
- [Plugins](#plugins)
- [CLI](#cli)
- [Migrating from orval, kubb or Hey API](#migrating-from-orval-kubb-or-hey-api)
- [Renamed from `@travjek/apig`](#renamed-from-travjekapig)
- [Supported OpenAPI features](#supported-openapi-features)
- [Rules and plugin compatibility](#rules-and-plugin-compatibility)
- [Writing a custom plugin](#writing-a-custom-plugin)
- [For AI assistants](#for-ai-assistants)

---

## Quick start

**1. Install** zvyappy as a dev dependency, plus the runtime library of each plugin you use (see [Plugins](#plugins)):

```bash
npm install -D zvyappy
npm install @tanstack/react-query zod   # only if you use tanstackQuery() and zod()
```

**2. Create `zvyappy.config.ts`** in the project root — by hand, with `npx zvyappy start` (interactive wizard), or with `npx zvyappy config --preset react`:

```ts
// zvyappy.config.ts
import { defineConfig, typescript, requests, tanstackQuery } from 'zvyappy';

export default defineConfig({
  input: './openapi.json', // file path (JSON or YAML) or URL
  output: './src/api',
  plugins: [typescript(), requests(), tanstackQuery()],
});
```

**3. Generate:**

```bash
npx zvyappy generate          # once
npx zvyappy generate --watch  # regenerate when the spec or config changes
```

**4. Use it:**

```tsx
import { useListPetsQuery, useCreatePetMutation } from './api';

function Pets() {
  const { data, error } = useListPetsQuery({ status: 'available' });
  const createPet = useCreatePetMutation();

  if (error) return <p>Failed with HTTP {error.status}</p>;
  return (
    <>
      <ul>{data?.items.map((pet) => <li key={pet.id}>{pet.name}</li>)}</ul>
      <button onClick={() => createPet.mutate({ body: { name: 'Rex', status: 'available' } })}>
        Add
      </button>
    </>
  );
}
```

---

## What gets generated

Each plugin writes one file into `output` (default `.zvyappy/generated`). The output directory is cleaned before every run unless `output.clean` is `false` — don't put hand-written code in it.

| File | Written by | Contents |
|------|-----------|----------|
| `types.ts` | `typescript()` | A `type` (or `interface`) per schema, plus enums |
| `requests.ts` | `requests()` | One async function per operation, plus `<Op>Errors` unions |
| `config.ts` | `requests()` / `playwright()` | Shared runtime helpers: `ZvyappyError`, `parseErrorBody`, `toQuery`, `ZvyappyResponse` |
| `zod.ts` / `valibot.ts` / `yup.ts` | validation plugins | A schema per component (`PetSchema`) and, by default, the types |
| `tanstack.ts` | `tanstackQuery()` | Query keys, `queryOptions`, query/mutation hooks |
| `query-keys.ts` | `tanstackQuery({ queryKeysStyle: 'object' })` | One shared `queryKeys` object |
| `swr.ts` (+ `swr-keys.ts`) | `swr()` | SWR hooks and keys |
| `rhf.ts` | `rhf()` | One resolver per schema |
| `faker.ts` | `faker()` | One `generate<Schema>()` factory per schema |
| `msw.ts` | `msw()` | `handlers` array for Mock Service Worker |
| `playwright.ts` | `playwright()` | `createApiClient(ctx)`, `ApiClient` type and a `test.extend()` fixture |
| `mcp.ts` | `mcp()` | A runnable MCP stdio server, one tool per operation |
| `endpoints.ts` | `endpointsMap: true` | `ENDPOINTS` map of operation → path, `EndpointKey` type |
| `index.ts` | always (unless `index: false`) | Named re-exports of everything above |

**Where the types live.** A validation plugin (`zod()`, `valibot()`, `yup()`) emits the TypeScript types itself by default (`withTypes: true`), and `types.ts` is then **not** written — `requests.ts` and the hooks import types from `zod.ts` instead. To keep a separate `types.ts`, pass `withTypes: false` to the validation plugin.

**Grouping.** With `groupBy`, operation-level files (`requests`, `tanstack`, `swr`, `playwright`) are split per group, while schema-level files (`types`, `zod`, `faker`, `msw`, `mcp`, …) stay at the root:

```
groupBy: 'tags'          src/api/pets/pets.requests.ts, src/api/pets/pets.tanstack.ts
groupBy: 'endpoints'     src/api/pets/get-pet/get-pet.requests.ts
groupBy: 'operations'    src/api/get-pet/get-pet.requests.ts
```

`index.ts` re-exports from every group, so `import { getPet } from './api'` works the same in every layout.

---

## Using the generated code

### Request functions

For this spec operation:

```yaml
/pets/{id}:
  get:
    operationId: getPet
    responses:
      '200': { content: { application/json: { schema: { $ref: '#/components/schemas/Pet' } } } }
      '404': { content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
```

`requests()` generates (default `fetch` client):

```ts
export type GetPetErrors =
  | { status: 404; body: Error };

export const getPet = async (id: string): Promise<Pet> => {
  const r = await fetch(`/pets/${id}`);
  if (!r.ok) throw new ZvyappyError(r.status, await parseErrorBody(r));
  return (await r.json()) as Pet;
};
```

Argument order is always: **path parameters** (one argument each, in path order) → **`params`** (an object of query parameters) → **`body`** → **`headers`** (an object of header parameters). Optional groups become optional arguments.

```ts
await listPets({ limit: 20, status: 'available' }); // GET /pets?limit=20&status=available
await createPet({ name: 'Rex', status: 'available' }); // POST /pets with a JSON body
await updatePet('42', { name: 'Max' });               // PUT /pets/42
await deletePet('42');                                 // DELETE /pets/42 → Promise<void>
```

- A success response with no JSON body (`204`, or `200` without content) is typed `void` and its body is never parsed.
- Query arrays and objects follow the spec's `style`/`explode` (`?id=1&id=2`, `?id=1,2`, `?id=1|2`, `?filter[a]=1`).
- `multipart/form-data` bodies become one argument per form field, sent as `FormData`.
- Paths are relative unless you set `baseUrl` — or configure the base URL on your own client instance.

### Errors

With `errorHandling: true` (the default) a non-2xx response throws `ZvyappyError`. The class is generated into **your** output directory (`./api/config.ts`), not imported from zvyappy:

```ts
import { getPet } from './api';
import type { GetPetErrors } from './api/requests'; // error unions are not re-exported from index.ts
import { ZvyappyError } from './api/config';

try {
  await getPet('42');
} catch (e) {
  if (e instanceof ZvyappyError) {
    const err = e as ZvyappyError<GetPetErrors>;
    console.log(err.status, err.body); // body is the parsed JSON (or text) of the error response
  }
}
```

`zvyappy/client` ships two runtime guards that work without importing the generated class — handy across package boundaries:

```ts
import { isZvyappyError, isZvyappyStatus } from 'zvyappy/client';

if (isZvyappyStatus(e, 404)) showNotFound();
else if (isZvyappyError(e)) report(e.status, e.body);
```

Use your own error class with `errorHandling: { path: './src/lib/errors', export: 'ApiError' }` — its constructor receives `(status, body)`. `errorHandling: false` returns whatever the client returns, with no status check.

A `default` response, or a range such as `4XX`, appears in the error union as `{ status: number; body: … }`.

### Raw responses

`rawResponse: true` returns the status and headers alongside the body:

```ts
const { body, status, headers } = await getPet('42'); // ZvyappyResponse<Pet>
```

### Using your own HTTP client

```ts
// src/lib/http.ts
import axios from 'axios';
export const api = axios.create({ baseURL: 'https://api.example.com', withCredentials: true });
```

```ts
// zvyappy.config.ts
defineConfig({
  httpClient: { name: 'axios', path: './src/lib/http', export: 'api' }, // path is relative to the project root
  // ...
});
```

```ts
// generated
import { api } from '../lib/http';

export const getPet = async (id: string): Promise<Pet> => {
  try {
    const r = await api.get<Pet>(`/pets/${id}`);
    return r.data as Pet;
  } catch (e: unknown) {
    // axios errors are rethrown as ZvyappyError(status, body)
  }
};
```

| `httpClient.name` | Needs | Notes |
|-------------------|-------|-------|
| `fetch` (default) | nothing | Uses global `fetch`; `path`/`export` not needed |
| `axios` | `axios` | `path` + `export` of an `AxiosInstance` |
| `ky` | `ky` | `path` + `export` of a `ky` instance |
| `ofetch` | `ofetch` | `path` + `export` of an `ofetch` instance |
| `wretch` | `wretch` | `path` + `export`; register `wretch/addons/queryString` on the instance |

Interceptors, auth headers, retries and base URLs belong on that instance — zvyappy never overrides them.

---

## Configuration

`zvyappy.config.ts` default-exports `defineConfig(...)` with a config object, or an array of them to generate several APIs in one run. Another file can be used with `zvyappy generate -c <path>` (`.ts` or `.js`).

```ts
import { defineConfig, typescript, requests, zod, tanstackQuery } from 'zvyappy';

export default defineConfig({
  name: 'petstore',
  input: 'https://api.example.com/openapi.json',
  auth: { username: process.env.SWAGGER_USER, password: process.env.SWAGGER_PASSWORD },
  output: { path: './src/api', clean: true },
  httpClient: { name: 'axios', path: './src/lib/http', export: 'api' },
  groupBy: 'tags',
  fileNaming: 'kebab-case',
  enumStyle: 'const',
  typeStyle: 'type',
  filter: { tags: ['pets', 'store'], deprecated: false },
  rename: { getPetById: 'fetchPet' },
  formatter: 'prettier',
  cache: { ttl: '12h' },
  plugins: [typescript(), requests(), zod({ withTypes: false }), tanstackQuery()],
});
```

```ts
// several specs in one run
export default defineConfig([
  { name: 'billing', input: './billing.yaml', output: './src/api/billing', plugins: [typescript(), requests()] },
  { name: 'users', input: './users.yaml', output: './src/api/users', plugins: [typescript(), requests()] },
]);
```

### All options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `input` | `string \| () => Promise<string>` | — (required) | Spec file path (JSON/YAML), URL, or a function returning a path, URL or the spec text |
| `output` | `string \| { path, clean? }` | `'.zvyappy/generated'` | Output directory. `clean` (default `true`) empties it before writing |
| `plugins` | `ZvyappyPlugin[]` | `[]` | What to generate — see [Plugins](#plugins) |
| `name` | `string` | — | Label shown in CLI output when several configs run |
| `auth` | `{ username, password }` | — | HTTP Basic Auth for a spec behind a login. Sent only to the spec's own origin |
| `httpClient` | `{ name, path?, export? }` | `{ name: 'fetch' }` | Client used by `requests()` — see [above](#using-your-own-http-client) |
| `baseUrl` | `string` | — | Prefix for every request path, e.g. `'https://api.example.com'` or `'/api/v1'` |
| `errorHandling` | `boolean \| { path, export }` | `true` | Throw `ZvyappyError` on non-2xx; a custom class; or off |
| `rawResponse` | `boolean` | `false` | Return `{ body, status, headers }` instead of the body |
| `apiLogging` | `boolean` | `false` | `console.log(name, result)` in every request function |
| `groupBy` | `'none' \| 'tags' \| 'endpoints' \| 'operations'` | `'none'` | How operation files are split into directories |
| `fileNaming` | `'kebab-case' \| 'camelCase' \| 'snake_case' \| 'PascalCase'` | `'kebab-case'` | Naming of generated files and directories |
| `functionNaming` | `'camelCase' \| 'snake_case'` | `'camelCase'` | Naming of generated functions |
| `enumStyle` | `'const' \| 'union' \| 'enum'` | `'const'` | `const X = {…} as const`, `type X = 'a' \| 'b'`, or `enum X {…}` |
| `typeStyle` | `'type' \| 'interface'` | `'type'` | `export type X = {…}` or `export interface X {…}` |
| `filter` | `{ tags?, exclude?, deprecated? }` | — | Include only these tags / drop these tags / include deprecated operations (`false` by default once a filter is set) |
| `rename` | `Record<string, string>` | — | Rename `operationId`s before generation |
| `index` | `boolean` | `true` | Write `index.ts` |
| `endpointsMap` | `boolean` | `false` | Write `endpoints.ts` |
| `formatter` | `'prettier' \| 'biome' \| 'oxfmt' \| 'none'` | `'none'` | Format output with an installed formatter (never downloaded) |
| `hooks` | `{ afterAllFilesWrite?: string }` | — | Shell command run after files are written |
| `cache` | `boolean \| { ttl?, maxEntries? }` | `false` | Cache the parsed spec — see [Cache](#cache) |
| `versioning` | `object` | — | Snapshots of each generation — see [Versioning](#versioning) |
| `comment` | `string` | — | Note attached to this run's snapshot |
| `cliLogging` | `{ level: 'minimal' \| 'normal' \| 'detailed' }` | `{ level: 'minimal' }` | CLI verbosity |

Invalid configs fail fast with a list of every problem and a link to the relevant docs.

### Specs behind a login

For a spec protected by HTTP Basic Auth (for example `express-basic-auth`), read the credentials from the environment:

```ts
defineConfig({
  input: 'https://api.example.com/docs-json',
  auth: {
    username: process.env.SWAGGER_USER,
    password: process.env.SWAGGER_PASSWORD,
  },
});
```

The `Authorization` header is sent only to the spec's own origin — never to another host an external `$ref` points at. A missing variable is reported when the config is validated, and a `401`/`403` fails with a message pointing at `auth`. For any other scheme (bearer tokens, cookies), pass `input` a function that fetches the spec and returns its text.

### Cache

`cache: true` stores the parsed spec in `.zvyappy/cache/` and skips parsing on the next run if the spec has not changed (ETag for URLs, a content hash for files). Generation itself always runs.

```ts
cache: true                            // entries never expire
cache: { ttl: '7d', maxEntries: 20 }   // ttl units: s, m, h, d
```

```bash
zvyappy cache status   # what is cached
zvyappy cache clear    # drop everything
```

Entries are discarded automatically when zvyappy is upgraded. Add `.zvyappy/` to `.gitignore`.

### Versioning

Saves a snapshot of each generation so you can diff or roll back:

```ts
versioning: {
  enabled: true,
  storage: '.zvyappy/versions',               // default
  maxSaves: 10,                            // oldest removed first
  pinVersions: ['<snapshot-id>'],          // never pruned
  saveSpec: true,                          // keep the spec in the snapshot
  aliasTemplate: 'v{apiVersion}-gen{generation}', // vars: {generation} {apiVersion} {date}
},
```

```bash
zvyappy versions                    # list snapshots
zvyappy version show <id|alias>     # details
zvyappy version checkout <id|alias> # regenerate from a snapshot
```

---

## Plugins

Import every plugin from `zvyappy`. Each is a function returning a plugin object; pass options where listed.

| Plugin | Generates | Install | Requires |
|--------|-----------|---------|----------|
| `typescript()` | Types | — | — |
| `requests()` | Request functions | your HTTP client (none for fetch) | — |
| `zod(opts?)` | Zod schemas | `zod` | — |
| `valibot(opts?)` | Valibot schemas | `valibot` | — |
| `yup(opts?)` | Yup schemas | `yup` | — |
| `tanstackQuery(opts?)` | TanStack Query v5 hooks | `@tanstack/<framework>-query` | `requests()` |
| `swr(opts?)` | SWR hooks | `swr` (React) / `swrv` (Vue) | `requests()` |
| `rhf(opts)` | React Hook Form resolvers | `react-hook-form`, `@hookform/resolvers` | a validation plugin |
| `faker(opts?)` | Mock data factories | `@faker-js/faker` | — |
| `msw()` | Mock Service Worker handlers | `msw` | `faker()` |
| `playwright(opts?)` | Playwright API client + fixture | `@playwright/test` ≥ 1.30 | — |
| `mcp(opts?)` | MCP server | `@modelcontextprotocol/sdk`, `zod` | `requests()`, `zod()` |

`typescript()`, `requests()` and `msw()` take no options — client, enum and type styles are top-level config options.

### `typescript()`

```ts
// enumStyle: 'const' (default)
export const PetStatus = { Available: 'available', Pending: 'pending', Sold: 'sold' } as const;
export type PetStatus = typeof PetStatus[keyof typeof PetStatus];

export type Pet = {
  id: string;
  name: string;
  status: PetStatus;
  'created-at'?: string; // names that are not identifiers are quoted
};
```

An inline enum is named `<Schema><Property>` (`PetStatus`); if the spec already declares a schema with that name, it becomes `PetStatusEnum`.

### `requests()`

Request functions — see [Using the generated code](#using-the-generated-code). Behaviour is set with the top-level `httpClient`, `baseUrl`, `errorHandling`, `rawResponse` and `apiLogging` options.

### `zod()`

```ts
zod({
  withTypes: true,          // emit types here; set false to keep types.ts
  infer: true,              // export type Pet = z.infer<typeof PetSchema>
  input: false,             // export type PetInput = z.input<typeof PetSchema>
  output: false,            // export type PetOutput = z.output<typeof PetSchema>
  validateResponse: false,  // export validatePetResponse(data: unknown): Pet
  schemaSuffix: 'Schema',
});
```

```ts
export const PetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  status: z.enum(['available', 'pending', 'sold']),
  age: z.number().min(0).optional(),
  createdAt: z.string().datetime(),
});
export type Pet = z.infer<typeof PetSchema>;
```

Maps formats (`uuid`, `email`, `uri`, `date-time`, …), `minLength`/`maxLength`, `minimum`/`maximum`, `minItems`/`maxItems`, `nullable`, `allOf` (`.and()`), `oneOf`/`anyOf` (discriminated when the spec has a `discriminator`). Recursive schemas use `z.lazy` with an explicit `z.ZodType<T>` annotation. `validateResponse` adds standalone helpers — request functions do not call them for you.

### `valibot()` and `yup()`

```ts
valibot({ withTypes: true, schemaSuffix: 'Schema' });
yup({ withTypes: true, schemaSuffix: 'Schema' });
```

Same coverage as `zod()`. Valibot uses `v.pipe` for constraints, `v.picklist` for enums, `v.intersect` for `allOf`, `v.variant` for discriminated `oneOf`; types via `v.InferOutput`. Yup uses `yup.mixed<…>().oneOf()` for enums; types via `yup.InferType`. Only one validation plugin may emit types — set `withTypes: false` on the others.

### `tanstackQuery()`

```ts
tanstackQuery({
  framework: 'react',            // 'react' | 'vue' | 'svelte' | 'solid'
  query: true,                   // query hooks for GET/QUERY operations
  mutation: true,                // mutation hooks for the rest
  infinite: false,               // useInfinity<Op>Query
  suspense: false,               // useSuspense<Op>Query
  queryKeysStyle: 'functions',   // 'functions' | 'object' (shared query-keys.ts)
  hookGenerationStrategies: {
    searchPets: { query: true, mutation: false }, // a POST used as a search
  },
});
```

For `operationId: listPets` / `createPet`:

```ts
export const listPetsQueryKey = (params?: ListPetsParams) => ['listPets', ...[params]] as const;
export const listPetsQueryOptions = (params?) => queryOptions<PetList, ZvyappyError>({ queryKey: listPetsQueryKey(params), queryFn: () => listPets(params) });
export const useListPetsQuery = (params?, options?) => useQuery({ ...listPetsQueryOptions(params), ...options });
export const useCreatePetMutation = (options?) => useMutation<Pet, ZvyappyError, { body: CreatePetInput }>({ mutationFn: (vars) => createPet(vars.body), ...options });
```

- Mutation variables are an object: `mutate({ id, body })` — path parameters by name, plus `params`, `body`, `headers` as needed.
- The error type is `ZvyappyError<GetPetErrors>` when the operation declares error responses.
- Svelte and Solid use the `create` prefix: `createListPetsQuery`, `createCreatePetMutation`.
- Infinite hooks are generated with a placeholder `getNextPageParam: () => undefined` — pass your own in `options`.

```ts
// invalidate after a mutation
const qc = useQueryClient();
useCreatePetMutation({ onSuccess: () => qc.invalidateQueries({ queryKey: listPetsQueryKey() }) });
```

### `swr()`

```ts
swr({
  framework: 'react',            // 'react' (swr) | 'vue' (swrv)
  queryKeysStyle: 'functions',   // 'functions' | 'object'
  hookGenerationStrategies: {},
});
```

```ts
export const listPetsSwrKey = (params?) => ['listPets', ...[params]] as const;
export const useListPets = (params?, options?) => useSWR<PetList, ZvyappyError>(listPetsSwrKey(params), () => listPets(params), options);
export const useCreatePetMutation = (options?) => useSWRMutation('createPet', (_key, { arg }) => createPet(arg), options);
```

Query hooks keep the bare name (`useListPets`); mutation hooks get a `Mutation` suffix. Cannot be combined with `tanstackQuery()` unless `index: false` — both name mutation hooks the same way.

### `rhf()`

```ts
rhf({
  resolver: 'zod',              // required: 'zod' | 'valibot' | 'yup' — that plugin must be enabled
  schemaSuffix: 'Schema',       // must match the validation plugin
  schemasImportPath: './zod',   // default './<resolver>'
});
```

One resolver per schema:

```ts
export const createPetInputResolver = zodResolver(CreatePetInputSchema);

// usage
const form = useForm<CreatePetInput>({ resolver: createPetInputResolver });
```

### `faker()`

```ts
faker({ locale: 'en' }); // 'en' | 'ru'
```

```ts
export const generatePet = (): Pet => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  status: faker.helpers.arrayElement(['available', 'pending', 'sold']),
  createdAt: faker.date.past().toISOString(),
});

const pet = generatePet();
const pets = faker.helpers.multiple(generatePet, { count: 10 });
```

The declared `format` wins first (`uuid`, `email`, `uri`, `date-time`, `date`, `ipv4`, …), then field-name hints for strings and numbers (`username`, `email`, `password`, `phone`, `url`/`photo`, `firstName`, `lastName`, `name`, `date`, `status`, `id`), then a value of the declared type. Recursive schemas stop after two levels (arrays become `[]`, optional fields are left out).

### `msw()`

```ts
export const handlers = [
  http.get('/pets', () => HttpResponse.json(generatePetList())),
  http.post('/pets', async ({ request }) => { await request.json(); return HttpResponse.json(generatePet()); }),
  http.delete('/pets/:id', () => new HttpResponse(null, { status: 204 })),
];
```

```ts
// browser
import { setupWorker } from 'msw/browser';
import { handlers } from './api';
await setupWorker(...handlers).start();

// node / tests
import { setupServer } from 'msw/node';
const server = setupServer(...handlers);
```

### `playwright()`

Generates a typed API **client and fixture** for Playwright — not test bodies.

```ts
playwright({
  testName: 'zvyappyPlaywrightTest',  // exported test
  fixtureName: 'api',              // what a test destructures
  baseUrl: undefined,              // default: baseURL from playwright.config.ts
  withFaker: false,                // re-export faker factories as sample<Operation>() (needs faker())
  authFixture: {                   // optional logged-in fixture
    login: 'loginUser',            // operationId of the login endpoint
    strategy: 'cookie',            // 'cookie' | 'bearer'
    payload: '{ email: process.env.E2E_USER, password: process.env.E2E_PASS }', // or { import, from }
    tokenPath: 'token',            // bearer: property of the login response
    header: 'Authorization',       // bearer: header to send
    fixtureName: 'authedApi',
  },
});
```

```ts
import { expect } from '@playwright/test';
import { zvyappyPlaywrightTest as test } from './api/playwright';

test('creates a pet', async ({ api }) => {
  const pet = await api.createPet({ name: 'Rex', status: 'available' });
  expect((await api.getPet(pet.id)).name).toBe('Rex');
});
```

`createApiClient(ctx)` takes any `APIRequestContext` — the `request` fixture, or `page.request` to share the browser's cookies. With `rawResponse: true` methods return Playwright's `APIResponse`. Under `groupBy`, exports are prefixed per group (`createPetsApiClient`, `petsZvyappyPlaywrightTest`).

### `mcp()`

Generates a runnable [Model Context Protocol](https://modelcontextprotocol.io) server that exposes each operation as a tool, so an AI assistant can call your API. Inputs are validated with the generated Zod schemas.

```ts
mcp({ name: 'petstore', version: '1.0.0' });
```

```json
// .mcp.json
{ "mcpServers": { "petstore": { "command": "npx", "args": ["tsx", "src/api/mcp.ts"] } } }
```

Multipart operations are skipped. `apiLogging` is not allowed with `mcp()` — stdout carries the protocol.

---

## CLI

The package installs two equivalent binaries: `zvyappy` and the short alias `zvy` (`zvy generate`, `zvy g`, …).

| Command | Alias | Description |
|---------|-------|-------------|
| `zvyappy generate` | `g` | Generate code. `-c, --config <path>` (default `zvyappy.config.ts`), `-d, --dry-run`, `-w, --watch` |
| `zvyappy start` | `s` | Interactive setup wizard — writes `zvyappy.config.ts` |
| `zvyappy config` | `c` | Scaffold `zvyappy.config.ts`. `-p, --preset <name>`, `--list-presets` |
| `zvyappy migrate <orval\|kubb\|hey-api>` | `m` | Convert another generator's config. `-t, --target <path>`, `-c, --clean` |
| `zvyappy info` | `i` | Spec statistics without generating. `-c, --config <path>` |
| `zvyappy versions` | | List snapshots. `-c, --config`, `-s, --storage <path>` |
| `zvyappy version show <id>` | | Snapshot details |
| `zvyappy version checkout <id>` | | Regenerate from a snapshot. `--dry-run` |
| `zvyappy cache status` | | Show the cache |
| `zvyappy cache clear` | | Empty the cache |

Presets for `zvyappy config --preset`: `minimal` (types + requests), `react` (+ TanStack Query + Zod), `react-swr` (+ SWR + Zod), `testing` (react + Faker + MSW), `forms` (+ Zod + React Hook Form), `full` (everything).

---

## Migrating from orval, kubb or Hey API

```bash
npx zvyappy migrate orval     # reads orval.config.{ts,js,mjs,...}
npx zvyappy migrate kubb      # reads kubb.config.*
npx zvyappy migrate hey-api   # reads openapi-ts.config.*
npx zvyappy migrate orval --target ./config/orval.config.ts --clean
```

Writes `zvyappy.config.ts` from the existing config — input, output, plugins, grouping, tag filters, formatter, enum style and HTTP client. Anything without a zvyappy equivalent (a mutator, an SDK class, an unknown plugin, an API-registry input, auth sent as a raw header) becomes a `// TODO(migrate): …` comment in the new config and is listed in the terminal; nothing is dropped silently. Several projects writing to one directory are moved into subdirectories. It refuses to overwrite an existing `zvyappy.config.ts`.

---

## Renamed from `@travjek/apig`

Since 0.14.0 the package is `zvyappy` (it was `@travjek/apig` up to 0.13.0). The generator itself is unchanged — only names changed, and there is no fallback to the old ones:

| Before (≤ 0.13.0) | Since 0.14.0 |
|---|---|
| `npm install -D @travjek/apig` | `npm install -D zvyappy` |
| `apig generate` (and every other command) | `zvyappy generate`, or the short alias `zvy generate` |
| `apig.config.ts` | `zvyappy.config.ts` |
| `import { defineConfig } from '@travjek/apig'` | `import { defineConfig } from 'zvyappy'` |
| `ApigConfig`, `ApigPlugin` types | `ZvyappyConfig`, `ZvyappyPlugin` |
| `import { isApigError, isApigStatus } from '@travjek/apig/client'` | `import { isZvyappyError, isZvyappyStatus } from 'zvyappy/client'` |
| generated `ApigError`, `ApigResponse` | generated `ZvyappyError`, `ZvyappyResponse` |
| generated `apigPlaywrightTest` fixture | `zvyappyPlaywrightTest` |
| `.apig/` (cache, version snapshots, default output `.apig/generated`) | `.zvyappy/` |

To migrate:

```bash
npm uninstall @travjek/apig && npm install -D zvyappy
mv apig.config.ts zvyappy.config.ts   # then change the import to 'zvyappy'
rm -rf .apig                           # old cache; move .apig/versions to .zvyappy/versions to keep snapshots
npx zvyappy generate
```

Then rename `ApigError` / `isApigError` / `isApigStatus` / `apigPlaywrightTest` in your own code. Files generated by `@travjek/apig` are still recognised and removed by `output.clean`.

---

## Supported OpenAPI features

- **Versions:** OpenAPI 3.0 and 3.1; Swagger 2.0 is upgraded automatically; the OpenAPI 3.2 `QUERY` method (treated as a read — query hooks, cacheable).
- **Sources:** JSON or YAML; local file, URL, or a function. External `$ref`s to neighbouring files or URLs are resolved.
- **Schemas:** objects, arrays, tuples (`prefixItems`), enums, `nullable` / `type: [..., 'null']`, `allOf`, `oneOf`/`anyOf` with or without `discriminator`, `additionalProperties`, recursive and mutually recursive schemas.
- **Constraints:** string formats, `minLength`/`maxLength`, `minimum`/`maximum`, `minItems`/`maxItems`.
- **Parameters:** path, query (with `style`/`explode`), header; `content`-style parameters.
- **Bodies:** `application/json`, `multipart/form-data`, binary uploads.
- **Responses:** `200`/`201` success types, typed error unions from `4xx`/`5xx`, `default` and range keys (`4XX`), bodiless responses (`204`).
- **Names:** any spec name is made safe — `created-at` keys are quoted, `v1.Pet` becomes `V1Pet`, reserved words and colliding `operationId`s are renamed.

---

## Rules and plugin compatibility

Checked when the config loads:

- `msw()` needs `faker()`; `mcp()` needs `requests()` and `zod()`; `rhf()` needs `zod()`, `valibot()` or `yup()`.
- Only one of `zod()` / `valibot()` / `yup()` may emit types — set `withTypes: false` on the others.
- `tanstackQuery()` and `swr()` together require `index: false`.
- `apiLogging` cannot be used with `mcp()`.
- A plugin may be listed only once.

---

## Writing a custom plugin

A plugin is an object implementing `ZvyappyPlugin`. It receives the parsed spec (IR) and returns code plus the names to re-export from `index.ts`:

```ts
import { defineConfig, typescript, type ZvyappyPlugin } from 'zvyappy';

const routesList = (): ZvyappyPlugin => ({
  name: 'routes-list',
  fileName: 'routes',              // → routes.ts
  scope: 'root',                   // 'root' once for the whole spec; 'operations' once per group
  generate: (ir) => ({
    code: `export const ROUTES = ${JSON.stringify(ir.operations.map((op) => `${op.method} ${op.path}`))} as const;\n`,
    exports: ['ROUTES'],
    typeExports: [],
  }),
});

export default defineConfig({ input: './openapi.json', plugins: [typescript(), routesList()] });
```

---

## For AI assistants

- [`llms.txt`](https://github.com/elPyzi/zvyappy/blob/main/llms.txt) — a complete, plain-text reference of the config, plugins, generated names and CLI.
- A Claude Code plugin with a zvyappy skill ships in the package (`skills/zvyappy`).

## Documentation

Full reference for every plugin, CLI command and config option: **https://apig-docs.vercel.app**

## License

MIT

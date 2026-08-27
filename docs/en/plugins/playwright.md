# playwright()

Generates a typed [Playwright](https://playwright.dev) API client from OpenAPI operations, plus a test fixture built with `test.extend()`.

It generates the client, not the tests. Assertions and test flow stay yours — the plugin removes the hand-written URLs, request shapes and response types.

Requires `@playwright/test >= 1.30.0` as a peer dependency.

## Usage

```ts
import { defineConfig, typescript, playwright } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), playwright()],
})
```

```ts
// pets.spec.ts
import { expect } from '@playwright/test'
import { apigPlaywrightTest as test } from './api/playwright'

test('creates and reads a pet', async ({ api }) => {
  const created = await api.createPet({ name: 'Rex', status: 'available' })
  const pet = await api.getPet(created.id)

  expect(pet.name).toBe('Rex')
})
```

## Output example

```ts
import { test as base } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { PetList, Pet, CreatePetInput } from './types';
import { ApigError } from './config';

/**
 * Typed client bound to a Playwright request context.
 *
 * Pass the `request` fixture for standalone API tests, or `page.request` to
 * share cookies and storage state with the browser.
 */
export const createApiClient = (ctx: APIRequestContext) => ({
  listPets: async (params?: { limit?: number }): Promise<PetList> => {
    const r = await ctx.get(`/pets`, { params: toParams(params) });
    if (!r.ok()) throw new ApigError(r.status(), await parseApiError(r));
    return r.json() as Promise<PetList>;
  },
  createPet: async (body: CreatePetInput): Promise<Pet> => {
    const r = await ctx.post(`/pets`, { data: body });
    if (!r.ok()) throw new ApigError(r.status(), await parseApiError(r));
    return r.json() as Promise<Pet>;
  },
});

export type ApiClient = ReturnType<typeof createApiClient>;

export const apigPlaywrightTest = base.extend<{ api: ApiClient }>({
  api: async ({ request }, use) => {
    await use(createApiClient(request));
  },
});
```

## Two request contexts, one client

`createApiClient` takes any `APIRequestContext`, so the same client covers both of Playwright's ways of calling an API:

```ts
// standalone API test — no browser involved
test('list pets', async ({ api }) => {
  await api.listPets()
})

// inside a UI test — shares cookies and auth session with the page
test('checkout', async ({ page }) => {
  const api = createApiClient(page.request)
  await api.createPet({ name: 'Rex', status: 'available' })

  await page.goto('/pets')
})
```

## Extending the fixture

The generated `test` composes like any other Playwright fixture. Keep your own fixtures in a separate file so regeneration never touches them:

```ts
// tests/fixtures.ts
import { apigPlaywrightTest, type ApiClient } from '../src/api/playwright'

export const test = apigPlaywrightTest.extend<{ seededPet: Pet }>({
  seededPet: async ({ api }, use) => {
    const pet = await api.createPet({ name: 'Rex', status: 'available' })
    await use(pet)
    await api.deletePet(pet.id)
  },
})
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `testName` | `string` | `"apigPlaywrightTest"` | Name of the exported `test` |
| `fixtureName` | `string` | `"api"` | Name of the fixture a test destructures |
| `baseUrl` | `string` | — | Base URL baked into every path. Overrides the top-level `baseUrl` |
| `withFaker` | `boolean` | `false` | Re-export Faker factories as `sample<Operation>()`. Requires `faker()` |
| `authFixture` | `object` | — | Emit an extra fixture that logs in first — see below |

```ts
playwright({ testName: 'apiTest', fixtureName: 'sdk', withFaker: true })
```

### baseUrl

Leave it unset to rely on `baseURL` from `playwright.config.ts` — the `request` fixture already carries it, and generated paths stay relative. Set it only when the client must target a fixed host regardless of the project config.

### withFaker

Aliases the `faker()` factory for each operation's request body, named after the operation:

```ts
import { apigPlaywrightTest as test, sampleCreatePet } from './api/playwright'

test('creates a pet', async ({ api }) => {
  await api.createPet(sampleCreatePet())
})
```

## authFixture

Adds a second fixture holding an already-authenticated client.

```ts
playwright({
  authFixture: {
    login: 'loginUser',
    strategy: 'cookie',
    payload: '{ user: process.env.API_USER, pass: process.env.API_PASS }',
  },
})
```

```ts
test('deleting a pet needs auth', async ({ authedApi }) => {
  await authedApi.deletePet('1')
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `login` | `string` | — | `operationId` of the login endpoint. **Required** |
| `strategy` | `"cookie" \| "bearer"` | `"cookie"` | How auth is carried into later calls |
| `payload` | `string \| { import, from }` | — | Body posted to the login operation. **Required** |
| `tokenPath` | `string` | `"token"` | Property of the login response holding the token. `bearer` only |
| `header` | `string` | `"Authorization"` | Header the token is sent in. `bearer` only |
| `fixtureName` | `string` | `"authedApi"` | Name of the generated fixture |

### Strategies

**`cookie`** — nothing is carried by hand. An `APIRequestContext` owns a cookie jar, so the `Set-Cookie` from the login call is replayed on every later request through the same context. This is what makes httpOnly cookies work: the test never has to read the token.

**`bearer`** — the token is read from the login response and attached as a header. Playwright fixes default headers when a context is created, so the authenticated client gets its own context (with `baseURL` threaded through, which a hand-made context does not inherit).

### Credentials

`payload` is passed straight through — apig never handles secrets and never reads your environment. Where the values come from is yours:

```ts
// inlined into the generated file as an expression
payload: '{ user: process.env.API_USER, pass: process.env.API_PASS }'

// imported from a file you own — for anything more involved
payload: { import: 'authPayload', from: '../auth.config' }
```

### With groupBy

The fixture is only emitted into the file that actually holds the login operation. With `groupBy: 'tags'` and a login under an `auth` tag, `auth.playwright.ts` gets both fixtures while the other groups get the plain client.

## groupBy

The plugin is operation-scoped, so [`groupBy`](../config.md) splits its output like the SDK's. Exports are prefixed per group so the generated barrel file stays free of duplicate names:

```
groupBy: 'tags'
  pets/pets.playwright.ts      → createPetsApiClient, PetsApiClient, petsApigPlaywrightTest
  owners/owners.playwright.ts  → createOwnersApiClient, OwnersApiClient, ownersApigPlaywrightTest
```

Ungrouped output keeps the plain `createApiClient` / `ApiClient` / `apigPlaywrightTest`.

## Responses and errors

By default a method returns the parsed, typed body and throws [`ApigError`](../client.md) on a non-2xx response:

```ts
const pet = await api.getPet('1')  // Pet
```

With `rawResponse: true` in the top-level config, methods hand back Playwright's `APIResponse` untouched and throw nothing — the test owns the status check:

```ts
const r = await api.getPet('1')    // APIResponse
expect(r.status()).toBe(200)
const pet = await r.json()
```

With `errorHandling: false`, the body is still parsed but a non-2xx response no longer throws.

## Request details

- **Query parameters** are serialized through `URLSearchParams`, so an array parameter repeats its key. `undefined` and `null` values are dropped.
- **Headers** are stringified — a numeric or enum header from the spec goes out as a string.
- **Multipart bodies** map to Playwright's `multipart` option. A binary field is typed `{ name, mimeType, buffer }`, the shape Playwright accepts in Node; optional fields left `undefined` are dropped.
- **Path parameters** are interpolated into the URL.

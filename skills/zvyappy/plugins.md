# Plugins

## typescript()

Generates TypeScript types from OpenAPI schemas. Takes **no options** — `typeStyle` and `enumStyle` are `defineConfig`-level options.

```ts
typescript()
```

Output (default `typeStyle: 'type'`, `enumStyle: 'const'` for this plugin):

```ts
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

export type User = {
  id: string
  email: string
  role?: Role
  createdAt: string
}
```

---

## requests()

Generates typed request functions. Takes **no options** — HTTP client and behavior (`rawResponse`, `apiLogging`, `errorHandling`) are configured in `defineConfig`.

```ts
requests()
```

```ts
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [requests()],
})
```

Output (default `fetch`, `errorHandling: true`):

```ts
export type GetUserErrors =
  | { status: 404; body: Error };

export const getUser = async (id: string): Promise<User> => {
  const r = await fetch(`/users/${id}`);
  if (!r.ok) throw new ZvyappyError(r.status, await parseErrorBody(r));
  return (await r.json()) as User;
};

export const listUsers = async (params?: { page?: number }): Promise<UserList> => {
  const r = await fetch(`/users${toQuery(params)}`);
  if (!r.ok) throw new ZvyappyError(r.status, await parseErrorBody(r));
  return (await r.json()) as UserList;
};

export const deleteUser = async (id: string): Promise<void> => { // 204: no body, not parsed
  const r = await fetch(`/users/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new ZvyappyError(r.status, await parseErrorBody(r));
};
```

Arguments: path params (one each) → `params` (query object) → `body` → `headers` (header object). `ZvyappyError`, `parseErrorBody` and `toQuery` live in the generated `config.ts`. `rawResponse: true` returns `ZvyappyResponse<T>` = `{ body, status, headers }`; `errorHandling: false` returns the client's result with no status check. `default` and `4XX`-style responses appear in `<Op>Errors` as `{ status: number; body: X }`.

---

## zod()

Generates Zod schemas with OpenAPI constraint mapping (email, uuid, min/max, discriminated unions).

```ts
zod({
  withTypes: true,        // default true — gate for infer/input/output exports
  infer: true,             // export type X = z.infer<typeof XSchema> (default true)
  input: false,             // export type XInput = z.input<typeof XSchema> (default false)
  output: false,            // export type XOutput = z.output<typeof XSchema> (default false)
  validateResponse: false, // generate standalone validateXResponse(data) helpers — request functions do NOT call them (default false)
  schemaSuffix: 'Schema',  // default 'Schema'
})
```

`enumStyle` (union/enum/const, default `'union'` for this plugin) is a `defineConfig` option, not passed here.

Output:

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
})
// with zod({ infer: true }):
export type User = z.infer<typeof UserSchema>
```

---

## valibot()

Generates Valibot schemas.

```ts
valibot({
  withTypes: true,       // default true
  schemaSuffix: 'Schema', // default 'Schema'
})
```

---

## yup()

Generates Yup schemas.

```ts
yup({
  withTypes: true,       // default true
  schemaSuffix: 'Schema', // default 'Schema'
})
```

---

## tanstackQuery()

Generates TanStack Query v5 hooks. Requires `requests()`.

```ts
tanstackQuery({
  query: true,               // useQuery hooks (default true)
  mutation: true,             // useMutation hooks (default true)
  infinite: true,              // useInfiniteQuery hooks (default false)
  suspense: true,               // useSuspenseQuery hooks (default false)
  queryKeysStyle: 'functions', // 'functions' | 'object' (default 'functions')
  hookGenerationStrategies: {
    searchUsers: { query: true, mutation: false }, // per-operation override, NOT a string
  },
})
```

Hook naming for `operationId: getUsers` / `operationId: createUser`:

```ts
export const getUsersQueryOptions = (params?) => queryOptions({ ... })
export const useGetUsersQuery = (params?, options?) => useQuery({ ...getUsersQueryOptions(params), ...options })
export const useInfinityGetUsersQuery = (...) => useInfiniteQuery({ ... })   // with infinite: true
export const useSuspenseGetUsersQuery = (...) => useSuspenseQuery({ ... })   // with suspense: true
export const useCreateUserMutation = (options?) => useMutation({ mutationFn: ..., ...options })
```

Query key function: `getUsersQueryKey(...)` (style `'functions'`) or `queryKeys.getUsers(...)` (style `'object'`).

- Mutation variables are an object: `useUpdateUserMutation().mutate({ id, body })` — named path params plus `params`/`body`/`headers`.
- `framework: 'svelte' | 'solid'` use the `create` prefix: `createGetUsersQuery`, `createCreateUserMutation`.
- `GET` and the OpenAPI 3.2 `QUERY` method get query hooks; every other method gets a mutation hook (override per operation with `hookGenerationStrategies`).
- Infinite hooks are generated with `getNextPageParam: () => undefined` — pass your own in `options`.
- The error type is `ZvyappyError<GetUserErrors>` when the operation declares error responses.

---

## swr()

Generates SWR hooks. Requires `requests()`.

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

Hook naming for `operationId: getUsers` / `operationId: createUser`:

```ts
export const useGetUsers = (params?, options?) => useSWR(getUsersSwrKey(params), () => getUsers(params), options)
export const useCreateUserMutation = (options?) => useSWRMutation('createUser', (_key, { arg }) => createUser(arg), options)
```

Note the query hook keeps the bare name (`useGetUsers`), but the mutation hook gets a `Mutation` suffix (`useCreateUserMutation`).

---

## rhf()

Generates React Hook Form resolvers — **one per schema**, not one per form/operation. Requires `zod()`, `valibot()`, or `yup()` with a matching `schemaSuffix`.

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — required
  schemaSuffix: 'Schema',        // must match the validation plugin's schemaSuffix
  schemasImportPath: './zod',    // default './<resolver>'
})
```

Output — for schemas `User` and `CreateUserInput`:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

---

## faker()

Generates Faker.js factories, one per schema. The only option is `locale`.

```ts
faker({ locale: 'en' }) // 'en' (default) | 'ru'
```

A declared `format` wins first (`uuid`, `email`, `uri`/`url`, `hostname`, `ipv4`, `ipv6`, `password`, `date-time`, `date`). Then field-name heuristics, for string and number fields only, limited to: `username`, `email`, `password`, `phone`, `url`/`photo`, `firstName`, `lastName`, `name`, `date`, `status`, `id`. Everything else falls back to a generic value by schema type (`faker.lorem.word()` for strings, `faker.number.int()` for numbers, `faker.datatype.boolean()` for booleans). There is no special-casing for `avatar`, `title`, `price`, `city`, etc. Arrays get 3 items; inline objects are built field by field; recursive schemas stop after two levels.

Output:

```ts
export const generateUser = (): User => ({
  id: faker.number.int(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
})
```

---

## msw()

Generates Mock Service Worker handlers. Requires `faker()` — the config fails validation without it. Takes **no options**.

```ts
msw()
```

Output:

```ts
import { http, HttpResponse } from 'msw';
import { generateUser } from './faker';

export const handlers = [
  http.get('/users', () => {
    return HttpResponse.json([generateUser()]);
  }),
  http.post('/users', async ({ request }) => {
    await request.json();
    return HttpResponse.json(generateUser());
  }),
  http.delete('/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

Use with `setupWorker(...handlers).start()` (browser, `msw/browser`) or `setupServer(...handlers)` (Node, `msw/node`). A `QUERY` operation uses `new HttpHandler('QUERY', path, …)`.

---

## playwright()

Generates a typed Playwright API client and a `test.extend()` fixture. Generates the **client, not the tests** — assertions stay with the user. Requires `@playwright/test >= 1.30.0`.

```ts
playwright({
  testName: 'zvyappyPlaywrightTest',  // exported test name
  fixtureName: 'api',              // what a test destructures
  baseUrl: undefined,              // defaults to baseURL from playwright.config.ts
  withFaker: false,                // needs faker() — adds sample<Operation>()
  authFixture: {
    login: 'loginUser',            // operationId of the login endpoint
    strategy: 'cookie',            // 'cookie' (default) | 'bearer'
    payload: '{ user: process.env.API_USER }',  // or { import, from }
  },
})
```

Output:

```ts
export const createApiClient = (ctx: APIRequestContext) => ({
  getUsers: async (params?: { page?: number }): Promise<UserList> => {
    const r = await ctx.get(`/users`, { params: toParams(params) });
    if (!r.ok()) throw new ZvyappyError(r.status(), await parseApiError(r));
    return r.json() as Promise<UserList>;
  },
});

export type ApiClient = ReturnType<typeof createApiClient>;

export const zvyappyPlaywrightTest = base.extend<{ api: ApiClient }>({
  api: async ({ request }, use) => {
    await use(createApiClient(request));
  },
});
```

Usage:

```ts
import { zvyappyPlaywrightTest as test } from './api/playwright'

test('lists users', async ({ api }) => {
  const users = await api.getUsers()
  expect(users.length).toBeGreaterThan(0)
})
```

The factory takes any `APIRequestContext` — pass `request` for standalone API tests, or `page.request` to reuse the browser's session. With `rawResponse: true` the methods return `APIResponse` untouched. Under `groupBy`, exports are prefixed per group (`createPetsApiClient`, `petsZvyappyPlaywrightTest`).

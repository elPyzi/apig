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

## sdk()

Generates typed request functions. Takes **no options** — HTTP client and behavior (`rawResponse`, `apiLogging`, `errorHandling`) are configured in `defineConfig`.

```ts
sdk()
```

```ts
defineConfig({
  httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' },
  plugins: [sdk()],
})
```

Output:

```ts
export const getUsers = (params?: { page?: number }) =>
  fetch(`/users?${new URLSearchParams(params)}`).then(r => r.json() as Promise<UserList>)

export const createUser = (body: CreateUserInput) =>
  fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json() as Promise<User>)
```

---

## zod()

Generates Zod schemas with OpenAPI constraint mapping (email, uuid, min/max, discriminated unions).

```ts
zod({
  withTypes: true,        // default true — gate for infer/input/output exports
  infer: true,             // export type X = z.infer<typeof XSchema> (default false)
  input: false,             // export type XInput = z.input<typeof XSchema> (default false)
  output: false,            // export type XOutput = z.output<typeof XSchema> (default false)
  validateResponse: false, // generate validateXResponse() (default false)
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

Generates TanStack Query v5 hooks. Requires `sdk()`.

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

---

## swr()

Generates SWR hooks. Requires `sdk()`.

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

Generates Faker.js factories, one per object/enum schema. Takes **no options**.

```ts
faker()
```

Field-name heuristics are limited to: `username`, `email`, `password`, `phone`, `url`/`photo`, `firstName`, `lastName`, `name`, `date`, `status`, `id`. Everything else falls back to a generic value by schema type (`faker.lorem.word()` for strings, `faker.number.int()` for numbers, `faker.datatype.boolean()` for booleans). There is no special-casing for `uuid`, `avatar`, `title`, `price`, `city`, etc.

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

Generates Mock Service Worker handlers. Requires `faker()` — throws if missing. Takes **no options**.

```ts
msw()
```

Output:

```ts
import { http, HttpResponse } from 'msw';
import { generateUser } from '@/plugins/faker'; // known quirk: hardcoded alias path, may need manual fixup

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

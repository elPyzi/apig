# swr()

Generates [SWR](https://swr.vercel.app) hooks from OpenAPI operations. Requires `sdk()` in the plugins array.

## Usage

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## Options

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**Type:** `'functions' | 'object'`  
**Default:** `'functions'`

- `functions` — the key function is exported directly in the hook's file: `getUsersSwrKey(...)`
- `object` — a shared `query-keys.ts` file with a `swrKeys` object, used as `swrKeys.getUsers(...)`

### `hookGenerationStrategies`

Overrides hook generation for specific operations by `operationId`:

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

By default: `GET` → `useSWR`, everything else → `useSWRMutation`.

## Generated hook names

For an operation with `operationId: getUsers`:

| Hook | Name |
|------|------|
| `useSWR` | `useGetUsers` |
| Key (`functions` style) | `getUsersSwrKey` |

For a mutation (`operationId: createUser`):

| Hook | Name |
|------|------|
| `useSWRMutation` | `useCreateUserMutation` |

## Output example

```ts
export const useGetUsers = (
  params?: { page?: number; limit?: number },
  options?: SWRConfiguration<UserList>,
) => {
  return useSWR<UserList, ApigError>(getUsersSwrKey(params), () => getUsers(params), options);
};
```

```ts
export const useCreateUserMutation = (
  options?: SWRMutationConfiguration<User, ApigError, any, CreateUserInput>,
) => {
  return useSWRMutation<User, ApigError, any, CreateUserInput>(
    'createUser',
    (_key, { arg }: { arg: CreateUserInput }) => createUser(arg),
    options,
  );
};
```

If a mutation has no request body (`body`), the mutation key stays the same — the SDK function call simply omits the `arg` argument.

# swr()

Generiert [SWR](https://swr.vercel.app)-Hooks aus OpenAPI-Operationen. Erfordert `sdk()` im Plugins-Array.

## Verwendung

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## Optionen

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**Typ:** `'functions' | 'object'`  
**Standard:** `'functions'`

- `functions` — die Key-Funktion wird direkt in der Hook-Datei exportiert: `getUsersSwrKey(...)`
- `object` — eine gemeinsame Datei `query-keys.ts` mit einem Objekt `swrKeys`, verwendet als `swrKeys.getUsers(...)`

### `hookGenerationStrategies`

Überschreibt die Hook-Generierung für bestimmte Operationen anhand von `operationId`:

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

Standardmäßig: `GET` → `useSWR`, alles andere → `useSWRMutation`.

## Benennung der generierten Hooks

Für eine Operation mit `operationId: getUsers`:

| Hook | Name |
|------|------|
| `useSWR` | `useGetUsers` |
| Key (Stil `functions`) | `getUsersSwrKey` |

Für eine Mutation (`operationId: createUser`):

| Hook | Name |
|------|------|
| `useSWRMutation` | `useCreateUserMutation` |

## Ausgabebeispiel

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

Hat eine Mutation keinen Anfragekörper (`body`), bleibt der Mutation-Key derselbe — es fehlt lediglich das Argument `arg` beim Aufruf der SDK-Funktion.

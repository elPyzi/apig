# swr()

Génère des hooks [SWR](https://swr.vercel.app) depuis les opérations OpenAPI. Nécessite `sdk()` dans le tableau de plugins.

## Utilisation

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

**Type :** `'functions' | 'object'`  
**Par défaut :** `'functions'`

- `functions` — la fonction de clé est exportée directement dans le fichier du hook : `getUsersSwrKey(...)`
- `object` — un fichier partagé `query-keys.ts` avec un objet `swrKeys`, utilisé comme `swrKeys.getUsers(...)`

### `hookGenerationStrategies`

Remplace la génération de hooks pour des opérations précises par `operationId` :

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

Par défaut : `GET` → `useSWR`, le reste → `useSWRMutation`.

## Nommage des hooks générés

Pour une opération avec `operationId: getUsers` :

| Hook | Nom |
|------|-----|
| `useSWR` | `useGetUsers` |
| Clé (style `functions`) | `getUsersSwrKey` |

Pour une mutation (`operationId: createUser`) :

| Hook | Nom |
|------|-----|
| `useSWRMutation` | `useCreateUserMutation` |

## Exemple de sortie

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

Si la mutation n'a pas de corps de requête (`body`), la clé de mutation reste la même — simplement sans l'argument `arg` dans l'appel à la fonction SDK.

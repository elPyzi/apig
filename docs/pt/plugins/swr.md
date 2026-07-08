# swr()

Gera hooks [SWR](https://swr.vercel.app) a partir de operações OpenAPI. Requer `sdk()` no array de plugins.

## Uso

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## Opções

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**Tipo:** `'functions' | 'object'`
**Padrão:** `'functions'`

- `functions` — a função de chave é exportada diretamente no arquivo do hook: `getUsersSwrKey(...)`
- `object` — um arquivo compartilhado `query-keys.ts` com um objeto `swrKeys`, usado como `swrKeys.getUsers(...)`

### `hookGenerationStrategies`

Sobrescreve a geração de hooks para operações específicas por `operationId`:

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

Por padrão: `GET` → `useSWR`, o restante → `useSWRMutation`.

## Nomenclatura dos hooks gerados

Para uma operação com `operationId: getUsers`:

| Hook | Nome |
|-----|-----|
| `useSWR` | `useGetUsers` |
| Chave (estilo `functions`) | `getUsersSwrKey` |

Para uma mutação (`operationId: createUser`):

| Hook | Nome |
|-----|-----|
| `useSWRMutation` | `useCreateUserMutation` |

## Exemplo de saída

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

Se a mutação não tiver corpo de requisição (`body`), a chave da mutação permanece a mesma — apenas sem o argumento `arg` na chamada da função SDK.

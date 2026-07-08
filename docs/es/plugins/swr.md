# swr()

Genera hooks [SWR](https://swr.vercel.app) a partir de las operaciones OpenAPI. Requiere `sdk()` en el array de plugins.

## Uso

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## Opciones

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**Tipo:** `'functions' | 'object'`  
**Por defecto:** `'functions'`

- `functions` — la función de la clave se exporta directamente en el archivo del hook: `getUsersSwrKey(...)`
- `object` — un archivo compartido `query-keys.ts` con un objeto `swrKeys`, usado como `swrKeys.getUsers(...)`

### `hookGenerationStrategies`

Sobrescribe la generación de hooks para operaciones concretas por `operationId`:

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

Por defecto: `GET` → `useSWR`, el resto → `useSWRMutation`.

## Nomenclatura de los hooks generados

Para una operación con `operationId: getUsers`:

| Hook | Nombre |
|-----|-----|
| `useSWR` | `useGetUsers` |
| Clave (estilo `functions`) | `getUsersSwrKey` |

Para una mutación (`operationId: createUser`):

| Hook | Nombre |
|-----|-----|
| `useSWRMutation` | `useCreateUserMutation` |

## Ejemplo de salida

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

Si la mutación no tiene cuerpo de solicitud (`body`), la clave de la mutación se mantiene igual — simplemente sin el argumento `arg` en la llamada a la función SDK.

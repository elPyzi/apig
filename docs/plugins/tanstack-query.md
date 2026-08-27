Wraps the functions from `sdk()` in TanStack Query hooks. GET becomes `useQuery`, everything else becomes `useMutation`.

## Usage

```ts

import { defineConfig, typescript, sdk, tanstackQuery } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk(), tanstackQuery()],
});

```

> Won't build without `sdk()` — the hooks have nothing to call inside them.

From `GET /pets` you get this in `tanstack.ts`:

```ts
export const listPetsQueryOptions = (params?: { limit?: number }) =>
queryOptions<PetList, ApigError>({
  queryKey: ["listPets", params],
  queryFn: () => listPets(params),
});

export const useListPetsQuery = (
params?: { limit?: number },
options?: Omit<UseQueryOptions<PetList, ApigError>, "queryKey" | "queryFn">,
) =>
useQuery<PetList, ApigError>({
  ...listPetsQueryOptions(params),
  ...options,
});
```

## Options

| Option                     | Default       | What it does                                                                                                                                                                                                                                |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`                    | `true`        | Generates `useQuery` for GET operations. Turn it off and GET requests stay in `sdk()` only, with no hooks.                                                                                                                                  |
| `mutation`                 | `true`        | Generates `useMutation` for POST, PUT, PATCH, DELETE.                                                                                                                                                                                       |
| `infinite`                 | `false`       | Adds `useInfiniteQuery` with the `useInfinity*` prefix — for paginated lists.                                                                                                                                                               |
| `suspense`                 | `false`       | Adds `useSuspenseQuery` with the `useSuspense*` prefix — for pages built on Suspense.                                                                                                                                                       |
| `queryKeysStyle`           | `"functions"` | `"functions"` — the key function sits next to the hook in the same file. `"object"` — all keys get collected into one shared `query-keys.ts` at the output root.                                                                            |
| `framework`                | `"react"`     | `"react"` and `"vue"` give you `use*` hooks, `"solid"` and `"svelte"` give you `create*`. The underlying package changes too — `@tanstack/react-query`, `@tanstack/vue-query`, and so on. You install it yourself, apig doesn't pull it in. |
| `hookGenerationStrategies` | —             | Overrides the set of hooks for a single operation by its `operationId` — independent of the global `query` / `mutation` / `infinite` / `suspense` settings.                                                                                 |

## Query keys: functions vs object

```ts
// queryKeysStyle: "functions" — the key lives in tanstack.ts next to the hook
export const listPetsQueryKey = (params?: { limit?: number }) =>
["listPets", params] as const;

// queryKeysStyle: "object" — a shared query-keys.ts file
export const queryKeys = {
listPets: (params?: { limit?: number }) => ["listPets", params] as const,
getPetById: (id: string) => ["getPetById", id] as const,
};
```

Cache invalidation works the same way in both cases — `queryClient.invalidateQueries({ queryKey: listPetsQueryKey() })`.

## hookGenerationStrategies: per-operation override

The plugin's four flags — `query`, `mutation`, `infinite`, `suspense` — set the behavior for every operation at once. `hookGenerationStrategies` lets you override them for one specific `operationId`, without touching the rest.

A typical case: a POST that's actually a search, and should behave like a GET.

```ts
tanstackQuery({
// globally — only query and mutation
query: true,
mutation: true,
infinite: false,
suspense: false,

hookGenerationStrategies: {
  // searchPets — POST, but really a search: we want useQuery, not useMutation
  searchPets: { query: true, mutation: false },

  // listPets — a paginated list: add useInfiniteQuery just for it
  listPets: { infinite: true },

  // getPetById — opened on a page that uses Suspense
  getPetById: { suspense: true },
},
})
```

For `searchPets`, `tanstack.ts` gets a query hook instead of a mutation:

```ts
export const searchPetsQueryOptions = (body: SearchPetsBody) =>
queryOptions<PetList, ApigError>({
  queryKey: ["searchPets", body],
  queryFn: () => searchPets(body),
});

export const useSearchPetsQuery = (
body: SearchPetsBody,
options?: Omit<UseQueryOptions<PetList, ApigError>, "queryKey" | "queryFn">,
) =>
useQuery<PetList, ApigError>({
  ...searchPetsQueryOptions(body),
  ...options,
});

// mutation: false for this operation — useMutation isn't generated
```

Any flag missing from the override just inherits the plugin's global value — you don't have to override everything at once.

## Solid and Svelte

```ts
tanstackQuery({ framework: "solid" })
```

The hook and its type swap the whole prefix:

```ts
export const createListPetsQuery = (
params?: { limit?: number },
options?: Omit<CreateQueryOptions<PetList, ApigError>, "queryKey" | "queryFn">,
) =>
createQuery<PetList, ApigError>({
  ...listPetsQueryOptions(params),
  ...options,
});
```

## Works well with

> Requires `sdk()` — takes its ready-made request functions and just wraps them. Types for parameters and responses come from whichever of `typescript()`, `zod()`, `valibot()`, or `yup()` is enabled.

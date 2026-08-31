Wraps the functions from `sdk()` in SWR hooks. GET becomes `useSWR`, everything else becomes `useSWRMutation`.

## Usage

```ts

import { defineConfig, typescript, sdk, swr } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk(), swr()],
});

```

> Won't build without `sdk()` — the hooks have nothing to call inside them. apig doesn't install the `swr` package, add it yourself.

From `GET /pets` you get this in `swr.ts`:

```ts
export const useListPets = (
params?: { limit?: number },
options?: SWRConfiguration<PetList>,
) => {
return useSWR<PetList, ApigError>(
  ["listPets", params],
  () => listPets(params),
  options,
);
};
```

For mutations — `POST /pets`:

```ts
export const useCreatePetMutation = (
options?: SWRMutationConfiguration<Pet, ApigError>,
) => {
return useSWRMutation<Pet, ApigError, any, CreatePetBody>(
  "createPet",
  (_key, { arg }) => createPet(arg),
  options,
);
};
```

## Options

| Option                     | Default       | What it does                                                                                                                                                           |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queryKeysStyle`           | `"functions"` | `"functions"` — the key is built inline, right inside the hook in `swr.ts`. `"object"` — all keys get pulled into a shared `swr-keys.ts` at the output root.           |
| `framework`                | `"react"`     | `"react"` — hooks built on the `swr` package, `"vue"` — built on `swrv`. Which one you install is up to you — apig only generates the import for whichever you choose. |
| `hookGenerationStrategies` | —             | Override for a single operation by its `operationId`: turn on `query` or `mutation` for just that one, without touching the rest.                                      |

## Query keys: functions vs object

```ts
// queryKeysStyle: "functions" — the key is built right inside the hook
export const useListPets = (params?: { limit?: number }) => {
return useSWR<PetList, ApigError>(
  ["listPets", params],
  () => listPets(params),
);
};

// queryKeysStyle: "object" — a shared swr-keys.ts file
export const swrKeys = {
listPets: (params?: { limit?: number }) => ["listPets", params] as const,
getPetById: (id: string) => ["getPetById", id] as const,
};
```

Revalidation works the same way in both cases — `mutate(["listPets", params])`.

## hookGenerationStrategies: per-operation override

SWR has only two flags per operation — `query` and `mutation` — no `infinite` or `suspense` like TanStack Query has. The typical case is the same: a POST that's really a search.

```ts
swr({
hookGenerationStrategies: {
  // searchPets — POST, but really a search: we want useSWR, not useSWRMutation
  searchPets: { query: true, mutation: false },
},
})
```

The result in `swr.ts` — a query hook instead of a mutation:

```ts
export const useSearchPets = (
body: SearchPetsBody,
options?: SWRConfiguration<PetList>,
) => {
return useSWR<PetList, ApigError>(
  ["searchPets", body],
  () => searchPets(body),
  options,
);
};
```

Any flag missing from the override inherits what the operation would have gotten by default — GET gets `query`, every other method gets `mutation`.

## SWR vs TanStack Query

If you need `useInfiniteQuery`, `useSuspenseQuery`, or Solid/Svelte support, stick with `tanstackQuery()`. SWR is simpler and lighter, but it doesn't have those.

## Works well with

> Requires `sdk()` — takes its ready-made request functions and just wraps them. Types for parameters and responses come from whichever of `typescript()`, `zod()`, `valibot()`, or `yup()` is enabled.

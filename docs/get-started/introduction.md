apig

A TypeScript code generator for OpenAPI specs. apig turns your API description into types, an SDK, validation schemas, query hooks, MSW handlers, and other ready-to-use artifacts.

**npm**

```bash
npx apig generate
```

**yarn**

```bash
yarn dlx apig generate
```

**pnpm**

```bash
pnpm dlx apig generate
```

**bun**

```bash
bunx apig generate
```

## How apig works

apig doesn't turn OpenAPI directly into TypeScript code.

Between the spec and the generators sits an **IR (Intermediate Representation)** — a single unified representation of the API.

**OpenAPI** → **Parser** → **IR** → **Plugins** → **TypeScript**

The IR is the boundary between the parser and the plugin system.

At the IR stage you can run extra transformations:

- filter operations;
- rename operations;
- reshape data;
- attach your own metadata;
- prepare the API for a specific generator.

### Custom plugins

A plugin you write yourself doesn't need to know anything about OpenAPI.

It receives the IR and is only responsible for turning that representation into whatever output it needs:

```text
IR → Plugin → generated code
```

That's why a custom generator can target any TypeScript tool or your project's own internal standard.

More on this: [Custom Plugins](../guides/custom-plugins.md).

## Plugins

| Plugin            | File          | What it generates                         |
| ----------------- | ------------- | ----------------------------------------- |
| `typescript()`    | `types.ts`    | TypeScript types from your spec's schemas |
| `sdk()`           | `sdk.ts`      | Typed API request functions               |
| `zod()`           | `zod.ts`      | Zod schemas                               |
| `valibot()`       | `valibot.ts`  | Valibot schemas                           |
| `yup()`           | `yup.ts`      | Yup schemas                               |
| `tanstackQuery()` | `tanstack.ts` | TanStack Query hooks and utilities        |
| `swr()`           | `swr.ts`      | SWR hooks                                 |
| `rhf()`           | `rhf.ts`      | React Hook Form integration               |
| `faker()`         | `faker.ts`    | Test data factories                       |
| `msw()`           | `msw.ts`      | MSW request handlers                      |
| `mcp()`           | `mcp.ts`      | MCP server on top of the SDK              |

## Example

```http
GET /pets
```

Parameters:

```text
limit
status
```

apig config:

```tsx
import {
defineConfig,
typescript,
sdk,
zod,
tanstackQuery,
} from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
baseUrl: "https://api.example.com",

  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery(),
  ],

});
```

After generation, the SDK might contain a function like this:

```tsx
export const listPets = async (params?: {
limit?: number;
status?: "available" | "pending" | "sold";
}): Promise<PetList> => {
const r = await fetch(
  `https://api.example.com/pets${toQuery(params)}`,
);

  if (!r.ok) {
    throw new ApigError(r.status, await parseErrorBody(r));
  }

  return r.json() as Promise<PetList>;

};
```

And `tanstackQuery()` can build a query hook on top of it:

```tsx
export const useListPetsQuery = (
params?: {
  limit?: number;
  status?: "available" | "pending" | "sold";
},
options?: Omit<
  UseQueryOptions<PetList, ApigError>,
  "queryKey" | "queryFn"
>,
) =>
useQuery<PetList, ApigError>({
  ...listPetsQueryOptions(params),
  ...options,
});
```

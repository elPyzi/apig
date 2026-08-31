Generates Zod schemas from OpenAPI schemas. You can validate with them by hand, or let `zod()` check API responses on the fly — right inside the SDK functions.

## Usage

```ts

import { defineConfig, typescript, sdk, zod } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk(), zod()],
});

```

## Options

| Option             | Default    | What it does                                                                                                                                                                         |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `withTypes`        | `true`     | Exports a TypeScript type next to each schema. Turn it off if `typescript()` already gives you types — otherwise you'll get duplicates.                                              |
| `infer`            | `false`    | The type is derived via `z.infer<typeof Schema>` instead of being written out separately. Solves the duplicate problem on its own — you don't need `typescript()` at all.            |
| `input`            | `false`    | Exports `z.input<typeof Schema>` — the type before transforms. Only needed if your schemas use `.transform()`.                                                                       |
| `output`           | `false`    | Same idea, but after transforms — `z.output<typeof Schema>`.                                                                                                                         |
| `validateResponse` | `false`    | Every SDK function parses the response through `.parse()` before returning it. If the backend lied about a field's type, you find out right away — not three components up the tree. |
| `schemaSuffix`     | `"Schema"` | Suffix in the variable name: `PetSchema`, `UserSchema`. Change it here and change it the same way in `rhf()` too, if you have it enabled — otherwise the imports won't line up.      |

## Example

```ts
zod({
withTypes: true,
validateResponse: true,
})
```

From an OpenAPI schema like this:

```json
{
"Pet": {
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "age": { "type": "number", "nullable": true }
  },
  "required": ["id", "name"]
}
}
```

you get:

```ts
export const PetSchema = z.object({
id: z.string(),
name: z.string(),
age: z.number().nullable().optional(),
});

export type Pet = z.infer<typeof PetSchema>;
```

And with `validateResponse: true`, the SDK function gets a parse step:

```ts
export const getPet = async (id: string): Promise<Pet> => {
const r = await fetch(`${baseUrl}/pets/${id}`);
if (!r.ok) throw new ApigError(r.status, await parseErrorBody(r));
return PetSchema.parse(await r.json());
};
```

## Works well with

> `mcp()` requires `zod()` — the MCP server needs schemas to validate tool input parameters. `rhf()` with the `"zod"` resolver also pulls its schemas from here.

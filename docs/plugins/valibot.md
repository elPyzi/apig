Generates Valibot schemas from OpenAPI schemas. Same idea as `zod()`, but lighter — Valibot bundles are many times smaller thanks to tree-shaking.

## Usage

```ts

import { defineConfig, typescript, sdk, valibot } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk(), valibot()],
});

```

## Options

| Option         | Default    | What it does                                                                                                                                       |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `withTypes`    | `true`     | Exports a type next to the schema via `v.InferOutput`. Set to `false` if `typescript()` already gives you types.                                   |
| `schemaSuffix` | `"Schema"` | Suffix in the variable name: `PetSchema`. Matches what `rhf()` expects with the `"valibot"` resolver — if you change it here, change it there too. |

The plugin doesn't have more options than that — Valibot doesn't support an async `.parse()` inside the SDK as conveniently as Zod does, so `validateResponse` never made it in here.

## Example

```ts
valibot({ withTypes: true })
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
import * as v from "valibot";

export const PetSchema = v.object({
id: v.string(),
name: v.string(),
age: v.optional(v.nullable(v.number())),
});

export type Pet = v.InferOutput<typeof PetSchema>;
```

## Works well with

> `rhf()` with the `"valibot"` resolver pulls its schemas from here and wires up `@hookform/resolvers/valibot` under the hood.

Generates Yup schemas from OpenAPI schemas. If your project already runs on Yup — say, old forms built with React Hook Form — you won't have to move to Zod.

## Usage

```ts

import { defineConfig, typescript, sdk, yup } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk(), yup()],
});

```

## Options

| Option         | Default    | What it does                                                                                                                                                                    |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `withTypes`    | `true`     | Exports a type next to the schema via `yup.InferType`. Turn it off if types already come from `typescript()` — otherwise you'll end up with two identical types sharing a name. |
| `schemaSuffix` | `"Schema"` | Suffix in the variable name: `PetSchema`. Keep it in sync with `rhf()` if its resolver is set to `"yup"`.                                                                       |

## Example

```ts
yup({ withTypes: true })
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
import * as yup from "yup";

export const PetSchema = yup.object({
id: yup.string().required(),
name: yup.string().required(),
age: yup.number().nullable().notRequired(),
});

export type Pet = yup.InferType<typeof PetSchema>;
```

## Works well with

> `rhf()` with the `"yup"` resolver pulls its schemas from here and wires up `@hookform/resolvers/yup` under the hood.

Builds ready-to-use React Hook Form resolvers from the validation schemas you've already generated. The plugin doesn't create schemas itself — it takes them from whichever of `zod()`, `valibot()`, or `yup()` is enabled.

## Usage

```ts

import { defineConfig, typescript, sdk, zod, rhf } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [
  typescript(),
  sdk(),
  zod(),
  rhf({ resolver: "zod" }),
],
});

```

> **resolver is required**
>
> The plugin won't build without it. And the plugin list must include `zod()`, `valibot()`, or `yup()` — whichever one matches `resolver`.

For every schema from the spec you get a ready-made resolver in `rhf.ts`:

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import { PetSchema, UserSchema } from './zod';

export const petResolver = zodResolver(PetSchema);
export const userResolver = zodResolver(UserSchema);
```

And in a form it's just a normal RHF resolver — no difference at all that it was generated:

```tsx
const form = useForm<Pet>({
resolver: petResolver,
});
```

## Options

| Option              | Default          | What it does                                                                                                                                                                                                                                         |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolver`          | required         | `"zod"`, `"valibot"`, or `"yup"` — which validation library to wrap. Determines both the resolver package (`@hookform/resolvers/zod`, and so on) and where the plugin pulls its schemas from.                                                        |
| `schemaSuffix`      | `"Schema"`       | Suffix of the schema name the plugin looks for in the validation file — `PetSchema`, `UserSchema`. Has to match `schemaSuffix` in `zod()` / `valibot()` / `yup()` itself — change it there, change it here too, or the import won't find the schema. |
| `schemasImportPath` | `"./{resolver}"` | Where to look for schemas instead of the default file — `./zod`, `./valibot`, or `./yup`. Needed if the schema file isn't where apig expects it — for example, with a custom output structure.                                                       |

## Example with Yup and a custom path

```ts
rhf({
resolver: "yup",
schemaSuffix: "ValidationSchema",
schemasImportPath: "../validation/yup",
})
```

```ts
import { yupResolver } from '@hookform/resolvers/yup';
import { PetValidationSchema } from '../validation/yup';

export const petResolver = yupResolver(PetValidationSchema);
```

## Works well with

> Requires exactly one of `zod()`, `valibot()`, `yup()` — the same one set in `resolver`. apig doesn't install `react-hook-form` or `@hookform/resolvers` itself — add them to the project by hand.

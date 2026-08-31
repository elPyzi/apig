Generates TypeScript types from OpenAPI schemas. `typescript()` takes no options. Generation style is controlled by the global `defineConfig` options.

## Usage

```ts

import { defineConfig, typescript } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript()],
});

```

## Config options that affect typescript()

These options are set at the top level in `defineConfig`, not inside the plugin itself:

| Option                                         | Values                                                             | Generation result                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `typeStyle` Controls how objects are generated | `type` (default)                                                   | ```ts
export type User = { id: string; email: string };
```                                                                   |
| `interface`                                    | ```ts
export interface User {
  id: string;
  email: string;
}
``` |                                                                                                                               |
| `enumStyle` Controls how enums are generated   | `const` (default)                                                  | ```ts
export const Role = { Admin: "admin", User: "user" } as const;
export type Role = (typeof Role)[keyof typeof Role];
``` |
| `union`                                        | ```ts
export type Role = "admin" | "user";
```                     |                                                                                                                               |
| `enum`                                         | ```ts
export enum Role {
  Admin = "admin",
  User = "user",
}
``` |                                                                                                                               |

Full reference for `defineConfig` options. The only thing you actually need is `input` — everything else has a default.

## Minimal config

```tsx
import { defineConfig, typescript, sdk } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
});
```

## Full example

```tsx
import {
defineConfig,
typescript,
sdk,
zod,
tanstackQuery,
faker,
msw,
} from "@travjek/apig";

export default defineConfig({
name: "petstore",
input: "./openapi.json",
output: { path: "./src/api", clean: true },
baseUrl: "https://api.example.com",

  httpClient: {
    name: "axios",
    path: "./lib/axios",
    export: "axiosInstance",
  },

  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery({ framework: "react" }),
    faker({ locale: "en" }),
    msw(),
  ],

  groupBy: "tags",
  fileNaming: "kebab-case",
  functionNaming: "camelCase",
  enumStyle: "const",
  typeStyle: "type",
  formatter: "prettier",
  index: true,
  endpointsMap: false,
  cache: true,
  apiLogging: false,
  rawResponse: false,
  errorHandling: true,

  filter: {
    tags: ["pet", "store"],
    deprecated: false,
  },

  rename: {
    getPetById: "fetchPet",
    addPet: "createPet",
  },

  hooks: {
    afterAllFilesWrite: "prettier --write ./src/api",
  },

  versioning: {
    enabled: true,
    maxSaves: 10,
  },

  cliLogging: { level: "normal" },

});
```

## Core options

| Option    | Type                              | Default           | Description                                                                     |
| --------- | --------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `name`    | `string`                          | —                 | Label for the generation task. Shown in the CLI when there are multiple configs |
| `input`   | `string \| () => Promise<string>` | required          | Path to a file, a URL, or an async function. OpenAPI 3.1, 3.0, Swagger 2.0      |
| `output`  | `string \| { path, clean? }`      | `.apig/generated` | Output directory. `clean: true` removes only the generated files                |
| `baseUrl` | `string`                          | —                 | Prefix applied to every request path                                            |
| `plugins` | `ApigPlugin[]`                    | `[]`              | List of enabled plugins                                                         |

## HTTP client

| Client   | `path` and `export` | Description                       |
| -------- | ------------------- | --------------------------------- |
| `fetch`  | optional            | Built-in `fetch`. Used by default |
| `axios`  | required            | An Axios instance                 |
| `ky`     | required            | A Ky instance                     |
| `ofetch` | required            | An ofetch instance                |
| `wretch` | required            | A Wretch instance                 |

```tsx
httpClient: {
name: "axios",
path: "./lib/axios",
export: "axiosInstance",
}
```

`path` — path to the file that exports the client instance. `export` — the named export's name.

### HTTP client examples

#### fetch

Used by default. Doesn't need `path` or `export`.

```tsx
httpClient: {
name: "fetch",
}
```

With a custom instance:

```tsx
httpClient: {
name: "fetch",
path: "./lib/fetch",
export: "customFetch",
}
```

```tsx
// lib/fetch.ts
export const customFetch: typeof fetch = (input, init) =>
fetch(input, {
  ...init,
  headers: {
    ...init?.headers,
    Authorization: `Bearer ${getToken()}`,
  },
});
```

#### axios

```tsx
httpClient: {
name: "axios",
path: "./lib/axios",
export: "api",
}
```

```tsx
// lib/axios.ts
import axios from "axios";

export const api = axios.create({
baseURL: "https://api.example.com",
timeout: 10_000,
headers: { "X-Custom": "value" },
});

api.interceptors.request.use((config) => {
config.headers.Authorization = `Bearer ${getToken()}`;
return config;
});
```

#### ky

```tsx
httpClient: {
name: "ky",
path: "./lib/ky",
export: "api",
}
```

```tsx
// lib/ky.ts
import ky from "ky";

export const api = ky.create({
prefixUrl: "https://api.example.com",
timeout: 10_000,
hooks: {
  beforeRequest: [
    (request) => {
      request.headers.set("Authorization", `Bearer ${getToken()}`);
    },
  ],
},
});
```

#### ofetch

```tsx
httpClient: {
name: "ofetch",
path: "./lib/ofetch",
export: "api",
}
```

```tsx
// lib/ofetch.ts
import { ofetch } from "ofetch";

export const api = ofetch.create({
baseURL: "https://api.example.com",
onRequest({ options }) {
  options.headers.set("Authorization", `Bearer ${getToken()}`);
},
});
```

#### wretch

```tsx
httpClient: {
name: "wretch",
path: "./lib/wretch",
export: "api",
}
```

```tsx
// lib/wretch.ts
import wretch from "wretch";

export const api = wretch("https://api.example.com")
.auth(`Bearer ${getToken()}`)
.options({ credentials: "include" });
```

## Code style

| Option           | Values                                                | Default      | Description                           |
| ---------------- | ----------------------------------------------------- | ------------ | ------------------------------------- |
| `enumStyle`      | `union`, `enum`, `const`                              | `const`      | Style used for generating enums       |
| `typeStyle`      | `type`, `interface`                                   | `type`       | Style used for declaring object types |
| `fileNaming`     | `kebab-case`, `camelCase`, `snake_case`, `PascalCase` | `kebab-case` | File naming                           |
| `functionNaming` | `camelCase`, `kebab-case`, `snake_case`, `PascalCase` | `camelCase`  | SDK function naming                   |

### enumStyle

```tsx
// "union"
type Status = "active" | "inactive";

// "enum"
enum Status {
Active = "active",
Inactive = "inactive",
}

// "const"
const Status = {
Active: "active",
Inactive: "inactive",
} as const;
```

### typeStyle

```tsx
// "type"
export type User = {
id: number;
name: string;
};

// "interface"
export interface User {
id: number;
name: string;
}
```

## File grouping

`groupBy` controls the structure of the output directory.

| Value        | Structure                                                      |
| ------------ | -------------------------------------------------------------- |
| `none`       | All files in a single directory                                |
| `tags`       | Files grouped by OpenAPI tags                                  |
| `operations` | Each operation in its own flat directory                       |
| `endpoints`  | Each operation in a directory nested under its tag's subfolder |

```text
// groupBy: "none"
src/api/
├── types.ts
├── sdk.ts
└── zod.ts

// groupBy: "tags"
src/api/
├── pet/
│ ├── sdk.ts
│ └── zod.ts
└── store/
├── types.ts
├── sdk.ts
└── zod.ts

// groupBy: "operations"
src/api/
├── get-pet/
│ └── sdk.ts
└── create-pet/
├── types.ts
└── sdk.ts

// groupBy: "endpoints"
src/api/
├── pet/
│ ├── get-pet/
│ │ └── sdk.ts
│ └── create-pet/
│ └── sdk.ts
└── store/
└── ...
```

## Filtering

```tsx
filter: {
tags: ["pet", "store"],     // only these tags
exclude: ["admin"],          // exclude these tags
deprecated: false,           // skip deprecated endpoints
}
```

`tags` and `exclude` can be combined. `deprecated` defaults to `false`.

## Renaming operations

```tsx
rename: {
getPetById: "fetchPet",
addPet: "createPet",
}
```

The key is the original `operationId` from the spec, the value is the new name. Applied before generation, across all plugins.

## Formatting

| Value      | Description   |
| ---------- | ------------- |
| `none`     | No formatting |
| `prettier` | Prettier      |
| `biome`    | Biome         |
| `oxfmt`    | oxfmt         |

The formatter has to be installed in the project. apig calls it after writing the files.

## Error handling

```tsx
// Default — built-in ApigError
errorHandling: true

// Disable
errorHandling: false

// Custom error class
errorHandling: {
path: "./lib/errors",
export: "ApiError",
}
```

With `true`, a `config.ts` file is generated with an `ApigError` class and helper functions. A custom class must accept `(status: number, body: unknown)`.

## Raw response

```tsx
// By default, an SDK function returns only the data
const pets = await listPets(); // PetList

// rawResponse: true — returns an object with the body, status, and headers
const { body, status, headers } = await listPets();
```

## Additional options

| Option         | Type      | Default | Description                                                    |
| -------------- | --------- | ------- | -------------------------------------------------------------- |
| `index`        | `boolean` | `true`  | Generate an `index.ts` with re-exports                         |
| `endpointsMap` | `boolean` | `false` | Generate `endpoints.ts` with a typed map of paths              |
| `cache`        | `boolean` | `false` | Cache the IR on disk. Skips parsing if the spec hasn't changed |
| `apiLogging`   | `boolean` | `false` | Add a `console.log` to every SDK function                      |
| `comment`      | `string`  | —       | Comment attached to the versioning snapshot                    |

## Hooks

```tsx
hooks: {
afterAllFilesWrite: "prettier --write ./src/api",
}
```

The command runs as a shell process after all files are written. Handy for formatting or linting when `formatter` doesn't fit your setup.

## Versioning

Saves IR snapshots so you can compare and roll back.

```tsx
versioning: {
enabled: true,
storage: ".apig/versions",
saveSpec: false,
maxSaves: 10,
pinVersions: ["v1-stable"],
aliasTemplate: "v{apiVersion}-gen{generation}",
}
```

| Option          | Default            | Description                                                            |
| --------------- | ------------------ | ---------------------------------------------------------------------- |
| `enabled`       | `false`            | Turn on saving snapshots                                               |
| `storage`       | `.apig/versions`   | Directory where snapshots are stored                                   |
| `saveSpec`      | `false`            | Save the original spec inside the snapshot                             |
| `maxSaves`      | no limit           | Max number of snapshots. Oldest ones get deleted first                 |
| `pinVersions`   | `[]`               | Snapshots protected from auto-deletion                                 |
| `aliasTemplate` | `gen{ generation}` | Alias template. Variables: `{ generation}`, `{ apiVersion}`, `{ date}` |

## CLI logging

```tsx
cliLogging: {
level: "normal", // "minimal" | "normal" | "detailed"
}
```

## Multiple configs

A file can export an array of configs, to generate from several specs with one command. Pass an array into defineConfig to do this.

```tsx
import { defineConfig, typescript, sdk } from "@travjek/apig";
export default defineConfig([
{
name: "petstore",
input: "./specs/petstore.json",
output: "./src/api/petstore",
plugins: [typescript(), sdk()],
},
{
name: "payments",
input: "example.com",
output: "./src/api/payments",
plugins: [typescript(), sdk()],
},
]);
```

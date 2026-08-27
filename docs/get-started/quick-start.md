Setup takes a couple of minutes. Start by installing the package:

**npm**

```bash
npm install @travjek/apig
```

**yarn**

```bash
yarn add @travjek/apig
```

**pnpm**

```bash
pnpm add @travjek/apig
```

**bun**

```bash
bun add @travjek/apig
```

> **Peer dependencies**
>
> apig doesn't pull in other libraries for you. Everything the plugins need at runtime (like `zod` and `@tanstack/react-query`) gets installed into the project by hand.

## Create a config

There are three ways to create a config.

### Interactive wizard

Asks about plugins, HTTP client, naming style, and output structure, then writes a ready-to-use `apig.config.ts`.

**npm**

```bash
npx apig start
```

**yarn**

```bash
yarn dlx apig start
```

**pnpm**

```bash
pnpm dlx apig start
```

**bun**

```bash
bunx apig start
```

### Ready-made preset

**npm**

```bash
npx apig config --preset react
```

**yarn**

```bash
yarn dlx apig config --preset react
```

**pnpm**

```bash
pnpm dlx apig config --preset react
```

**bun**

```bash
bunx apig config --preset react
```

List of available presets: `--list-presets`

| Preset      | Plugins                          | Needs installing                                      |
| ----------- | -------------------------------- | ----------------------------------------------------- |
| `minimal`   | types + SDK                      | —                                                     |
| `react`     | types, SDK, TanStack Query, Zod  | `@tanstack/react-query`, `zod`                        |
| `react-swr` | types, SDK, SWR, Zod             | `swr`, `zod`                                          |
| `testing`   | react + Faker and MSW            | `@faker-js/faker`, `msw` and the `react` dependencies |
| `forms`     | types, SDK, React Hook Form, Zod | `react-hook-form`, `@hookform/resolvers`, `zod`       |
| `full`      | all plugins                      | everything listed above                               |

### Without a preset

Creates a minimal config.

**npm**

```bash
npx apig config
```

**yarn**

```bash
yarn dlx apig config
```

**pnpm**

```bash
pnpm dlx apig config
```

**bun**

```bash
bunx apig config
```

### By hand

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

The only field that's actually required is `input`. Path to a local file or a URL; OpenAPI 3.1, 3.0, and Swagger 2.0 are all supported.

## Generate

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

`./src/api` will now contain:

```text
src/api/
├── types.ts      # types from the spec's schemas
├── sdk.ts        # request functions
├── zod.ts        # validation schemas
├── tanstack.ts   # query hooks
├── config.ts     # ApigError and helper functions
└── index.ts      # re-exports everything above
```

> **Don't edit generated files — your changes will be wiped on the next generation**

Import from `index.ts` — it re-exports everything.

## Watch mode

Rebuilds the output on every change to the spec or the config.

```bash
npx apig generate --watch
```

For local files, both the spec and the config are watched. For specs fetched from a URL, only the config is watched.

Preview what would change without writing anything:

```bash
npx apig generate --dry-run
```

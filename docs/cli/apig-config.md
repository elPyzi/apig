Puts `apig.config.ts` into the current directory — either an empty template or a ready-made preset for a specific stack. This command can't read an existing config, only create a new file.

## Usage

```bash
apig config
```

Alias — `apig c`. If the file already exists, the command refuses to overwrite it and exits with an error.

## Flags

| Flag                  | What it does                                                                    |
| --------------------- | ------------------------------------------------------------------------------- |
| `-p, --preset <name>` | Use a ready-made preset instead of an empty template                            |
| `--list-presets`      | Print the list of presets with descriptions and exit, without creating anything |

```bash
apig config --list-presets
apig config --preset react
```

## Without a preset

With no flags, it creates a minimal template: `typescript()`, `sdk()`, `tanstackQuery()`, and a placeholder instead of a real spec URL.

```bash
apig config
```

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig';

export default defineConfig({
input: 'https://api.example.com/openapi.json',
output: {
  path: 'src/api/generated',
  clean: true,
},
baseUrl: 'https://api.example.com',
plugins: [
  typescript(),
  sdk(),
  tanstackQuery(),
],
groupBy: 'none',
enumStyle: 'const',
typeStyle: 'type',
fileNaming: 'kebab-case',
index: true,
});
```

From there you edit `input`, cross out the plugins you don't need, and run `apig generate`.

## Presets

| Preset      | Plugins                                                            |
| ----------- | ------------------------------------------------------------------ |
| `minimal`   | TypeScript types + SDK fetch functions                             |
| `react`     | TypeScript + SDK + TanStack Query + Zod — the standard React stack |
| `react-swr` | TypeScript + SDK + SWR + Zod                                       |
| `testing`   | The React stack + Faker factories + MSW handlers for mocking       |
| `forms`     | TypeScript + SDK + Zod + React Hook Form resolvers                 |
| `full`      | Every plugin at once — including `endpointsMap: true`              |

## Preset example

```bash
apig config --preset forms
```

```ts
import { defineConfig, typescript, sdk, zod, rhf } from '@travjek/apig';

export default defineConfig({
input: 'https://api.example.com/openapi.json',
output: {
  path: 'src/api/generated',
  clean: true,
},
baseUrl: 'https://api.example.com',
plugins: [
  typescript(),
  sdk(),
  zod(),
  rhf({ resolver: 'zod' }),
],
enumStyle: 'const',
typeStyle: 'type',
});
```

## Unknown preset

```text
apig config --preset vue
Unknown preset "vue". Available: minimal, react, react-swr, testing, forms, full
```

## config vs start

> Know your stack already — grab a ready-made preset, one command, no questions. Need a config for a non-standard plugin combination, a custom HTTP client, or a specific `groupBy` — use [apig start](./apig-start.md), the wizard will ask about every detail.

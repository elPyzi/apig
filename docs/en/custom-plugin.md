# Creating a custom plugin

Plugins are the core extension point of apig. Every built-in generator (`typescript`, `sdk`, `zod`, etc.) is itself a plugin implementing the `ApigPlugin` interface.

## The `ApigPlugin` interface

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** Unique plugin name — used for deduplication and checks. */
  name: string;
  /** Base output file name without extension ("sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — called once for the whole IR (types, zod, faker, msw, ...)
   * "operations" — called once per group when groupBy=tags/endpoints (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** Optional: called once with the full IR after all groups have been written. */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** Disables suppressing typescript() when acting as a validation-only plugin. Defaults to true. */
  withTypes?: boolean;
}
```

## `PluginResult`

The value returned by `generate()`:

```ts
interface PluginResult {
  code: string;          // file contents
  exports: string[];      // named exports (used to build index.ts)
  typeExports: string[]; // type-only exports
}
```

## Minimal example

```ts
import type { ApigPlugin } from '@travjek/apig'

export const myPlugin = (): ApigPlugin => ({
  name: 'my-plugin',
  fileName: 'my-output',
  scope: 'root',
  generate(ir) {
    const lines = ir.operations.map(
      (op) => `// ${op.method.toUpperCase()} ${op.path} → ${op.id}`
    )

    return {
      code: lines.join('\n'),
      exports: [],
      typeExports: [],
    }
  },
})
```

Usage in the config:

```ts
import { defineConfig } from '@travjek/apig'
import { myPlugin } from './my-plugin'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [myPlugin()],
})
```

## IR (Intermediate Representation)

```ts
interface IR {
  operations: IROperation[]
  schemas: IRSchema[]
}

interface IROperation {
  id: string           // operationId (after rename, if given)
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## Checking for another plugin

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin requires the faker() plugin')
  // ...
}
```

This is exactly what the built-in `msw()` plugin does — it throws if `faker()` isn't present in `plugins`.

## `scope: 'operations'` and `PluginContext`

Plugins with `scope: 'operations'` (like `sdk`, `tanstackQuery`, `swr`) are called again for each group when `groupBy: 'tags'` or `'endpoints'`. `generate` receives a `ctx` with import paths that should be used instead of hardcoding them:

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // varies depending on groupBy
  // ...
}
```

## `generateRootFiles` — shared files

If your plugin needs to generate a single file shared across all groups (e.g. `query-keys.ts`), use `generateRootFiles`:

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```

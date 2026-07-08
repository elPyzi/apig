# Crear un plugin personalizado

Los plugins son el punto de extensión principal de apig. Cada generador integrado (`typescript`, `sdk`, `zod`, etc.) es en sí mismo un plugin que implementa la interfaz `ApigPlugin`.

## Interfaz `ApigPlugin`

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** Nombre único del plugin — se usa para deduplicación y comprobaciones. */
  name: string;
  /** Nombre base del archivo de salida sin extensión ("sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — se llama una vez para todo el IR (types, zod, faker, msw, ...)
   * "operations" — se llama por cada grupo cuando groupBy=tags/endpoints (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** Opcional: se llama una vez con el IR completo después de escribir todos los grupos. */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** Desactiva la supresión de typescript() cuando funciona como plugin de validación. Por defecto true. */
  withTypes?: boolean;
}
```

## `PluginResult`

Resultado devuelto por `generate()`:

```ts
interface PluginResult {
  code: string;         // contenido del archivo
  exports: string[];     // exports nombrados (para construir index.ts)
  typeExports: string[]; // exports solo de tipos
}
```

## Ejemplo mínimo

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

Uso en la configuración:

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
  id: string           // operationId (tras rename, si se indica)
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## Comprobar la presencia de otro plugin

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin requiere el plugin faker()')
  // ...
}
```

Así procede el plugin integrado `msw()` — lanza una excepción si `faker()` no está presente en `plugins`.

## `scope: 'operations'` y `PluginContext`

Los plugins con `scope: 'operations'` (como `sdk`, `tanstackQuery`, `swr`) se llaman repetidamente por cada grupo cuando `groupBy: 'tags'` o `'endpoints'`. En `generate` se pasa `ctx` con las rutas de importación que hay que usar en lugar de valores fijos:

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // cambia según groupBy
  // ...
}
```

## `generateRootFiles` — archivos compartidos

Si tu plugin necesita generar una sola vez un archivo compartido entre todos los grupos (por ejemplo `query-keys.ts`), usa `generateRootFiles`:

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```

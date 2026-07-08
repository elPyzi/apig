# Criando um plugin personalizado

Plugins são o principal ponto de extensão do apig. Cada gerador embutido (`typescript`, `sdk`, `zod`, etc.) é ele próprio um plugin, que implementa a interface `ApigPlugin`.

## Interface `ApigPlugin`

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** Nome único do plugin — usado para deduplicação e verificações. */
  name: string;
  /** Nome base do arquivo de saída, sem extensão ("sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — chamado uma vez para todo o IR (types, zod, faker, msw, ...)
   * "operations" — chamado para cada grupo quando groupBy=tags/endpoints (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** Opcional: chamado uma vez com o IR completo após a escrita de todos os grupos. */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** Desativa a supressão do typescript() quando atuando como plugin de validação. Padrão true. */
  withTypes?: boolean;
}
```

## `PluginResult`

Resultado retornado por `generate()`:

```ts
interface PluginResult {
  code: string;         // conteúdo do arquivo
  exports: string[];     // exportações nomeadas (para construir o index.ts)
  typeExports: string[]; // exportações somente de tipo
}
```

## Exemplo mínimo

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

Uso na configuração:

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
  id: string           // operationId (após rename, se especificado)
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## Verificando a presença de outro plugin

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin requer o plugin faker()')
  // ...
}
```

É assim que o plugin embutido `msw()` funciona — ele lança uma exceção se `plugins` não contiver `faker()`.

## `scope: 'operations'` e `PluginContext`

Plugins com `scope: 'operations'` (como `sdk`, `tanstackQuery`, `swr`) são chamados novamente para cada grupo quando `groupBy: 'tags'` ou `'endpoints'`. Em `generate` é passado um `ctx` com os caminhos de importação que devem ser usados em vez de valores fixos:

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // muda conforme groupBy
  // ...
}
```

## `generateRootFiles` — arquivos compartilhados

Se o plugin precisar gerar uma vez um arquivo compartilhado entre todos os grupos (por exemplo `query-keys.ts`), use `generateRootFiles`:

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```

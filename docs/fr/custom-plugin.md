# Créer un plugin personnalisé

Les plugins sont le principal point d'extension d'apig. Chaque générateur intégré (`typescript`, `sdk`, `zod`, etc.) est lui-même un plugin implémentant l'interface `ApigPlugin`.

## Interface `ApigPlugin`

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** Nom unique du plugin — utilisé pour la déduplication et les vérifications. */
  name: string;
  /** Nom de base du fichier de sortie sans extension ("sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — appelé une seule fois pour tout l'IR (types, zod, faker, msw, ...)
   * "operations" — appelé pour chaque groupe quand groupBy=tags/endpoints (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** Optionnel : appelé une seule fois avec l'IR complet après l'écriture de tous les groupes. */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** Désactive la suppression de typescript() quand utilisé comme plugin de validation. Par défaut true. */
  withTypes?: boolean;
}
```

## `PluginResult`

Résultat renvoyé par `generate()` :

```ts
interface PluginResult {
  code: string;         // contenu du fichier
  exports: string[];     // exports nommés (pour construire index.ts)
  typeExports: string[]; // exports de types uniquement
}
```

## Exemple minimal

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

Utilisation dans la configuration :

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
  id: string           // operationId (après rename, si indiqué)
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## Vérifier la présence d'un autre plugin

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin requiert le plugin faker()')
  // ...
}
```

C'est ce que fait le plugin intégré `msw()` — il lève une exception si `faker()` est absent de `plugins`.

## `scope: 'operations'` et `PluginContext`

Les plugins avec `scope: 'operations'` (comme `sdk`, `tanstackQuery`, `swr`) sont appelés à nouveau pour chaque groupe quand `groupBy: 'tags'` ou `'endpoints'`. Un `ctx` contenant les chemins d'import à utiliser à la place de valeurs codées en dur est passé à `generate` :

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // change selon groupBy
  // ...
}
```

## `generateRootFiles` — fichiers partagés

Si un plugin a besoin de générer une seule fois un fichier partagé entre tous les groupes (par exemple `query-keys.ts`), utilise `generateRootFiles` :

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```

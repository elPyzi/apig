# Ein benutzerdefiniertes Plugin erstellen

Plugins sind der zentrale Erweiterungspunkt von apig. Jeder eingebaute Generator (`typescript`, `sdk`, `zod` usw.) ist selbst ein Plugin, das die Schnittstelle `ApigPlugin` implementiert.

## Die Schnittstelle `ApigPlugin`

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** Eindeutiger Plugin-Name — wird zur Deduplizierung und für Prüfungen verwendet. */
  name: string;
  /** Basisname der Ausgabedatei ohne Erweiterung ("sdk" → "sdk.ts"). */
  fileName: string;
  /**
   * "root"       — wird einmal für das gesamte IR aufgerufen (types, zod, faker, msw, ...)
   * "operations" — wird für jede Gruppe bei groupBy=tags/endpoints aufgerufen (sdk, tanstack, swr)
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** Optional: wird einmal mit dem vollständigen IR aufgerufen, nachdem alle Gruppen geschrieben wurden. */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** Unterdrückt typescript(), wenn das Plugin als Validierungsplugin läuft. Standardmäßig true. */
  withTypes?: boolean;
}
```

## `PluginResult`

Das von `generate()` zurückgegebene Ergebnis:

```ts
interface PluginResult {
  code: string;         // Inhalt der Datei
  exports: string[];     // benannte Exporte (zum Aufbau von index.ts)
  typeExports: string[]; // reine Typ-Exporte
}
```

## Minimales Beispiel

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

Verwendung in der Konfiguration:

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
  id: string           // operationId (nach rename, falls angegeben)
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## Prüfen, ob ein anderes Plugin vorhanden ist

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin requires the faker() plugin')
  // ...
}
```

So verfährt auch das eingebaute Plugin `msw()` — es wirft eine Exception, wenn in `plugins` kein `faker()` vorhanden ist.

## `scope: 'operations'` und `PluginContext`

Plugins mit `scope: 'operations'` (wie `sdk`, `tanstackQuery`, `swr`) werden bei `groupBy: 'tags'` oder `'endpoints'` für jede Gruppe erneut aufgerufen. An `generate` wird ein `ctx` mit Importpfaden übergeben, die statt fest kodierter Pfade verwendet werden sollten:

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // ändert sich je nach groupBy
  // ...
}
```

## `generateRootFiles` — gemeinsame Dateien

Wenn ein Plugin einmalig eine Datei erzeugen muss, die für alle Gruppen gemeinsam gilt (z. B. `query-keys.ts`), verwende `generateRootFiles`:

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```

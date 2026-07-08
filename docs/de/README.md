# @travjek/apig

Ein leistungsstarker, entwicklerfreundlicher OpenAPI-Codegenerator, der den Schmerz der API-Integration nimmt — und deinen Tag ein bisschen glücklicher macht.

## Installation

```bash
npm install -D @travjek/apig
```

## Schnellstart

```ts
// apig.config.ts
import { defineConfig, typescript, sdk, zod, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery(),
  ],
})
```

```bash
npx apig generate
```

## Plugins

| Plugin | Beschreibung |
|--------|--------------|
| `typescript()` | TypeScript-Typen aus OpenAPI-Schemata |
| `sdk()` | Typisierte Anfragefunktionen (`fetch`, `axios`, `ky`, `ofetch`, `wretch`) |
| `zod()` | Zod-Schemata mit email, uuid, min/max, discriminated unions |
| `valibot()` | Valibot-Schemata |
| `yup()` | Yup-Schemata |
| `tanstackQuery()` | TanStack Query v5 Hooks |
| `swr()` | SWR-Hooks |
| `rhf()` | Resolver für React Hook Form |
| `faker()` | Faker.js-Factories |
| `msw()` | Mock Service Worker Handler |

## CLI

```bash
apig generate           # Code generieren
apig generate --watch   # Überwachungsmodus für Änderungen
apig generate --dry-run # Vorschau ohne Dateien zu schreiben
apig versions           # Liste gespeicherter Snapshots
apig info               # Statistik zur Spezifikation ohne Generierung
```

## Dokumentation

- [Konfiguration](./config.md)
- [CLI](./cli.md)
- [Plugins](./plugins/index.md)
  - [typescript()](./plugins/typescript.md)
  - [sdk()](./plugins/sdk.md)
  - [zod()](./plugins/zod.md)
  - [valibot()](./plugins/valibot.md)
  - [yup()](./plugins/yup.md)
  - [tanstackQuery()](./plugins/tanstack-query.md)
  - [swr()](./plugins/swr.md)
  - [rhf()](./plugins/rhf.md)
  - [faker()](./plugins/faker.md)
  - [msw()](./plugins/msw.md)
- [Eigenes Plugin erstellen](./custom-plugin.md)
- [ApigError-Client](./client.md)
- [Cache](./cache.md)
- [endpointsMap](./endpoints-map.md)

## Lizenz

MIT

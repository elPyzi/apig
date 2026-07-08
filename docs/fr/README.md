# @travjek/apig

Un générateur de code puissant et convivial à partir de spécifications OpenAPI, qui prend en charge toute la douleur de l'intégration d'API — et rend ta journée un peu plus heureuse.

## Installation

```bash
npm install -D @travjek/apig
```

## Démarrage rapide

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

| Plugin | Description |
|--------|-------------|
| `typescript()` | Types TypeScript depuis les schémas OpenAPI |
| `sdk()` | Fonctions de requête typées (`fetch`, `axios`, `ky`, `ofetch`, `wretch`) |
| `zod()` | Schémas Zod avec email, uuid, min/max, unions discriminées |
| `valibot()` | Schémas Valibot |
| `yup()` | Schémas Yup |
| `tanstackQuery()` | Hooks TanStack Query v5 |
| `swr()` | Hooks SWR |
| `rhf()` | Résolveurs pour React Hook Form |
| `faker()` | Fabriques Faker.js |
| `msw()` | Gestionnaires Mock Service Worker |

## CLI

```bash
apig generate           # génération du code
apig generate --watch   # mode surveillance des changements
apig generate --dry-run # aperçu sans écriture de fichiers
apig versions           # liste des snapshots sauvegardés
apig info               # statistiques sur la spécification, sans génération
```

## Documentation

- [Configuration](./config.md)
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
- [Créer un plugin personnalisé](./custom-plugin.md)
- [Client ApigError](./client.md)
- [Cache](./cache.md)
- [endpointsMap](./endpoints-map.md)

## Licence

MIT

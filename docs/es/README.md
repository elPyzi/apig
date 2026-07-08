# @travjek/apig

Un potente y cómodo generador de código a partir de especificaciones OpenAPI, que se encarga de todo el dolor de la integración con APIs — y hace tu día un poco más feliz.

## Instalación

```bash
npm install -D @travjek/apig
```

## Inicio rápido

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

| Plugin | Descripción |
|--------|-------------|
| `typescript()` | Tipos TypeScript desde esquemas OpenAPI |
| `sdk()` | Funciones de solicitud tipadas (`fetch`, `axios`, `ky`, `ofetch`, `wretch`) |
| `zod()` | Esquemas Zod con email, uuid, min/max, uniones discriminadas |
| `valibot()` | Esquemas Valibot |
| `yup()` | Esquemas Yup |
| `tanstackQuery()` | Hooks TanStack Query v5 |
| `swr()` | Hooks SWR |
| `rhf()` | Resolvers para React Hook Form |
| `faker()` | Fábricas Faker.js |
| `msw()` | Manejadores Mock Service Worker |

## CLI

```bash
apig generate           # generación de código
apig generate --watch   # modo de vigilancia de cambios
apig generate --dry-run # vista previa sin escribir archivos
apig versions           # listar snapshots guardados
apig info               # estadísticas de la especificación sin generar
```

## Documentación

- [Configuración](./config.md)
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
- [Crear un plugin personalizado](./custom-plugin.md)
- [Cliente ApigError](./client.md)
- [Caché](./cache.md)
- [endpointsMap](./endpoints-map.md)

## Licencia

MIT

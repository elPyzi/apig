# Configuración

`apig.config.ts` es el punto de entrada para toda la configuración. Exporta una sola configuración o un array de configuraciones.

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

Varias configuraciones (por ejemplo, para distintas APIs en un mismo proyecto):

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## Opciones

### `name`

**Tipo:** `string`

Etiqueta para esta configuración, se muestra en la salida del CLI cuando se usan varias configuraciones.

```ts
name: 'users-api'
```

---

### `input`

**Tipo:** `string | (() => Promise<string>)`  
**Obligatorio:** sí

Ruta, URL o función asíncrona que devuelve la ruta/URL a la especificación OpenAPI. Compatible con OpenAPI 3.0 y Swagger 2.0 (actualización automática).

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**Tipo:** `string | { path: string; clean?: boolean }`  
**Por defecto:** `.apig/generated`

Directorio donde se escriben los archivos generados. Al pasar una cadena, `clean` es `true` por defecto (el directorio se limpia antes de la generación).

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**Tipo:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Por defecto:** `{ name: 'fetch' }`

Cliente HTTP usado en las funciones generadas por `sdk()`. Para `axios`, `ky`, `ofetch`, `wretch` son obligatorios `path` y `export` — la ruta del archivo y el export nombrado de tu instancia de cliente. Para `fetch` no son necesarios.

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**Tipo:** `ApigPlugin[]`

Array de plugins. Ver [Plugins](./plugins/index.md) para la lista completa.

---

### `baseUrl`

**Tipo:** `string`

Prefijo añadido a todas las rutas de las solicitudes.

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**Tipo:** `'none' | 'tags' | 'endpoints' | 'operations'`  
**Por defecto:** `'none'`

Controla cómo se dividen los archivos generados:

- `none` — toda la salida en el directorio `output`, sin subcarpetas (`sdk.ts`, `types.ts`, ...)
- `tags` — una subcarpeta por cada tag de OpenAPI (`users/users.sdk.ts`)
- `endpoints` — una subcarpeta por tag, y dentro de ella una subcarpeta por cada operación (`users/get-user/get-user.sdk.ts`)
- `operations` — una subcarpeta por cada operación sin agrupar por tag (`get-user/get-user.sdk.ts`)

---

### `fileNaming`

**Tipo:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**Por defecto:** `'kebab-case'`

Convención de nomenclatura de los archivos y directorios generados (se usa cuando `groupBy` es distinto de `none`).

---

### `functionNaming`

**Tipo:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**Por defecto:** `'camelCase'`

Convención de nomenclatura de las funciones SDK generadas.

---

### `enumStyle`

**Tipo:** `'union' | 'enum' | 'const'`

Controla la generación de enumeraciones en todos los plugins (`typescript`, `zod`, `valibot`, `yup`). Es una opción global de `defineConfig`, no una opción de un plugin individual.

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

Por defecto, el plugin `typescript()` usa `'const'`, mientras que `zod()`/`valibot()`/`yup()` usan `'union'`, si `enumStyle` no se indica explícitamente.

---

### `typeStyle`

**Tipo:** `'type' | 'interface'`  
**Por defecto:** `'type'`

Estilo de declaración de tipos para los esquemas de objeto en `typescript()`. Es una opción global de `defineConfig`.

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**Tipo:** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

Incluir o excluir operaciones:

```ts
filter: {
  tags: ['users', 'orders'], // generar solo estos tags
  exclude: ['internal'],     // excluir estos tags
  deprecated: false,         // incluir operaciones deprecated (por defecto false)
}
```

---

### `rename`

**Tipo:** `Record<string, string>`

Renombrar `operationId` antes de la generación:

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**Tipo:** `boolean`

> **Particularidad conocida:** en este momento este campo no se lee en ningún lugar de la generación de código, salvo en la comprobación de tipos al validar la configuración — no afecta al comportamiento real. No confíes en él.

---

### `endpointsMap`

**Tipo:** `boolean`  
**Por defecto:** `false`

Genera un archivo `endpoints.ts` con una constante tipada de todas las rutas de la API. Ver [endpointsMap](./endpoints-map.md).

---

### `index`

**Tipo:** `boolean`  
**Por defecto:** `true`

Controla la generación de `index.ts` con las reexportaciones de todos los archivos generados.

---

### `formatter`

**Tipo:** `'prettier' | 'biome' | 'oxfmt' | 'none'`  
**Por defecto:** `'none'`

Formatea los archivos generados después de escribirlos.

---

### `cache`

**Tipo:** `boolean`  
**Por defecto:** `false`

Almacena en caché el IR analizado en disco (`.apig/cache`). En ejecuciones posteriores omite el análisis si la especificación no ha cambiado (ETag para URL, hash para archivos locales). Ver [Caché](./cache.md).

---

### `apiLogging`

**Tipo:** `boolean`  
**Por defecto:** `false`

Añade `console.log(functionName, response)` en cada función SDK generada.

---

### `cliLogging`

**Tipo:** `{ level?: 'minimal' | 'normal' | 'detailed' }`  
**Por defecto:** `{ level: 'minimal' }`

Nivel de detalle de los logs del CLI durante la generación.

---

### `errorHandling`

**Tipo:** `boolean | { path: string; export: string }`  
**Por defecto:** `true`

Manejo de errores en las funciones SDK:

- `true` (por defecto) — genera una clase `ApigError` integrada en el archivo `config.ts` del directorio de salida
- `false` — desactiva por completo el manejo de errores
- `{ path, export }` — usa tu propia clase de error personalizada desde la ruta indicada

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

Ver [Cliente ApigError](./client.md).

---

### `rawResponse`

**Tipo:** `boolean`  
**Por defecto:** `false`

Devuelve el objeto de respuesta completo `{ body, status, headers }` en lugar de solo los datos.

---

### `hooks`

**Tipo:** `{ afterAllFilesWrite?: string }`

Comando de shell ejecutado después de escribir todos los archivos:

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**Tipo:** `string`

Comentario adjuntado al snapshot de versionado en la siguiente generación.

```ts
comment: 'before auth refactor'
```

---

## Versionado

**Tipo:** `Versioning`

```ts
versioning: {
  enabled: true,
  storage: '.apig/versions',
  maxSaves: 10,
  saveSpec: true,
  pinVersions: ['abc123'],
  aliasTemplate: 'v{apiVersion}-gen{generation}',
}
```

| Campo | Tipo | Por defecto | Descripción |
|------|-----|--------------|----------|
| `enabled` | `boolean` | `false` | Activar el versionado con snapshots |
| `storage` | `string` | `.apig/versions` | Directorio para almacenar los snapshots |
| `saveSpec` | `boolean` | `false` | Guardar la especificación OpenAPI original en cada snapshot |
| `maxSaves` | `number` | sin límite | Máximo de snapshots almacenados; los más antiguos se eliminan primero |
| `pinVersions` | `string[]` | — | IDs de snapshots que nunca se eliminan automáticamente |
| `aliasTemplate` | `string` | `gen{generation}` | Plantilla de alias del snapshot |

Variables de plantilla disponibles: `{generation}`, `{apiVersion}`, `{date}`.

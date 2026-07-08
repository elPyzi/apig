# Konfiguration

`apig.config.ts` ist der Einstiegspunkt für die gesamte Konfiguration. Exportiere eine einzelne Konfiguration oder ein Array von Konfigurationen.

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

Mehrere Konfigurationen (zum Beispiel für verschiedene APIs im selben Projekt):

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## Optionen

### `name`

**Typ:** `string`

Bezeichnung für diese Konfiguration, wird in der CLI-Ausgabe angezeigt, wenn mehrere Konfigurationen verwendet werden.

```ts
name: 'users-api'
```

---

### `input`

**Typ:** `string | (() => Promise<string>)`  
**Erforderlich:** ja

Pfad, URL oder asynchrone Funktion, die den Pfad/die URL zur OpenAPI-Spezifikation zurückgibt. Unterstützt OpenAPI 3.0 und Swagger 2.0 (wird automatisch aktualisiert).

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**Typ:** `string | { path: string; clean?: boolean }`  
**Standard:** `.apig/generated`

Verzeichnis, in das die generierten Dateien geschrieben werden. Wird ein String übergeben, ist `clean` standardmäßig `true` (das Verzeichnis wird vor der Generierung geleert).

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**Typ:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Standard:** `{ name: 'fetch' }`

HTTP-Client, der in den von `sdk()` generierten Funktionen verwendet wird. Für `axios`, `ky`, `ofetch`, `wretch` sind `path` und `export` erforderlich — der Pfad zur Datei und der benannte Export deiner Client-Instanz. Für `fetch` werden sie nicht benötigt.

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**Typ:** `ApigPlugin[]`

Array von Plugins. Siehe [Plugins](./plugins/index.md) für die vollständige Liste.

---

### `baseUrl`

**Typ:** `string`

Präfix, das allen Anfragepfaden vorangestellt wird.

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**Typ:** `'none' | 'tags' | 'endpoints' | 'operations'`  
**Standard:** `'none'`

Steuert, wie die generierten Dateien aufgeteilt werden:

- `none` — die gesamte Ausgabe liegt im Verzeichnis `output`, ohne Unterordner (`sdk.ts`, `types.ts`, ...)
- `tags` — ein Unterordner pro OpenAPI-Tag (`users/users.sdk.ts`)
- `endpoints` — ein Unterordner pro Tag, darin ein Unterordner pro Operation (`users/get-user/get-user.sdk.ts`)
- `operations` — ein Unterordner pro Operation, ohne Gruppierung nach Tag (`get-user/get-user.sdk.ts`)

---

### `fileNaming`

**Typ:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**Standard:** `'kebab-case'`

Namenskonvention für generierte Dateien und Verzeichnisse (wird verwendet, wenn `groupBy` von `none` abweicht).

---

### `functionNaming`

**Typ:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**Standard:** `'camelCase'`

Namenskonvention für generierte SDK-Funktionen.

---

### `enumStyle`

**Typ:** `'union' | 'enum' | 'const'`

Steuert die Generierung von Enums in allen Plugins (`typescript`, `zod`, `valibot`, `yup`). Dies ist eine globale Option von `defineConfig`, keine Option eines einzelnen Plugins.

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

Standardmäßig verwendet das Plugin `typescript()` `'const'`, während `zod()`/`valibot()`/`yup()` `'union'` verwenden, sofern `enumStyle` nicht explizit angegeben wird.

---

### `typeStyle`

**Typ:** `'type' | 'interface'`  
**Standard:** `'type'`

Stil der Typdeklaration für Objektschemata in `typescript()`. Dies ist eine globale Option von `defineConfig`.

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**Typ:** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

Operationen einschließen oder ausschließen:

```ts
filter: {
  tags: ['users', 'orders'], // nur diese Tags generieren
  exclude: ['internal'],     // diese Tags ausschließen
  deprecated: false,         // veraltete (deprecated) Operationen einschließen (Standard: false)
}
```

---

### `rename`

**Typ:** `Record<string, string>`

`operationId` vor der Generierung umbenennen:

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**Typ:** `boolean`

> **Bekannte Einschränkung:** Aktuell wird dieses Feld an keiner Stelle der Codegenerierung ausgelesen, außer bei der Typprüfung während der Konfigurationsvalidierung — es hat keinen Einfluss auf das tatsächliche Verhalten. Verlass dich nicht darauf.

---

### `endpointsMap`

**Typ:** `boolean`  
**Standard:** `false`

Generiert eine Datei `endpoints.ts` mit einer typisierten Konstante aller API-Pfade. Siehe [endpointsMap](./endpoints-map.md).

---

### `index`

**Typ:** `boolean`  
**Standard:** `true`

Steuert, ob eine `index.ts` mit Re-Exporten aller generierten Dateien erzeugt wird.

---

### `formatter`

**Typ:** `'prettier' | 'biome' | 'oxfmt' | 'none'`  
**Standard:** `'none'`

Formatierung der generierten Dateien nach dem Schreiben.

---

### `cache`

**Typ:** `boolean`  
**Standard:** `false`

Cacht das geparste IR auf der Festplatte (`.apig/cache`). Bei erneuten Läufen wird das Parsen übersprungen, wenn sich die Spezifikation nicht geändert hat (ETag bei URLs, Hash bei lokalen Dateien). Siehe [Cache](./cache.md).

---

### `apiLogging`

**Typ:** `boolean`  
**Standard:** `false`

Fügt `console.log(functionName, response)` in jede generierte SDK-Funktion ein.

---

### `cliLogging`

**Typ:** `{ level?: 'minimal' | 'normal' | 'detailed' }`  
**Standard:** `{ level: 'minimal' }`

Detailgrad der CLI-Logs während der Generierung.

---

### `errorHandling`

**Typ:** `boolean | { path: string; export: string }`  
**Standard:** `true`

Fehlerbehandlung in SDK-Funktionen:

- `true` (Standard) — generiert eine eingebaute Klasse `ApigError` in die Datei `config.ts` im Ausgabeverzeichnis
- `false` — deaktiviert die Fehlerbehandlung vollständig
- `{ path, export }` — verwendet deine eigene Fehlerklasse aus dem angegebenen Pfad

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

Siehe [Client ApigError](./client.md).

---

### `rawResponse`

**Typ:** `boolean`  
**Standard:** `false`

Gibt das vollständige Antwortobjekt `{ body, status, headers }` zurück statt nur der Daten.

---

### `hooks`

**Typ:** `{ afterAllFilesWrite?: string }`

Shell-Befehl, der ausgeführt wird, nachdem alle Dateien geschrieben wurden:

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**Typ:** `string`

Kommentar, der beim nächsten Generierungslauf an den Versionierungs-Snapshot angehängt wird.

```ts
comment: 'before auth refactor'
```

---

## Versionierung

**Typ:** `Versioning`

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

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `enabled` | `boolean` | `false` | Snapshot-Versionierung aktivieren |
| `storage` | `string` | `.apig/versions` | Verzeichnis zur Speicherung der Snapshots |
| `saveSpec` | `boolean` | `false` | Die originale OpenAPI-Spezifikation in jedem Snapshot speichern |
| `maxSaves` | `number` | unbegrenzt | Maximale Anzahl gespeicherter Snapshots; älteste werden zuerst gelöscht |
| `pinVersions` | `string[]` | — | Snapshot-IDs, die nie automatisch gelöscht werden |
| `aliasTemplate` | `string` | `gen{generation}` | Vorlage für den Snapshot-Alias |

Verfügbare Vorlagenvariablen: `{generation}`, `{apiVersion}`, `{date}`.

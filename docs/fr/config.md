# Configuration

`apig.config.ts` est le point d'entrée de toute la configuration. Exporte une seule configuration ou un tableau de configurations.

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

Plusieurs configurations (par exemple pour différentes API dans un même projet) :

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## Options

### `name`

**Type :** `string`

Étiquette pour cette configuration, affichée dans la sortie du CLI lors de l'utilisation de plusieurs configurations.

```ts
name: 'users-api'
```

---

### `input`

**Type :** `string | (() => Promise<string>)`  
**Requis :** oui

Chemin, URL, ou fonction asynchrone renvoyant le chemin/l'URL vers la spécification OpenAPI. Prend en charge OpenAPI 3.0 et Swagger 2.0 (mis à niveau automatiquement).

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**Type :** `string | { path: string; clean?: boolean }`  
**Par défaut :** `.apig/generated`

Répertoire dans lequel les fichiers générés sont écrits. Lorsqu'une chaîne est passée, `clean` vaut par défaut `true` (le répertoire est nettoyé avant la génération).

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**Type :** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**Par défaut :** `{ name: 'fetch' }`

Client HTTP utilisé dans les fonctions générées par `sdk()`. Pour `axios`, `ky`, `ofetch`, `wretch`, `path` et `export` sont obligatoires — le chemin vers le fichier et l'export nommé de ton instance de client. Pour `fetch`, ils ne sont pas nécessaires.

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**Type :** `ApigPlugin[]`

Tableau de plugins. Voir [Plugins](./plugins/index.md) pour la liste complète.

---

### `baseUrl`

**Type :** `string`

Préfixe ajouté à tous les chemins de requête.

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**Type :** `'none' | 'tags' | 'endpoints' | 'operations'`  
**Par défaut :** `'none'`

Contrôle la façon dont les fichiers générés sont répartis :

- `none` — toute la sortie dans le répertoire `output`, sans sous-dossiers (`sdk.ts`, `types.ts`, ...)
- `tags` — un sous-dossier par tag OpenAPI (`users/users.sdk.ts`)
- `endpoints` — un sous-dossier par tag, avec à l'intérieur un sous-dossier par opération (`users/get-user/get-user.sdk.ts`)
- `operations` — un sous-dossier par opération sans regroupement par tag (`get-user/get-user.sdk.ts`)

---

### `fileNaming`

**Type :** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**Par défaut :** `'kebab-case'`

Convention de nommage des fichiers et répertoires générés (utilisée quand `groupBy` est différent de `none`).

---

### `functionNaming`

**Type :** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**Par défaut :** `'camelCase'`

Convention de nommage des fonctions SDK générées.

---

### `enumStyle`

**Type :** `'union' | 'enum' | 'const'`

Contrôle la génération des énumérations dans tous les plugins (`typescript`, `zod`, `valibot`, `yup`). C'est une option globale de `defineConfig`, pas une option de plugin individuel.

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

Par défaut, le plugin `typescript()` utilise `'const'`, tandis que `zod()`/`valibot()`/`yup()` utilisent `'union'`, si `enumStyle` n'est pas explicitement indiqué.

---

### `typeStyle`

**Type :** `'type' | 'interface'`  
**Par défaut :** `'type'`

Style de déclaration des types pour les schémas objet dans `typescript()`. C'est une option globale de `defineConfig`.

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**Type :** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

Inclusion ou exclusion d'opérations :

```ts
filter: {
  tags: ['users', 'orders'], // ne générer que ces tags
  exclude: ['internal'],     // exclure ces tags
  deprecated: false,         // inclure les opérations deprecated (par défaut false)
}
```

---

### `rename`

**Type :** `Record<string, string>`

Renommage des `operationId` avant la génération :

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**Type :** `boolean`

> **Particularité connue :** actuellement, ce champ n'est lu nulle part dans la génération de code, à part la vérification de type lors de la validation de la configuration — il n'a aucun effet sur le comportement réel. Ne t'appuie pas dessus.

---

### `endpointsMap`

**Type :** `boolean`  
**Par défaut :** `false`

Génère un fichier `endpoints.ts` avec une constante typée regroupant tous les chemins de l'API. Voir [endpointsMap](./endpoints-map.md).

---

### `index`

**Type :** `boolean`  
**Par défaut :** `true`

Contrôle la génération de `index.ts` avec les ré-exports de tous les fichiers générés.

---

### `formatter`

**Type :** `'prettier' | 'biome' | 'oxfmt' | 'none'`  
**Par défaut :** `'none'`

Formatage des fichiers générés après l'écriture.

---

### `cache`

**Type :** `boolean`  
**Par défaut :** `false`

Met en cache sur disque l'IR analysé (`.apig/cache`). Aux exécutions suivantes, saute le parsing si la spécification n'a pas changé (ETag pour une URL, hash pour un fichier local). Voir [Cache](./cache.md).

---

### `apiLogging`

**Type :** `boolean`  
**Par défaut :** `false`

Ajoute `console.log(functionName, response)` dans chaque fonction SDK générée.

---

### `cliLogging`

**Type :** `{ level?: 'minimal' | 'normal' | 'detailed' }`  
**Par défaut :** `{ level: 'minimal' }`

Niveau de détail des logs du CLI pendant la génération.

---

### `errorHandling`

**Type :** `boolean | { path: string; export: string }`  
**Par défaut :** `true`

Gestion des erreurs dans les fonctions SDK :

- `true` (par défaut) — génère une classe `ApigError` intégrée dans le fichier `config.ts` du répertoire de sortie
- `false` — désactive complètement la gestion des erreurs
- `{ path, export }` — utilise ta propre classe d'erreur personnalisée depuis le chemin indiqué

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

Voir [Client ApigError](./client.md).

---

### `rawResponse`

**Type :** `boolean`  
**Par défaut :** `false`

Renvoie l'objet de réponse complet `{ body, status, headers }` au lieu des seules données.

---

### `hooks`

**Type :** `{ afterAllFilesWrite?: string }`

Commande shell exécutée après l'écriture de tous les fichiers :

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**Type :** `string`

Commentaire attaché au snapshot de versionnage lors de la prochaine génération.

```ts
comment: 'before auth refactor'
```

---

## Versionnage

**Type :** `Versioning`

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

| Champ | Type | Par défaut | Description |
|-------|------|------------|-------------|
| `enabled` | `boolean` | `false` | Activer le versionnage par snapshots |
| `storage` | `string` | `.apig/versions` | Répertoire de stockage des snapshots |
| `saveSpec` | `boolean` | `false` | Sauvegarder la spécification OpenAPI source dans chaque snapshot |
| `maxSaves` | `number` | sans limite | Nombre maximum de snapshots conservés ; les plus anciens sont supprimés en premier |
| `pinVersions` | `string[]` | — | IDs de snapshots qui ne sont jamais supprimés automatiquement |
| `aliasTemplate` | `string` | `gen{generation}` | Modèle d'alias du snapshot |

Variables de modèle disponibles : `{generation}`, `{apiVersion}`, `{date}`.

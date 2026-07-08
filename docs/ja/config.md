# 設定

`apig.config.ts` — すべての設定のエントリポイント。単一の設定または設定の配列をエクスポートする。

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

複数の設定（例えば、1つのプロジェクトで複数のAPIを扱う場合）:

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## オプション

### `name`

**型:** `string`

この設定のラベル。複数の設定を使用する場合にCLIの出力に表示される。

```ts
name: 'users-api'
```

---

### `input`

**型:** `string | (() => Promise<string>)`  
**必須:** はい

OpenAPI仕様へのパス、URL、またはパス/URLを返す非同期関数。OpenAPI 3.0とSwagger 2.0をサポート（自動アップグレード）。

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**型:** `string | { path: string; clean?: boolean }`  
**デフォルト:** `.apig/generated`

生成されたファイルが書き込まれるディレクトリ。文字列を渡した場合、`clean` はデフォルトで `true`（生成前にディレクトリがクリアされる）。

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**型:** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`  
**デフォルト:** `{ name: 'fetch' }`

`sdk()` が生成する関数で使用されるHTTPクライアント。`axios`、`ky`、`ofetch`、`wretch` の場合、`path` と `export` が必須 — クライアントインスタンスへのファイルパスと名前付きエクスポート。`fetch` の場合は不要。

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**型:** `ApigPlugin[]`

プラグインの配列。完全なリストは[プラグイン](./plugins/index.md)を参照。

---

### `baseUrl`

**型:** `string`

すべてのリクエストパスに追加されるプレフィックス。

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**型:** `'none' | 'tags' | 'endpoints' | 'operations'`  
**デフォルト:** `'none'`

生成されたファイルの分割方法を制御する。

- `none` — すべての出力が `output` ディレクトリに、サブフォルダなしで（`sdk.ts`、`types.ts`、...）
- `tags` — OpenAPIタグごとにサブフォルダ（`users/users.sdk.ts`）
- `endpoints` — タグごとにサブフォルダ、その中に各オペレーションごとのサブフォルダ（`users/get-user/get-user.sdk.ts`）
- `operations` — タグでグループ化せず、各オペレーションごとにサブフォルダ（`get-user/get-user.sdk.ts`）

---

### `fileNaming`

**型:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**デフォルト:** `'kebab-case'`

生成されたファイルとディレクトリの命名規則（`groupBy` が `none` 以外の場合に使用される）。

---

### `functionNaming`

**型:** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`  
**デフォルト:** `'camelCase'`

生成されたSDK関数の命名規則。

---

### `enumStyle`

**型:** `'union' | 'enum' | 'const'`

すべてのプラグイン（`typescript`、`zod`、`valibot`、`yup`）にわたる列挙型の生成を制御する。これは個別のプラグインオプションではなく、グローバルな `defineConfig` オプション。

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

デフォルトでは、`typescript()` プラグインは `'const'` を使用し、`zod()`/`valibot()`/`yup()` は `enumStyle` が明示的に指定されていない場合 `'union'` を使用する。

---

### `typeStyle`

**型:** `'type' | 'interface'`  
**デフォルト:** `'type'`

`typescript()` におけるオブジェクトスキーマの型宣言スタイル。これはグローバルな `defineConfig` オプション。

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**型:** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

オペレーションの包含または除外:

```ts
filter: {
  tags: ['users', 'orders'], // これらのタグのみ生成
  exclude: ['internal'],     // これらのタグを除外
  deprecated: false,         // deprecatedオペレーションを含めるか（デフォルト false）
}
```

---

### `rename`

**型:** `Record<string, string>`

生成前の `operationId` のリネーム:

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**型:** `boolean`

> **既知の特性:** 現時点では、このフィールドは設定のバリデーション時の型チェックを除いて、コード生成のどこでも読み取られていない — 実際の動作には影響しない。これに依存しないこと。

---

### `endpointsMap`

**型:** `boolean`  
**デフォルト:** `false`

すべてのAPIパスの型付き定数を含む `endpoints.ts` ファイルを生成する。[endpointsMap](./endpoints-map.md) を参照。

---

### `index`

**型:** `boolean`  
**デフォルト:** `true`

生成されたすべてのファイルを再エクスポートする `index.ts` の生成を制御する。

---

### `formatter`

**型:** `'prettier' | 'biome' | 'oxfmt' | 'none'`  
**デフォルト:** `'none'`

書き込み後に生成されたファイルをフォーマットする。

---

### `cache`

**型:** `boolean`  
**デフォルト:** `false`

パース済みIRをディスク（`.apig/cache`）にキャッシュする。仕様が変わっていない場合、再実行時にパースをスキップする（URLの場合はETag、ローカルファイルの場合はハッシュ）。[キャッシュ](./cache.md) を参照。

---

### `apiLogging`

**型:** `boolean`  
**デフォルト:** `false`

生成された各SDK関数に `console.log(functionName, response)` を追加する。

---

### `cliLogging`

**型:** `{ level?: 'minimal' | 'normal' | 'detailed' }`  
**デフォルト:** `{ level: 'minimal' }`

生成中のCLIログの詳細レベル。

---

### `errorHandling`

**型:** `boolean | { path: string; export: string }`  
**デフォルト:** `true`

SDK関数でのエラー処理:

- `true`（デフォルト） — 出力ディレクトリの `config.ts` ファイルに組み込みの `ApigError` クラスを生成
- `false` — エラー処理を完全に無効化
- `{ path, export }` — 指定されたパスからカスタムエラークラスを使用

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

[ApigError クライアント](./client.md) を参照。

---

### `rawResponse`

**型:** `boolean`  
**デフォルト:** `false`

データのみではなく、完全なレスポンスオブジェクト `{ body, status, headers }` を返す。

---

### `hooks`

**型:** `{ afterAllFilesWrite?: string }`

すべてのファイルの書き込み後に実行されるシェルコマンド:

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**型:** `string`

次回の生成時にバージョン管理スナップショットに添付されるコメント。

```ts
comment: 'before auth refactor'
```

---

## バージョン管理

**型:** `Versioning`

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

| フィールド | 型 | デフォルト | 説明 |
|------|-----|--------------|----------|
| `enabled` | `boolean` | `false` | スナップショットベースのバージョン管理を有効化 |
| `storage` | `string` | `.apig/versions` | スナップショットを保存するディレクトリ |
| `saveSpec` | `boolean` | `false` | 各スナップショットに元のOpenAPI仕様を保存 |
| `maxSaves` | `number` | 無制限 | 保持するスナップショットの最大数; 古いものから削除される |
| `pinVersions` | `string[]` | — | 自動削除されないスナップショットID |
| `aliasTemplate` | `string` | `gen{generation}` | スナップショットのエイリアステンプレート |

利用可能なテンプレート変数: `{generation}`、`{apiVersion}`、`{date}`。

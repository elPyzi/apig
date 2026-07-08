# カスタムプラグインの作成

プラグインは apig の中核的な拡張ポイント。すべての組み込みジェネレーター（`typescript`、`sdk`、`zod` など）自体が `ApigPlugin` インターフェースを実装するプラグイン。

## `ApigPlugin` インターフェース

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** 一意のプラグイン名 — 重複排除とチェックに使用される。 */
  name: string;
  /** 拡張子なしの出力ファイルのベース名（"sdk" → "sdk.ts"）。 */
  fileName: string;
  /**
   * "root"       — IR全体に対して一度だけ呼び出される（types、zod、faker、msw、...）
   * "operations" — groupBy=tags/endpoints の場合、各グループに対して呼び出される（sdk、tanstack、swr）
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** オプション: すべてのグループの書き込み後、完全なIRとともに一度だけ呼び出される。 */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** バリデーションプラグインとして動作する際に typescript() の抑制を無効化する。デフォルトは true。 */
  withTypes?: boolean;
}
```

## `PluginResult`

`generate()` から返される結果:

```ts
interface PluginResult {
  code: string;         // ファイルの内容
  exports: string[];     // 名前付きエクスポート（index.ts の構築に使用）
  typeExports: string[]; // 型のみのエクスポート
}
```

## 最小限の例

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

設定での使用:

```ts
import { defineConfig } from '@travjek/apig'
import { myPlugin } from './my-plugin'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [myPlugin()],
})
```

## IR（中間表現）

```ts
interface IR {
  operations: IROperation[]
  schemas: IRSchema[]
}

interface IROperation {
  id: string           // operationId（renameが指定されている場合はその後）
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## 他のプラグインの存在確認

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin requires the faker() plugin')
  // ...
}
```

組み込みプラグイン `msw()` はこのようにしている — `plugins` に `faker()` がない場合、例外をスローする。

## `scope: 'operations'` と `PluginContext`

`scope: 'operations'` を持つプラグイン（`sdk`、`tanstackQuery`、`swr` など）は、`groupBy: 'tags'` または `'endpoints'` の場合、各グループに対して繰り返し呼び出される。`generate` にはハードコードの代わりに使用すべきインポートパスを含む `ctx` が渡される:

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // groupBy に応じて変化する
  // ...
}
```

## `generateRootFiles` — 共有ファイル

プラグインがすべてのグループで共有される単一のファイル（例えば `query-keys.ts`）を一度だけ生成する必要がある場合、`generateRootFiles` を使用する:

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```

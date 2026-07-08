# @travjek/apig

API統合の苦労を取り除き、あなたの一日を少し幸せにする、強力で開発者に優しいOpenAPIコードジェネレーター。

## インストール

```bash
npm install -D @travjek/apig
```

## クイックスタート

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

## プラグイン

| プラグイン | 説明 |
|-----------|------|
| `typescript()` | OpenAPIスキーマからTypeScript型を生成 |
| `sdk()` | 型付きリクエスト関数（`fetch`, `axios`, `ky`, `ofetch`, `wretch`）|
| `zod()` | Zodスキーマ（email、uuid、min/max、判別共用体対応）|
| `valibot()` | Valibotスキーマ |
| `yup()` | Yupスキーマ |
| `tanstackQuery()` | TanStack Query v5フック |
| `swr()` | SWRフック |
| `rhf()` | React Hook Formリゾルバー |
| `faker()` | Faker.jsファクトリー |
| `msw()` | Mock Service Workerハンドラー |

## CLI

```bash
apig generate           # コード生成
apig generate --watch   # ウォッチモード
apig generate --dry-run # ファイルを書き込まずプレビュー
apig versions           # スナップショット一覧
apig info               # 生成せずに仕様の統計情報を表示
```

## ドキュメント

- [設定](./config.md)
- [CLI](./cli.md)
- [プラグイン](./plugins/index.md)
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
- [カスタムプラグインの作成](./custom-plugin.md)
- [ApigErrorクライアント](./client.md)
- [キャッシュ](./cache.md)
- [endpointsMap](./endpoints-map.md)

## ライセンス

MIT

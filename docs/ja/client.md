# ApigError クライアント

## `ApigError` クラス

`errorHandling` が有効な場合（デフォルトで `true`）、apig は出力ディレクトリの `config.ts` ファイルに直接 `ApigError` クラスを生成する。これは `@travjek/apig` パッケージからのエクスポート**ではなく** — SDKと一緒に配置される生成コードである。

```ts
// 生成された ./src/api/config.ts
export class ApigError<T = unknown> extends Error {
  status: number
  body: T
  constructor(status: number, body: T) {
    super(`ApigError ${status}`)
    this.name = 'ApigError'
    this.status = status
    this.body = body
  }
}
```

生成されたSDK関数は非2xxレスポンス時にこのクラスをスローする。

### エラーのキャッチ

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // サーバーのレスポンスボディ
  }
}
```

## `@travjek/apig/client`

型安全なガード関数を持つ小さなランタイムライブラリ — 生成された `ApigError` クラスをインポートするのが不便な場合（例えば、出力ディレクトリ外の共通ユーティリティなど）に便利。

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

具体的なクラスをインポートせずに、エラーが生成されたSDKによってスローされたものであることを確認する（`error.name === 'ApigError'` による判定）。

```ts
import { isApigError } from '@travjek/apig/client'

try {
  await getUser('123')
} catch (e) {
  if (isApigError(e)) {
    console.log(e.status)
    console.log(e.body)
  }
}
```

### `isApigStatus(error, status)`

エラーと特定のHTTPステータスを1回の呼び出しでチェックする。

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## カスタムエラークラス

`ApigError` クラスは `defineConfig` を通じて独自のクラスに置き換えることができる。

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

生成された関数は `ApigError` の代わりに `MyCustomError` をスローする。クラスは指定されたパスからインポート可能でなければならない。

## エラーハンドリングの無効化

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

生成された関数はエラーをラップしない — `fetch`/`axios` などがそのまま例外を伝播する。

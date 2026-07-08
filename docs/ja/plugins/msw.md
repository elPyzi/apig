# msw()

OpenAPIオペレーションから [Mock Service Worker](https://mswjs.io) リクエストハンドラーを生成する。

プラグイン配列に `faker()` プラグインが必要 — なければ生成時にエラーをスローする。

## 使用方法

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## 出力例

```ts
import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import { generateUser } from '@/plugins/faker';

export const handlers = [
  http.get('/users', () => {
    return HttpResponse.json([generateUser()]);
  }),
  http.post('/users', async ({ request }) => {
    await request.json();
    return HttpResponse.json(generateUser());
  }),
  http.get('/users/:id', ({ params }) => {
    return HttpResponse.json(generateUser());
  }),
  http.delete('/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

## レスポンス生成のルール

- スキーマ `X` の配列であるレスポンスは `[generate${X}()]` として生成される — リスト用に別の関数（`generateUserList` など）が作られるのは、それが `items`/`total` フィールドを持つ独立した名前付きスキーマである場合のみである。
- レスポンススキーマのないオペレーションとすべての `DELETE` オペレーションは `new HttpResponse(null, { status: 204 })` を返す。
- リクエストボディ（`requestBody`）を持つオペレーションは、値を使用せずに `await request.json()` で読み取る。
- パスパラメーター（`{id}`）は自動的にMSW形式（`:id`）に変換される。

> **既知の特性:** 生成されたfaker関数のインポートは現在 `@/plugins/faker` を指している — これはapigのソースコード内部のエイリアスパスであり、出力ディレクトリ内の相対パスではない。生成された `msw.ts` がこのインポートのためにビルドできない場合、出力ディレクトリ内のfakerファクトリーのファイルを指すように手動でパスを修正する（例: `./faker`）。

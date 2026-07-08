# typescript()

OpenAPIスキーマからTypeScript型を生成する。

`typescript()` はオプションを受け取らない。生成スタイルはグローバルな `defineConfig` オプションで制御される。

## 使用方法

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## typescript() に影響する設定オプション

これらのオプションは `typescript()` ではなく `defineConfig` で指定する:

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface'、デフォルト 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const'、このプラグインのデフォルトは 'const'
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type'（デフォルト）
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const'（typescript() のデフォルト）
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## サポートされるOpenAPI機能

- プリミティブ: `string`、`number`、`boolean`
- 文字列フォーマット: `email`、`uuid`、`uri`、`date-time`
- 配列: `string[]`、`User[]`
- 必須/オプションプロパティを持つオブジェクト
- `nullable: true` → `T | null`
- `allOf` → 交差型 `A & B`
- `oneOf` / `anyOf` → ユニオン型 `A | B`
- `discriminator` を持つ `oneOf` → 判別共用体
- 列挙型 → `enumStyle` で制御
- `$ref` → 名前付き型への参照

## 出力例

```ts
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

export type User = {
  id: string
  email: string
  bio?: string | null
  role?: Role
}
```

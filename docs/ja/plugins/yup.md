# yup()

OpenAPIスキーマから [Yup](https://github.com/jquense/yup) スキーマを生成する。

## 使用方法

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## オプション

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**デフォルト:** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

型の重複を避けるため、別途 `typescript()` を使用する場合は無効にする。

### `schemaSuffix`

**デフォルト:** `'Schema'` — `User` → `UserSchema`

## グローバルオプション `enumStyle`

列挙型の生成スタイルは `yup()` ではなく `defineConfig` で指定する:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const'、yup() のデフォルトは 'union'
  plugins: [yup()],
})
```

## OpenAPI → Yup マッピング

| OpenAPI | Yup |
|---------|-----|
| `string` | `yup.string()` |
| `string` + `format: email` | `yup.string().email()` |
| `string` + `format: uuid` | `yup.string().uuid()` |
| `string` + `format: uri`/`url` | `yup.string().url()` |
| `string` + `minLength/maxLength` | `yup.string().min().max()` |
| `string` + `pattern` | `yup.string().matches(/.../)` |
| `number` + `minimum/maximum` | `yup.number().min().max()` |
| `boolean` | `yup.boolean()` |
| `array` | `yup.array().of(...)`（minItems/maxItemsに対する `.min()`/`.max()` を含む） |
| `enum` | `yup.mixed().oneOf([...]).required()`（`enumStyle` で制御） |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| 必須プロパティ | `.required()` |
| オプションプロパティ | `.optional()` |

`yup` は文字列の `date-time`/`date` フォーマットをサポートしていない — 無視され、通常の `yup.string()` が生成される。

## 出力例

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

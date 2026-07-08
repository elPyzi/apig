# valibot()

OpenAPIスキーマから [Valibot](https://valibot.dev) スキーマを生成する。

## 使用方法

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## オプション

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**デフォルト:** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

型の重複を避けるため、別途 `typescript()` を使用する場合は無効にする。

### `schemaSuffix`

**デフォルト:** `'Schema'` — `User` → `UserSchema`

## グローバルオプション `enumStyle`

列挙型の生成スタイルは `valibot()` ではなく `defineConfig` で指定する:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const'、valibot() のデフォルトは 'union'
  plugins: [valibot()],
})
```

## OpenAPI → Valibot マッピング

| OpenAPI | Valibot |
|---------|---------|
| `string` | `v.string()` |
| `string` + `format: email` | `v.pipe(v.string(), v.email())` |
| `string` + `format: uuid` | `v.pipe(v.string(), v.uuid())` |
| `string` + `format: uri`/`url` | `v.pipe(v.string(), v.url())` |
| `string` + `format: date-time` | `v.pipe(v.string(), v.isoTimestamp())` |
| `string` + `format: date` | `v.pipe(v.string(), v.isoDate())` |
| `string` + `minLength/maxLength` | `v.pipe(v.string(), v.minLength(), v.maxLength())` |
| `string` + `pattern` | `v.pipe(v.string(), v.regex(/.../))` |
| `number` + `minimum/maximum` | `v.pipe(v.number(), v.minValue(), v.maxValue())` |
| `enum` | `v.picklist([...])`（`enumStyle` で制御） |
| `allOf` | `v.intersect([...])` |
| discriminatorを持つ `oneOf`/`anyOf` | `v.variant('key', [...])` |
| discriminatorを持たない `oneOf`/`anyOf` | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| オプションプロパティ | `v.optional(...)` |

## 出力例

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

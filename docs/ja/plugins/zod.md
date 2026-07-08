# zod()

OpenAPIスキーマから [Zod](https://zod.dev) スキーマを生成する。

## 使用方法

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## オプション

```ts
zod({
  withTypes: true,        // スキーマと一緒に型をエクスポート
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // validateXResponse() を生成
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**デフォルト:** `true`

`infer`/`input`/`output` も有効な場合、型のエクスポートを有効にする。型の重複を避けるため、別途 `typescript()` を使用する場合は無効にする。

### `infer`

**デフォルト:** `false`

`true` の場合、スキーマ名で `z.infer<typeof Schema>` をエクスポートする。別途 `typescript()` プラグインが不要になる。

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**デフォルト:** `false`

`z.input<>`/`z.output<>` をエクスポートする — スキーマで `.transform()` を使用している場合にのみ意味がある。

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**デフォルト:** `false`

`true` の場合、各スキーマに対してレスポンスバリデーション関数を生成する:

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**デフォルト:** `'Schema'` — `User` → `UserSchema`

## グローバルオプション `enumStyle`

列挙型の生成スタイルは `zod()` ではなく `defineConfig` で指定する:

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const'、zod() のデフォルトは 'union'
  plugins: [zod()],
})
```

## OpenAPI → Zod マッピング

| OpenAPI | Zod |
|---------|-----|
| `string` | `z.string()` |
| `string` + `format: email` | `z.string().email()` |
| `string` + `format: uuid` | `z.string().uuid()` |
| `string` + `format: uri`/`url` | `z.string().url()` |
| `string` + `format: date-time` | `z.string().datetime()` |
| `string` + `format: date` | `z.string().date()` |
| `string` + `minLength/maxLength` | `z.string().min().max()` |
| `string` + `pattern` | `z.string().regex(/.../)` |
| `number` + `minimum/maximum` | `z.number().min().max()` |
| `boolean` | `z.boolean()` |
| `array` | `z.array(...)` |
| `object` | `z.object({ ... })` |
| `enum` | `z.enum([...])`（`enumStyle` で制御） |
| `allOf` | `.and(...)` |
| discriminatorを持つ `oneOf`/`anyOf` | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| オプションプロパティ | `.optional()` |

## 出力例

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

`zod({ infer: true })` の場合:

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

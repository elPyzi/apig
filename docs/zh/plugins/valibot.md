# valibot()

从 OpenAPI 模式生成 [Valibot](https://valibot.dev) 模式。

## 用法

```ts
import { defineConfig, valibot } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [valibot()],
})
```

## 选项

```ts
valibot({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**默认值：** `true`

```ts
export const UserSchema = v.object({ ... })
export type User = v.InferOutput<typeof UserSchema>
```

如果你单独使用 `typescript()`，可以关闭它以避免类型重复。

### `schemaSuffix`

**默认值：** `'Schema'` — `User` → `UserSchema`

## 全局选项 `enumStyle`

枚举的生成风格在 `defineConfig` 中设置，而不是在 `valibot()` 中：

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const'，valibot() 默认 'union'
  plugins: [valibot()],
})
```

## OpenAPI → Valibot 映射

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
| `enum` | `v.picklist([...])`（由 `enumStyle` 控制） |
| `allOf` | `v.intersect([...])` |
| `oneOf`/`anyOf` 带 discriminator | `v.variant('key', [...])` |
| `oneOf`/`anyOf` 不带 discriminator | `v.union([...])` |
| `nullable: true` | `v.nullable(...)` |
| 可选属性 | `v.optional(...)` |

## 输出示例

```ts
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  bio: v.optional(v.nullable(v.string())),
})
export type User = v.InferOutput<typeof UserSchema>
```

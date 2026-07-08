# yup()

从 OpenAPI 模式生成 [Yup](https://github.com/jquense/yup) 模式。

## 用法

```ts
import { defineConfig, yup } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [yup()],
})
```

## 选项

```ts
yup({
  withTypes: true,
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**默认值：** `true`

```ts
export const UserSchema = yup.object({ ... })
export type User = yup.InferType<typeof UserSchema>
```

如果你单独使用 `typescript()`，可以关闭它以避免类型重复。

### `schemaSuffix`

**默认值：** `'Schema'` — `User` → `UserSchema`

## 全局选项 `enumStyle`

枚举的生成风格在 `defineConfig` 中设置，而不是在 `yup()` 中：

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const'，yup() 默认 'union'
  plugins: [yup()],
})
```

## OpenAPI → Yup 映射

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
| `array` | `yup.array().of(...)`（加上 `.min()`/`.max()` 对应 minItems/maxItems） |
| `enum` | `yup.mixed().oneOf([...]).required()`（由 `enumStyle` 控制） |
| `allOf` | `.concat(...)` |
| `oneOf`/`anyOf` | `yup.mixed().oneOf([...])` |
| `nullable: true` | `.nullable()` |
| 必需属性 | `.required()` |
| 可选属性 | `.optional()` |

`yup` 不支持字符串的 `date-time`/`date` 格式——它会被忽略，生成普通的 `yup.string()`。

## 输出示例

```ts
export const UserSchema = yup.object({
  id: yup.string().uuid().required(),
  email: yup.string().email().required(),
  bio: yup.string().nullable().optional(),
})
export type User = yup.InferType<typeof UserSchema>
```

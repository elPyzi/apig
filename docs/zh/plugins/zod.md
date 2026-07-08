# zod()

从 OpenAPI 模式生成 [Zod](https://zod.dev) 模式。

## 用法

```ts
import { defineConfig, zod } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [zod()],
})
```

## 选项

```ts
zod({
  withTypes: true,        // 随模式一起导出类型
  infer: false,            // export type X = z.infer<typeof XSchema>
  input: false,             // export type XInput = z.input<typeof XSchema>
  output: false,            // export type XOutput = z.output<typeof XSchema>
  validateResponse: false, // 生成 validateXResponse()
  schemaSuffix: 'Schema',
})
```

### `withTypes`

**默认值：** `true`

如果同时启用了 `infer`/`input`/`output`，则会启用类型导出。如果你单独使用 `typescript()`，可以关闭它以避免类型重复。

### `infer`

**默认值：** `false`

为 `true` 时，以模式名称导出 `z.infer<typeof Schema>`。这样就无需单独使用 `typescript()` 插件。

```ts
export type User = z.infer<typeof UserSchema>
```

### `input` / `output`

**默认值：** `false`

导出 `z.input<>`/`z.output<>`——只有在模式中使用了 `.transform()` 时才有意义。

```ts
export type UserInput = z.input<typeof UserSchema>
export type UserOutput = z.output<typeof UserSchema>
```

### `validateResponse`

**默认值：** `false`

为 `true` 时，为每个模式生成一个响应校验函数：

```ts
export const validateUserResponse = (data: unknown): User =>
  UserSchema.parse(data)
```

### `schemaSuffix`

**默认值：** `'Schema'` — `User` → `UserSchema`

## 全局选项 `enumStyle`

枚举的生成风格在 `defineConfig` 中设置，而不是在 `zod()` 中：

```ts
defineConfig({
  enumStyle: 'union', // 'union' | 'enum' | 'const'，zod() 默认 'union'
  plugins: [zod()],
})
```

## OpenAPI → Zod 映射

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
| `enum` | `z.enum([...])`（由 `enumStyle` 控制） |
| `allOf` | `.and(...)` |
| `oneOf`/`anyOf` 带 discriminator | `z.discriminatedUnion(...)` |
| `nullable: true` | `.nullable()` |
| 可选属性 | `.optional()` |

## 输出示例

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  tags: z.array(z.string()),
})
```

使用 `zod({ infer: true })` 时：

```ts
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>
```

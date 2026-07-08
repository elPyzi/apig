# typescript()

从 OpenAPI 模式生成 TypeScript 类型。

`typescript()` 不接受任何选项。生成风格由 `defineConfig` 的全局选项控制。

## 用法

```ts
import { defineConfig, typescript } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript()],
})
```

## 影响 typescript() 的配置选项

以下选项在 `defineConfig` 中设置，而不是在 `typescript()` 中：

```ts
defineConfig({
  typeStyle: 'type',   // 'type' | 'interface'，默认 'type'
  enumStyle: 'const',  // 'union' | 'enum' | 'const'，该插件默认 'const'
  plugins: [typescript()],
})
```

### `typeStyle`

```ts
// 'type'（默认）
export type User = { id: string; email: string }

// 'interface'
export interface User { id: string; email: string }
```

### `enumStyle`

```ts
// 'const'（typescript() 的默认值）
export const Role = { Admin: 'admin', User: 'user' } as const
export type Role = typeof Role[keyof typeof Role]

// 'union'
export type Role = 'admin' | 'user'

// 'enum'
export enum Role { Admin = 'admin', User = 'user' }
```

## 支持的 OpenAPI 特性

- 原始类型：`string`、`number`、`boolean`
- 字符串格式：`email`、`uuid`、`uri`、`date-time`
- 数组：`string[]`、`User[]`
- 具有必需/可选属性的对象
- `nullable: true` → `T | null`
- `allOf` → 交叉类型 `A & B`
- `oneOf` / `anyOf` → 联合类型 `A | B`
- 带有 `discriminator` 的 `oneOf` → 判别联合
- 枚举 → 由 `enumStyle` 控制
- `$ref` → 引用命名类型

## 输出示例

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

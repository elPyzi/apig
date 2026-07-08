# 配置

`apig.config.ts` 是所有配置的入口点。导出单个配置或配置数组。

```ts
import { defineConfig } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [],
})
```

多个配置（例如同一个项目中对应不同的 API）：

```ts
export default [
  defineConfig({ input: './users-api.json', output: './src/users' }),
  defineConfig({ input: './orders-api.json', output: './src/orders' }),
]
```

## 选项

### `name`

**类型：** `string`

该配置的标签，在使用多个配置时会在 CLI 输出中显示。

```ts
name: 'users-api'
```

---

### `input`

**类型：** `string | (() => Promise<string>)`
**必填：** 是

OpenAPI 规范的路径、URL，或返回路径/URL 的异步函数。支持 OpenAPI 3.0 和 Swagger 2.0（自动升级）。

```ts
input: './openapi.json'
input: 'https://api.example.com/openapi.json'
input: () => fetch('https://api.example.com/openapi.json').then(r => r.json())
```

---

### `output`

**类型：** `string | { path: string; clean?: boolean }`
**默认值：** `.apig/generated`

生成文件的写入目录。传入字符串时，`clean` 默认是 `true`（生成前清空目录）。

```ts
output: './src/api'
output: { path: './src/api', clean: false }
```

---

### `httpClient`

**类型：** `{ name: 'fetch' | 'axios' | 'ky' | 'ofetch' | 'wretch'; path?: string; export?: string }`
**默认值：** `{ name: 'fetch' }`

`sdk()` 生成的函数中使用的 HTTP 客户端。对于 `axios`、`ky`、`ofetch`、`wretch`，必须提供 `path` 和 `export`——分别指向你的客户端实例所在的文件路径和具名导出。`fetch` 则不需要这两项。

```ts
httpClient: { name: 'axios', path: './lib/axios', export: 'axiosInstance' }
```

---

### `plugins`

**类型：** `ApigPlugin[]`

插件数组。完整列表请参阅[插件](./plugins/index.md)。

---

### `baseUrl`

**类型：** `string`

添加到所有请求路径前的前缀。

```ts
baseUrl: '/api/v1'
baseUrl: 'https://api.example.com'
```

---

### `groupBy`

**类型：** `'none' | 'tags' | 'endpoints' | 'operations'`
**默认值：** `'none'`

控制生成文件的拆分方式：

- `none` — 所有输出都放在 `output` 目录下，不使用子目录（`sdk.ts`、`types.ts` 等）
- `tags` — 每个 OpenAPI 标签一个子目录（`users/users.sdk.ts`）
- `endpoints` — 每个标签一个子目录，其内部再按每个操作划分子目录（`users/get-user/get-user.sdk.ts`）
- `operations` — 每个操作一个子目录，不按标签分组（`get-user/get-user.sdk.ts`）

---

### `fileNaming`

**类型：** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`
**默认值：** `'kebab-case'`

生成文件和目录的命名约定（当 `groupBy` 不为 `none` 时生效）。

---

### `functionNaming`

**类型：** `'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase'`
**默认值：** `'camelCase'`

生成的 SDK 函数的命名约定。

---

### `enumStyle`

**类型：** `'union' | 'enum' | 'const'`

控制所有插件（`typescript`、`zod`、`valibot`、`yup`）中枚举的生成方式。这是 `defineConfig` 的全局选项，而不是某个插件单独的选项。

- `union` — `type Status = 'active' | 'inactive'`
- `enum` — `enum Status { Active = 'active' }`
- `const` — `const Status = { Active: 'active' } as const`

如果未显式指定 `enumStyle`，`typescript()` 插件默认使用 `'const'`，而 `zod()`/`valibot()`/`yup()` 默认使用 `'union'`。

---

### `typeStyle`

**类型：** `'type' | 'interface'`
**默认值：** `'type'`

`typescript()` 中对象模式的类型声明风格。这是 `defineConfig` 的全局选项。

- `type` — `export type User = { ... }`
- `interface` — `export interface User { ... }`

---

### `filter`

**类型：** `{ tags?: string[], exclude?: string[], deprecated?: boolean }`

包含或排除操作：

```ts
filter: {
  tags: ['users', 'orders'], // 只生成这些标签
  exclude: ['internal'],     // 排除这些标签
  deprecated: false,         // 是否包含已废弃的操作（默认 false）
}
```

---

### `rename`

**类型：** `Record<string, string>`

在生成之前重命名 `operationId`：

```ts
rename: {
  get_users_list: 'getUsers',
  create_user_v2: 'createUser',
}
```

---

### `validate`

**类型：** `boolean`

> **已知问题：** 目前除了配置校验时的类型检查外，这个字段在代码生成中完全没有被读取——它不会影响任何实际行为。不要依赖它。

---

### `endpointsMap`

**类型：** `boolean`
**默认值：** `false`

生成 `endpoints.ts` 文件，其中包含所有 API 路径的类型化常量。参阅 [endpointsMap](./endpoints-map.md)。

---

### `index`

**类型：** `boolean`
**默认值：** `true`

控制是否生成 `index.ts`，重新导出所有生成的文件。

---

### `formatter`

**类型：** `'prettier' | 'biome' | 'oxfmt' | 'none'`
**默认值：** `'none'`

写入后对生成文件进行格式化。

---

### `cache`

**类型：** `boolean`
**默认值：** `false`

将已解析的 IR 缓存到磁盘（`.apig/cache`）。在规范未发生变化的情况下（URL 使用 ETag，本地文件使用哈希），后续运行会跳过解析。参阅[缓存](./cache.md)。

---

### `apiLogging`

**类型：** `boolean`
**默认值：** `false`

在每个生成的 SDK 函数中添加 `console.log(functionName, response)`。

---

### `cliLogging`

**类型：** `{ level?: 'minimal' | 'normal' | 'detailed' }`
**默认值：** `{ level: 'minimal' }`

生成过程中 CLI 日志的详细程度。

---

### `errorHandling`

**类型：** `boolean | { path: string; export: string }`
**默认值：** `true`

SDK 函数中的错误处理方式：

- `true`（默认）— 在输出目录的 `config.ts` 文件中生成内置的 `ApigError` 类
- `false` — 完全禁用错误处理
- `{ path, export }` — 使用你在指定路径提供的自定义错误类

```ts
errorHandling: { path: './lib/errors', export: 'ApiError' }
```

参阅 [ApigError 客户端](./client.md)。

---

### `rawResponse`

**类型：** `boolean`
**默认值：** `false`

返回完整的响应对象 `{ body, status, headers }`，而不仅仅是数据。

---

### `hooks`

**类型：** `{ afterAllFilesWrite?: string }`

所有文件写入完成后执行的 Shell 命令：

```ts
hooks: {
  afterAllFilesWrite: 'eslint ./src/api --fix',
}
```

---

### `comment`

**类型：** `string`

附加到下一次生成对应的版本快照上的备注。

```ts
comment: 'before auth refactor'
```

---

## 版本控制

**类型：** `Versioning`

```ts
versioning: {
  enabled: true,
  storage: '.apig/versions',
  maxSaves: 10,
  saveSpec: true,
  pinVersions: ['abc123'],
  aliasTemplate: 'v{apiVersion}-gen{generation}',
}
```

| 字段 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enabled` | `boolean` | `false` | 启用快照版本控制 |
| `storage` | `string` | `.apig/versions` | 快照存储目录 |
| `saveSpec` | `boolean` | `false` | 在每个快照中保存原始 OpenAPI 规范 |
| `maxSaves` | `number` | 无限制 | 保留的最大快照数量；旧快照优先删除 |
| `pinVersions` | `string[]` | — | 永不自动删除的快照 ID |
| `aliasTemplate` | `string` | `gen{generation}` | 快照别名模板 |

可用的模板变量：`{generation}`、`{apiVersion}`、`{date}`。

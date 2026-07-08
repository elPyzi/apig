# 创建自定义插件

插件是 apig 的核心扩展点。每个内置生成器（`typescript`、`sdk`、`zod` 等）本身就是一个实现了 `ApigPlugin` 接口的插件。

## `ApigPlugin` 接口

```ts
import type { ApigPlugin } from '@travjek/apig'

export interface ApigPlugin {
  /** 插件的唯一名称——用于去重和检查。 */
  name: string;
  /** 输出文件的基础名称，不含扩展名（"sdk" → "sdk.ts"）。 */
  fileName: string;
  /**
   * "root"       — 针对整个 IR 调用一次（types、zod、faker、msw 等）
   * "operations" — 当 groupBy=tags/endpoints 时，针对每个分组调用一次（sdk、tanstack、swr）
   */
  scope: 'root' | 'operations';
  generate: (ir: IR, config: ApigConfig, ctx?: PluginContext) => PluginResult;
  /** 可选：在所有分组写入完成后，携带完整 IR 调用一次。 */
  generateRootFiles?: (ir: IR, config: ApigConfig) => ExtraFile[];
  /** 当作为校验插件工作时，是否抑制 typescript()。默认 true。 */
  withTypes?: boolean;
}
```

## `PluginResult`

`generate()` 返回的结果：

```ts
interface PluginResult {
  code: string;         // 文件内容
  exports: string[];     // 具名导出（用于构建 index.ts）
  typeExports: string[]; // 仅类型导出
}
```

## 最小示例

```ts
import type { ApigPlugin } from '@travjek/apig'

export const myPlugin = (): ApigPlugin => ({
  name: 'my-plugin',
  fileName: 'my-output',
  scope: 'root',
  generate(ir) {
    const lines = ir.operations.map(
      (op) => `// ${op.method.toUpperCase()} ${op.path} → ${op.id}`
    )

    return {
      code: lines.join('\n'),
      exports: [],
      typeExports: [],
    }
  },
})
```

在配置中使用：

```ts
import { defineConfig } from '@travjek/apig'
import { myPlugin } from './my-plugin'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [myPlugin()],
})
```

## IR（中间表示）

```ts
interface IR {
  operations: IROperation[]
  schemas: IRSchema[]
}

interface IROperation {
  id: string           // operationId（如果指定了 rename，则是重命名后的）
  method: string        // 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string           // '/users/{id}'
  tag: string
  params: { path: IRParam[]; query: IRParam[] }
  body?: { schema: IRSchema; required: boolean; contentType: string }
  response?: IRSchema
  errors?: { status: string; schema: IRSchema }[]
}
```

## 检查其他插件是否存在

```ts
generate(ir, config) {
  const hasFaker = (config.plugins ?? []).some((p) => p.name === 'faker')
  if (!hasFaker) throw new Error('my-plugin 需要 faker() 插件')
  // ...
}
```

内置插件 `msw()` 就是这样做的——如果 `plugins` 中没有 `faker()`，它会抛出异常。

## `scope: 'operations'` 与 `PluginContext`

`scope: 'operations'` 的插件（如 `sdk`、`tanstackQuery`、`swr`）在 `groupBy: 'tags'` 或 `'endpoints'` 时会对每个分组重复调用。`generate` 会收到一个 `ctx` 参数，里面包含应当使用的导入路径，而不是硬编码：

```ts
generate: (ir, config, ctx) => {
  const sdkImport = ctx?.sdkImportPath ?? './sdk' // 会根据 groupBy 变化
  // ...
}
```

## `generateRootFiles` —— 共享文件

如果插件需要一次性生成一个所有分组共享的文件（例如 `query-keys.ts`），使用 `generateRootFiles`：

```ts
generateRootFiles: (ir, config) => [
  { fileName: 'my-shared-file.ts', code: '/* ... */' },
],
```

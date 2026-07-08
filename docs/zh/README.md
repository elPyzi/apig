# @travjek/apig

一个强大、对开发者友好的 OpenAPI 代码生成器，让 API 集成不再痛苦，让你的每一天都更加愉快。

## 安装

```bash
npm install -D @travjek/apig
```

## 快速开始

```ts
// apig.config.ts
import { defineConfig, typescript, sdk, zod, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    typescript(),
    sdk(),
    zod({ withTypes: true }),
    tanstackQuery(),
  ],
})
```

```bash
npx apig generate
```

## 插件

| 插件 | 描述 |
|------|------|
| `typescript()` | 从 OpenAPI 模式生成 TypeScript 类型 |
| `sdk()` | 类型化请求函数（`fetch`, `axios`, `ky`, `ofetch`, `wretch`）|
| `zod()` | Zod 模式，支持 email、uuid、min/max、判别联合 |
| `valibot()` | Valibot 模式 |
| `yup()` | Yup 模式 |
| `tanstackQuery()` | TanStack Query v5 钩子 |
| `swr()` | SWR 钩子 |
| `rhf()` | React Hook Form 解析器 |
| `faker()` | Faker.js 工厂函数 |
| `msw()` | Mock Service Worker 处理程序 |

## CLI

```bash
apig generate           # 生成代码
apig generate --watch   # 监听模式
apig generate --dry-run # 预览（不写入文件）
apig versions           # 列出已保存的快照
apig info               # 显示规范统计信息（不生成代码）
```

## 文档

- [配置](./config.md)
- [CLI](./cli.md)
- [插件](./plugins/index.md)
  - [typescript()](./plugins/typescript.md)
  - [sdk()](./plugins/sdk.md)
  - [zod()](./plugins/zod.md)
  - [valibot()](./plugins/valibot.md)
  - [yup()](./plugins/yup.md)
  - [tanstackQuery()](./plugins/tanstack-query.md)
  - [swr()](./plugins/swr.md)
  - [rhf()](./plugins/rhf.md)
  - [faker()](./plugins/faker.md)
  - [msw()](./plugins/msw.md)
- [创建自定义插件](./custom-plugin.md)
- [ApigError 客户端](./client.md)
- [缓存](./cache.md)
- [endpointsMap](./endpoints-map.md)

## 许可证

MIT

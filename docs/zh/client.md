# ApigError 客户端

## `ApigError` 类

当 `errorHandling` 启用时（默认 `true`），apig 会直接在输出目录中生成 `ApigError` 类——写入 `config.ts` 文件。这**不是**从 `@travjek/apig` 包导出的内容——而是与你的 SDK 放在一起的生成代码。

```ts
// 生成的 ./src/api/config.ts
export class ApigError<T = unknown> extends Error {
  status: number
  body: T
  constructor(status: number, body: T) {
    super(`ApigError ${status}`)
    this.name = 'ApigError'
    this.status = status
    this.body = body
  }
}
```

生成的 SDK 函数会在非 2xx 响应时抛出该类的实例。

### 捕获错误

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // 服务器响应体
  }
}
```

## `@travjek/apig/client`

一个小型运行时库，提供类型安全的守卫函数——当直接导入生成的 `ApigError` 类不方便时（例如在输出目录之外的共享工具函数中）很有用。

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

检查某个错误是否由生成的 SDK 抛出（基于 `error.name === 'ApigError'`），无需导入具体的类：

```ts
import { isApigError } from '@travjek/apig/client'

try {
  await getUser('123')
} catch (e) {
  if (isApigError(e)) {
    console.log(e.status)
    console.log(e.body)
  }
}
```

### `isApigStatus(error, status)`

一次调用中同时检查错误类型和具体的 HTTP 状态码：

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## 自定义错误类

可以通过 `defineConfig` 将 `ApigError` 类替换为你自己的类：

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

生成的函数将抛出 `MyCustomError` 而不是 `ApigError`。该类必须可从指定路径导入。

## 禁用错误处理

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

生成的函数将不再包装错误——`fetch`/`axios` 等会按原样抛出异常。

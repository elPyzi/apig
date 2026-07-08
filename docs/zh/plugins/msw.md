# msw()

从 OpenAPI 操作生成 [Mock Service Worker](https://mswjs.io) 请求处理程序。

需要插件数组中包含 `faker()` 插件——否则会在生成时抛出错误。

## 用法

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## 输出示例

```ts
import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import { generateUser } from '@/plugins/faker';

export const handlers = [
  http.get('/users', () => {
    return HttpResponse.json([generateUser()]);
  }),
  http.post('/users', async ({ request }) => {
    await request.json();
    return HttpResponse.json(generateUser());
  }),
  http.get('/users/:id', ({ params }) => {
    return HttpResponse.json(generateUser());
  }),
  http.delete('/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

## 响应生成规则

- 响应为模式 `X` 数组时，生成为 `[generate${X}()]`——不会为列表单独创建函数（如 `generateUserList` 等），除非它本身是带有 `items`/`total` 字段的独立命名模式。
- 没有响应模式的操作，以及所有 `DELETE` 操作，都返回 `new HttpResponse(null, { status: 204 })`。
- 带有请求体（`requestBody`）的操作会通过 `await request.json()` 读取请求体，但不使用其值。
- 路径参数（`{id}`）会自动转换为 MSW 格式（`:id`）。

> **已知问题：** 目前生成的 faker 函数导入路径指向 `@/plugins/faker`——这是 apig 源码内部的别名路径，而不是你输出目录内的相对路径。如果生成的 `msw.ts` 因为这个导入而无法编译，请手动将路径改为你输出目录中存放 faker 工厂函数的文件（例如 `./faker`）。

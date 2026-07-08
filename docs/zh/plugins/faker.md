# faker()

为所有对象模式和枚举生成 [Faker.js](https://fakerjs.dev) 工厂函数。

`faker()` 不接受任何选项。

## 用法

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## 字段值的确定方式

针对每个属性，规则按以下顺序应用：

1. 如果属性类型是对另一个模式的引用（`$ref`）——调用该模式的工厂函数：`generate${Schema}()`
2. 如果类型是枚举——使用枚举值调用 `faker.helpers.arrayElement([...])`
3. 如果类型是对象/引用组成的数组——`faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. 如果类型是原始类型组成的数组——`faker.helpers.multiple(() => <原始值>, { count: 3 })`
5. 否则——按字段名启发式规则处理（见下表）

## 基于字段名的语义启发式规则

对字段名进行**精确匹配**或**子串匹配**检查（不区分大小写）：

| 字段名 | Faker 方法 |
|--------|-------------|
| 精确为 `username` 或包含 `username` | `faker.internet.username()` |
| 包含 `email` | `faker.internet.email()` |
| 包含 `password` | `faker.internet.password()` |
| 包含 `phone` | `faker.phone.number()` |
| 包含 `url` 或 `photo` | `faker.internet.url()` |
| 精确为 `firstName`/`first_name` | `faker.person.firstName()` |
| 精确为 `lastName`/`last_name` | `faker.person.lastName()` |
| 包含 `name`（firstName/lastName 除外） | `faker.person.fullName()` |
| 包含 `date` | `faker.date.past().toISOString()` |
| 包含 `status` | 如果字段类型是数字，则为 `faker.number.int()`，否则为 `faker.lorem.word()` |
| 包含 `id` | `faker.number.int()` |
| 以上都不匹配 | 按模式类型：`string` → `faker.lorem.word()`，`number`/`integer` → `faker.number.int()`，`boolean` → `faker.datatype.boolean()` |

这些检查按从上到下的顺序执行——第一个匹配项生效。例如，字段 `emailVerified` 会匹配 `email`，而不是其他规则。

诸如 `uuid`、`avatar`、`image`、`title`、`description`、`bio`、`price`、`city`、`country`、`address`、`zip` 这样的字段——**不在**启发式规则列表中，会使用默认类型（字符串对应 `faker.lorem.word()`）。

## 输出示例

```ts
export const generateUser = (): User => ({
  id: faker.number.int(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  bio: faker.lorem.word(),
  role: faker.helpers.arrayElement(['admin', 'user']),
  tags: faker.helpers.multiple(() => faker.lorem.word(), { count: 3 }),
})
```

其他工厂函数内部所引用模式的数组，是通过嵌套调用生成的，而不是单独的函数：

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

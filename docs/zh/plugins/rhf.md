# rhf()

生成 [React Hook Form](https://react-hook-form.com) 解析器——**每个模式一个**，而不是每个表单/操作一个。

需要插件数组中包含 `zod()`、`valibot()` 或 `yup()` 三者之一，并且 `schemaSuffix` 保持一致。

## 用法

```ts
import { defineConfig, zod, rhf } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    zod(),
    rhf({ resolver: 'zod' }),
  ],
})
```

## 选项

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' —— 必填
  schemaSuffix: 'Schema',        // 必须与校验插件的 schemaSuffix 一致
  schemasImportPath: './zod',    // 默认 './<resolver>'
})
```

### `resolver`

**必填。** 用于生成解析器的校验库。必须与已启用的插件之一（`zod()`、`valibot()`、`yup()`）保持一致。

### `schemaSuffix`

**默认值：** `'Schema'`

必须与校验插件中指定的 `schemaSuffix` 一致——`rhf()` 依据它找到模式的名称（`UserSchema`、`CreateUserInputSchema` 等）。

### `schemasImportPath`

**默认值：** `'./<resolver>'`（例如 `'./zod'`）

如果模式文件的导入路径与默认值不同，可通过此项指定。

## 解析器命名规则

对于每个名为 `X` 的模式，会生成解析器 `${camelCase(X)}Resolver`：

| 模式 | 解析器 |
|------|--------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## 输出示例

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

在组件中使用：

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

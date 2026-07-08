# rhf()

[React Hook Form](https://react-hook-form.com) リゾルバーを生成する — フォーム/オペレーションごとに1つではなく、OpenAPIの**スキーマごとに1つ**。

プラグイン配列に `zod()`、`valibot()`、`yup()` のいずれかが、同じ `schemaSuffix` で存在する必要がある。

## 使用方法

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

## オプション

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — 必須
  schemaSuffix: 'Schema',        // バリデーションプラグインの schemaSuffix と一致させる
  schemasImportPath: './zod',    // デフォルトは './<resolver>'
})
```

### `resolver`

**必須。** リゾルバーを生成する対象のバリデーションライブラリ。接続されているプラグイン（`zod()`、`valibot()`、`yup()`）のいずれかと一致する必要がある。

### `schemaSuffix`

**デフォルト:** `'Schema'`

バリデーションプラグインで指定した `schemaSuffix` と一致させる必要がある — これによって `rhf()` はスキーマ名（`UserSchema`、`CreateUserInputSchema`、...）を見つける。

### `schemasImportPath`

**デフォルト:** `'./<resolver>'`（例: `'./zod'`）

標準と異なる場合の、スキーマファイルのインポートパス。

## リゾルバーの命名

名前が `X` の各スキーマに対して、リゾルバー `${camelCase(X)}Resolver` が生成される:

| スキーマ | リゾルバー |
|-------|----------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## 出力例

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

コンポーネントでの使用:

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

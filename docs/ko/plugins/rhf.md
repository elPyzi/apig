# rhf()

[React Hook Form](https://react-hook-form.com) 리졸버를 생성합니다 — 폼/작업당 하나가 아니라, OpenAPI의 **각 스키마마다 하나씩** 생성합니다.

플러그인 배열에 `zod()`, `valibot()`, `yup()` 중 하나가 있어야 하며, 동일한 `schemaSuffix`를 사용해야 합니다.

## 사용법

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

## 옵션

```ts
rhf({
  resolver: 'zod',              // 'zod' | 'valibot' | 'yup' — 필수
  schemaSuffix: 'Schema',        // 유효성 검사 플러그인의 schemaSuffix와 일치해야 함
  schemasImportPath: './zod',    // 기본값 './<resolver>'
})
```

### `resolver`

**필수.** 리졸버를 생성할 유효성 검사 라이브러리. 연결된 플러그인 중 하나(`zod()`, `valibot()`, `yup()`)와 일치해야 합니다.

### `schemaSuffix`

**기본값:** `'Schema'`

유효성 검사 플러그인에 지정된 `schemaSuffix`와 일치해야 합니다 — 이 값을 기준으로 `rhf()`가 스키마 이름(`UserSchema`, `CreateUserInputSchema`, ...)을 찾습니다.

### `schemasImportPath`

**기본값:** `'./<resolver>'` (예: `'./zod'`)

기본 경로와 다른 경우 스키마 파일의 import 경로.

## 리졸버 이름 규칙

이름이 `X`인 각 스키마마다 `${camelCase(X)}Resolver` 리졸버가 생성됩니다:

| 스키마 | 리졸버 |
|-------|--------|
| `User` | `userResolver` |
| `CreateUserInput` | `createUserInputResolver` |

## 출력 예시

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, CreateUserInputSchema } from './zod'

export const userResolver = zodResolver(UserSchema)
export const createUserInputResolver = zodResolver(CreateUserInputSchema)
```

컴포넌트에서 사용:

```ts
import { useForm } from 'react-hook-form'
import { createUserInputResolver } from './api/rhf'
import type { CreateUserInput } from './api/types'

const { register, handleSubmit } = useForm<CreateUserInput>({
  resolver: createUserInputResolver,
})
```

# ApigError 클라이언트

## `ApigError` 클래스

`errorHandling`이 활성화되어 있으면(기본값 `true`), apig는 출력 디렉터리 안에 — `config.ts` 파일에 — `ApigError` 클래스를 직접 생성합니다. 이것은 `@travjek/apig` 패키지에서 가져오는 export가 **아니며**, SDK 옆에 놓이는 생성된 코드입니다.

```ts
// 생성된 ./src/api/config.ts
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

생성된 SDK 함수는 비 2xx 응답에서 이 클래스를 throw합니다.

### 오류 포착

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // 서버 응답 본문
  }
}
```

## `@travjek/apig/client`

타입이 안전한 가드 함수를 제공하는 작은 런타임 라이브러리입니다 — 생성된 `ApigError` 클래스를 가져오기 불편한 경우(예: 출력 디렉터리 밖의 공용 유틸리티)에 유용합니다.

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

구체적인 클래스를 가져오지 않고도 오류가 생성된 SDK에서 throw되었는지 확인합니다(`error.name === 'ApigError'` 기준):

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

한 번의 호출로 오류와 특정 HTTP 상태를 함께 확인합니다:

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## 사용자 지정 오류 클래스

`ApigError` 클래스는 `defineConfig`를 통해 자체 클래스로 교체할 수 있습니다:

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

생성된 함수는 `ApigError` 대신 `MyCustomError`를 throw합니다. 해당 클래스는 지정된 경로에서 가져올 수 있어야 합니다.

## 오류 처리 비활성화

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

생성된 함수는 오류를 감싸지 않습니다 — `fetch`/`axios` 등이 예외를 그대로 전파합니다.

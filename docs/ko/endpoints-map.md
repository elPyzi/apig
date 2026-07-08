# endpointsMap

`endpointsMap: true`이면 apig는 각 작업에 대한 타입이 지정된 경로 상수가 담긴 `endpoints.ts` 파일을 생성합니다.

## 설정

```ts
defineConfig({
  input: './openapi.json',
  output: './src/api',
  endpointsMap: true,
  plugins: [typescript(), sdk()],
})
```

## 출력 예시

```ts
// endpoints.ts
export const ENDPOINTS = {
  getUsers: '/users',
  createUser: '/users',
  getUserById: '/users/{id}',
  updateUser: '/users/{id}',
  deleteUser: '/users/{id}',
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
```

경로는 OpenAPI 원본 형식(`{id}`) 그대로 유지되며, Express/MSW 형식(`:id`)으로 변환되지 않습니다.

## 사용법

```ts
import { ENDPOINTS } from './api/endpoints'

console.log(ENDPOINTS.getUsers) // '/users'

const key: EndpointKey = 'getUsers'
```

로깅, 분석, 권한 확인 등 문자열을 하드코딩하지 않고 API 경로를 참조해야 하는 모든 곳에 유용합니다.

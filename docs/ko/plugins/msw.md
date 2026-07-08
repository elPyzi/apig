# msw()

OpenAPI 작업에서 [Mock Service Worker](https://mswjs.io) 요청 핸들러를 생성합니다.

플러그인 배열에 `faker()` 플러그인이 있어야 합니다 — 없으면 생성 시 오류를 던집니다.

## 사용법

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## 출력 예시

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

## 응답 생성 규칙

- 스키마 `X`의 배열인 응답은 `[generate${X}()]`로 생성됩니다 — `items`/`total` 필드를 가진 별도의 명명된 스키마가 아닌 이상, 목록을 위한 별도 함수는 생성되지 않습니다.
- 응답 스키마가 없는 작업과 모든 `DELETE` 작업은 `new HttpResponse(null, { status: 204 })`를 반환합니다.
- 요청 본문(`requestBody`)이 있는 작업은 `await request.json()`으로 읽지만 그 값을 사용하지는 않습니다.
- 경로 매개변수(`{id}`)는 자동으로 MSW 형식(`:id`)으로 변환됩니다.

> **알려진 특이사항:** 생성된 faker 함수 import는 현재 `@/plugins/faker`를 가리킵니다 — 이는 apig 소스 코드 내부의 별칭 경로이며, 출력 디렉터리 내의 상대 경로가 아닙니다. 이 import 때문에 생성된 `msw.ts`가 빌드되지 않는다면, 출력 디렉터리 안의 faker 팩토리 파일을 가리키도록 경로를 수동으로 수정하세요(예: `./faker`).

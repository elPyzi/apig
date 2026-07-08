# @travjek/apig

API 통합의 고통을 없애고 하루를 조금 더 행복하게 만드는 강력하고 개발자 친화적인 OpenAPI 코드 생성기.

## 설치

```bash
npm install -D @travjek/apig
```

## 빠른 시작

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

## 플러그인

| 플러그인 | 설명 |
|---------|------|
| `typescript()` | OpenAPI 스키마에서 TypeScript 타입 생성 |
| `sdk()` | 타입이 지정된 요청 함수（`fetch`, `axios`, `ky`, `ofetch`, `wretch`）|
| `zod()` | Zod 스키마（email, uuid, min/max, 판별 유니온 지원）|
| `valibot()` | Valibot 스키마 |
| `yup()` | Yup 스키마 |
| `tanstackQuery()` | TanStack Query v5 훅 |
| `swr()` | SWR 훅 |
| `rhf()` | React Hook Form 리졸버 |
| `faker()` | Faker.js 팩토리 |
| `msw()` | Mock Service Worker 핸들러 |

## CLI

```bash
apig generate           # 코드 생성
apig generate --watch   # 파일 변경 감시 모드
apig generate --dry-run # 파일을 작성하지 않고 미리보기
apig versions           # 저장된 스냅샷 목록
apig info               # 코드 생성 없이 사양 통계 표시
```

## 문서

- [설정](./config.md)
- [CLI](./cli.md)
- [플러그인](./plugins/index.md)
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
- [커스텀 플러그인 만들기](./custom-plugin.md)
- [ApigError 클라이언트](./client.md)
- [캐시](./cache.md)
- [endpointsMap](./endpoints-map.md)

## 라이선스

MIT

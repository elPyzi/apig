# swr()

OpenAPI 작업에서 [SWR](https://swr.vercel.app) 훅을 생성합니다. 플러그인 배열에 `sdk()`가 필요합니다.

## 사용법

```ts
import { defineConfig, typescript, sdk, swr } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), swr()],
})
```

## 옵션

```ts
swr({
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `queryKeysStyle`

**타입:** `'functions' | 'object'`  
**기본값:** `'functions'`

- `functions` — 키 함수가 훅과 같은 파일에서 바로 export됨: `getUsersSwrKey(...)`
- `object` — `swrKeys` 객체가 담긴 공유 파일 `query-keys.ts`, `swrKeys.getUsers(...)`처럼 사용

### `hookGenerationStrategies`

`operationId`별로 특정 작업에 대한 훅 생성을 재정의합니다:

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
}
```

기본값: `GET` → `useSWR`, 나머지 → `useSWRMutation`.

## 생성된 훅 이름 규칙

`operationId: getUsers`인 작업의 경우:

| 훅 | 이름 |
|-----|------|
| `useSWR` | `useGetUsers` |
| 키 (`functions` 스타일) | `getUsersSwrKey` |

뮤테이션(`operationId: createUser`)의 경우:

| 훅 | 이름 |
|-----|------|
| `useSWRMutation` | `useCreateUserMutation` |

## 출력 예시

```ts
export const useGetUsers = (
  params?: { page?: number; limit?: number },
  options?: SWRConfiguration<UserList>,
) => {
  return useSWR<UserList, ApigError>(getUsersSwrKey(params), () => getUsers(params), options);
};
```

```ts
export const useCreateUserMutation = (
  options?: SWRMutationConfiguration<User, ApigError, any, CreateUserInput>,
) => {
  return useSWRMutation<User, ApigError, any, CreateUserInput>(
    'createUser',
    (_key, { arg }: { arg: CreateUserInput }) => createUser(arg),
    options,
  );
};
```

뮤테이션에 요청 본문(`body`)이 없으면 뮤테이션 키는 그대로 유지됩니다 — SDK 함수 호출 시 `arg` 인자만 없어집니다.

# tanstackQuery()

OpenAPI 작업에서 [TanStack Query v5](https://tanstack.com/query/latest) 훅을 생성합니다. 플러그인 배열에 `sdk()`가 필요합니다.

## 사용법

```ts
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [typescript(), sdk(), tanstackQuery()],
})
```

## 옵션

```ts
tanstackQuery({
  query: true,               // GET에 대한 useQuery 훅
  mutation: true,             // 비-GET에 대한 useMutation 훅
  infinite: false,             // GET에 대한 useInfiniteQuery 훅
  suspense: false,              // GET에 대한 useSuspenseQuery 훅
  queryKeysStyle: 'functions', // 'functions' | 'object'
  hookGenerationStrategies: {},
})
```

### `query` / `mutation` / `infinite` / `suspense`

**기본값:** `query: true`, `mutation: true`, `infinite: false`, `suspense: false`

전역적으로 어떤 훅이 생성되는지를 제어합니다. `infinite`와 `suspense`는 GET 작업에 대해 일반 `useQuery`에 더해 추가 훅을 생성합니다.

### `queryKeysStyle`

**타입:** `'functions' | 'object'`  
**기본값:** `'functions'`

- `functions` — 키 함수가 훅과 같은 파일에서 바로 export됨: `getUsersQueryKey(...)`
- `object` — `queryKeys` 객체가 담긴 공유 파일 `query-keys.ts`, `queryKeys.getUsers(...)`처럼 사용

### `hookGenerationStrategies`

`operationId`별로 특정 작업에 대한 훅 생성을 재정의합니다. 예를 들어 POST가 검색 엔드포인트로 사용되어 `useMutation`이 아닌 `useQuery`를 생성해야 하는 경우 유용합니다.

```ts
hookGenerationStrategies: {
  searchUsers: { query: true, mutation: false },
  getReports: { infinite: true },
}
```

각 필드(`query`, `mutation`, `infinite`, `suspense`)는 해당 작업에 한해서만 플러그인의 전역 옵션을 재정의합니다.

## 생성된 훅 이름 규칙

`operationId: getUsers`인 작업의 경우:

| 훅 | 이름 |
|-----|------|
| Query options 헬퍼 | `getUsersQueryOptions` |
| `useQuery` | `useGetUsersQuery` |
| `useInfiniteQuery` | `useInfinityGetUsersQuery` |
| `useSuspenseQuery` | `useSuspenseGetUsersQuery` |
| 키 (`functions` 스타일) | `getUsersQueryKey` |

뮤테이션(`operationId: createUser`)의 경우:

| 훅 | 이름 |
|-----|------|
| `useMutation` | `useCreateUserMutation` |

## 출력 예시

```ts
export const getUsersQueryOptions = (params?: { page?: number; limit?: number }) =>
  queryOptions<UserList, ApigError>({
    queryKey: getUsersQueryKey(params),
    queryFn: () => getUsers(params),
  });

export const useGetUsersQuery = (
  params?: { page?: number; limit?: number },
  options?: Omit<UseQueryOptions<UserList, ApigError>, 'queryKey' | 'queryFn'>,
) =>
  useQuery<UserList, ApigError>({ ...getUsersQueryOptions(params), ...options });
```

```ts
export const useCreateUserMutation = (
  options?: Omit<UseMutationOptions<User, ApigError, { body: CreateUserInput }>, 'mutationFn'>,
) =>
  useMutation<User, ApigError, { body: CreateUserInput }>({
    mutationFn: (vars) => createUser(vars.body),
    ...options,
  });
```

`tanstackQuery({ infinite: true })`인 경우:

```ts
export const useInfinityGetUsersQuery = (
  params?: { page?: number; limit?: number },
  options?: Omit<UseInfiniteQueryOptions<UserList, ApigError, InfiniteData<UserList>, readonly unknown[], number>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>,
) =>
  useInfiniteQuery<UserList, ApigError, InfiniteData<UserList>, readonly unknown[], number>({
    queryKey: getUsersQueryKey(params),
    queryFn: (_pageParam) => getUsers(params),
    getNextPageParam: () => undefined,
    initialPageParam: 0,
    ...options,
  });
```

`getNextPageParam`은 기본적으로 `undefined`를 반환합니다 — 이 페이지네이션 로직은 구체적인 API에 맞게 직접 구현해야 합니다.

## 라우터 로더에서 `queryOptions` 사용하기

```ts
await queryClient.prefetchQuery(getUsersQueryOptions({ page: 1 }))
```

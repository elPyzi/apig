# faker()

모든 객체 스키마와 enum에 대해 [Faker.js](https://fakerjs.dev) 팩토리를 생성합니다.

`faker()`는 옵션을 받지 않습니다.

## 사용법

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## 필드 값이 결정되는 방식

각 속성에 규칙이 적용되는 순서:

1. 속성 타입이 다른 스키마에 대한 참조(`$ref`)이면 — 해당 스키마의 팩토리를 호출: `generate${Schema}()`
2. 타입이 enum이면 — enum 값으로 `faker.helpers.arrayElement([...])`
3. 타입이 객체/참조 배열이면 — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. 타입이 원시값 배열이면 — `faker.helpers.multiple(() => <원시값>, { count: 3 })`
5. 그 외에는 — 필드 이름에 따른 휴리스틱 (아래 표 참조)

## 필드 이름에 따른 의미론적 휴리스틱

필드 이름에 대해 **정확히 일치**하거나 **부분 문자열로 포함**되는지(대소문자 구분 없이) 확인합니다:

| 필드 이름 | Faker 메서드 |
|----------|-------------|
| 정확히 `username`이거나 `username`을 포함 | `faker.internet.username()` |
| `email`을 포함 | `faker.internet.email()` |
| `password`를 포함 | `faker.internet.password()` |
| `phone`을 포함 | `faker.phone.number()` |
| `url` 또는 `photo`를 포함 | `faker.internet.url()` |
| 정확히 `firstName`/`first_name` | `faker.person.firstName()` |
| 정확히 `lastName`/`last_name` | `faker.person.lastName()` |
| `name`을 포함 (firstName/lastName 제외) | `faker.person.fullName()` |
| `date`를 포함 | `faker.date.past().toISOString()` |
| `status`를 포함 | 필드 타입이 숫자면 `faker.number.int()`, 아니면 `faker.lorem.word()` |
| `id`를 포함 | `faker.number.int()` |
| 어느 것도 일치하지 않음 | 스키마 타입에 따라: `string` → `faker.lorem.word()`, `number`/`integer` → `faker.number.int()`, `boolean` → `faker.datatype.boolean()` |

검사는 위에서 아래 순서로 수행되며 — 처음 일치하는 항목이 적용됩니다. 예를 들어 `emailVerified` 필드는 다른 무엇도 아닌 `email`에 일치합니다.

`uuid`, `avatar`, `image`, `title`, `description`, `bio`, `price`, `city`, `country`, `address`, `zip` 같은 필드는 휴리스틱 목록에 **없으며**, 기본 타입이 적용됩니다(문자열의 경우 `faker.lorem.word()`).

## 출력 예시

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

다른 스키마들의 배열은 별도 함수가 아니라 다른 팩토리 안에서 중첩 호출로 생성됩니다:

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

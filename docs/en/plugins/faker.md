# faker()

Generates [Faker.js](https://fakerjs.dev) factories for all object schemas and enums.

`faker()` has no options.

## Usage

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## How a field's value is determined

Order of rules applied per property:

1. If the property type is a reference to another schema (`$ref`) — the factory for that schema is called: `generate${Schema}()`
2. If the type is an enum — `faker.helpers.arrayElement([...])` with the enum's values
3. If the type is an array of objects/references — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. If the type is an array of primitives — `faker.helpers.multiple(() => <primitive>, { count: 3 })`
5. Otherwise — a heuristic based on the field name (see table below)

## Semantic field-name heuristics

Checked as an **exact match** or **substring match** (case-insensitive) against the field name:

| Field name | Faker method |
|------------|--------------|
| exactly `username` or contains `username` | `faker.internet.username()` |
| contains `email` | `faker.internet.email()` |
| contains `password` | `faker.internet.password()` |
| contains `phone` | `faker.phone.number()` |
| contains `url` or `photo` | `faker.internet.url()` |
| exactly `firstName`/`first_name` | `faker.person.firstName()` |
| exactly `lastName`/`last_name` | `faker.person.lastName()` |
| contains `name` (other than firstName/lastName) | `faker.person.fullName()` |
| contains `date` | `faker.date.past().toISOString()` |
| contains `status` | `faker.number.int()` if the field's type is numeric, otherwise `faker.lorem.word()` |
| contains `id` | `faker.number.int()` |
| nothing matched | based on the schema type: `string` → `faker.lorem.word()`, `number`/`integer` → `faker.number.int()`, `boolean` → `faker.datatype.boolean()` |

Checks run top-to-bottom in this order — the first match wins. For example, a field named `emailVerified` matches `email`, not anything else.

Fields like `uuid`, `avatar`, `image`, `title`, `description`, `bio`, `price`, `city`, `country`, `address`, `zip` are **not** in the heuristics list — they fall through to the default for their schema type (`faker.lorem.word()` for strings).

## Output example

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

Arrays of related schemas inside other factories are generated via a nested call, not as a separate function:

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

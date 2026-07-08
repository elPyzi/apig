# faker()

Генерирует [Faker.js](https://fakerjs.dev) фабрики для всех объектных схем и enum-ов.

`faker()` не принимает опций.

## Использование

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## Как определяется значение поля

Порядок применения правил для каждого свойства:

1. Если тип свойства — ссылка на другую схему (`$ref`) — вызывается фабрика этой схемы: `generate${Schema}()`
2. Если тип — enum — `faker.helpers.arrayElement([...])` со значениями enum
3. Если тип — массив объектов/ссылок — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. Если тип — массив примитивов — `faker.helpers.multiple(() => <примитив>, { count: 3 })`
5. Иначе — эвристика по имени поля (см. таблицу ниже)

## Семантические эвристики по имени поля

Проверяется **точное совпадение** или **вхождение подстроки** (без учёта регистра) в имени поля:

| Имя поля | Метод Faker |
|----------|-------------|
| точно `username` или содержит `username` | `faker.internet.username()` |
| содержит `email` | `faker.internet.email()` |
| содержит `password` | `faker.internet.password()` |
| содержит `phone` | `faker.phone.number()` |
| содержит `url` или `photo` | `faker.internet.url()` |
| точно `firstName`/`first_name` | `faker.person.firstName()` |
| точно `lastName`/`last_name` | `faker.person.lastName()` |
| содержит `name` (кроме firstName/lastName) | `faker.person.fullName()` |
| содержит `date` | `faker.date.past().toISOString()` |
| содержит `status` | `faker.number.int()`, если тип поля числовой, иначе `faker.lorem.word()` |
| содержит `id` | `faker.number.int()` |
| ничего не подошло | по типу схемы: `string` → `faker.lorem.word()`, `number`/`integer` → `faker.number.int()`, `boolean` → `faker.datatype.boolean()` |

Проверки выполняются в этом порядке сверху вниз — первое совпадение побеждает. Например, поле `emailVerified` совпадёт с `email`, а не с чем-то другим.

Полей вроде `uuid`, `avatar`, `image`, `title`, `description`, `bio`, `price`, `city`, `country`, `address`, `zip` — **нет** в списке эвристик, для них применяется тип по умолчанию (`faker.lorem.word()` для строк).

## Пример вывода

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

Массивы связанных схем внутри других фабрик генерируются через вложенный вызов, а не отдельной функцией:

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

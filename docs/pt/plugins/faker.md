# faker()

Gera factories [Faker.js](https://fakerjs.dev) para todos os esquemas de objeto e enums.

`faker()` não aceita opções.

## Uso

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## Como o valor de um campo é determinado

Ordem de aplicação das regras para cada propriedade:

1. Se o tipo da propriedade for uma referência a outro esquema (`$ref`) — a factory desse esquema é chamada: `generate${Schema}()`
2. Se o tipo for enum — `faker.helpers.arrayElement([...])` com os valores do enum
3. Se o tipo for um array de objetos/referências — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. Se o tipo for um array de primitivos — `faker.helpers.multiple(() => <primitivo>, { count: 3 })`
5. Caso contrário — heurística pelo nome do campo (veja a tabela abaixo)

## Heurísticas semânticas por nome de campo

É verificada a **correspondência exata** ou a **presença de substring** (sem diferenciar maiúsculas/minúsculas) no nome do campo:

| Nome do campo | Método Faker |
|----------|-------------|
| exatamente `username` ou contém `username` | `faker.internet.username()` |
| contém `email` | `faker.internet.email()` |
| contém `password` | `faker.internet.password()` |
| contém `phone` | `faker.phone.number()` |
| contém `url` ou `photo` | `faker.internet.url()` |
| exatamente `firstName`/`first_name` | `faker.person.firstName()` |
| exatamente `lastName`/`last_name` | `faker.person.lastName()` |
| contém `name` (exceto firstName/lastName) | `faker.person.fullName()` |
| contém `date` | `faker.date.past().toISOString()` |
| contém `status` | `faker.number.int()`, se o tipo do campo for numérico, senão `faker.lorem.word()` |
| contém `id` | `faker.number.int()` |
| nada correspondeu | conforme o tipo do esquema: `string` → `faker.lorem.word()`, `number`/`integer` → `faker.number.int()`, `boolean` → `faker.datatype.boolean()` |

As verificações são feitas nessa ordem, de cima para baixo — a primeira correspondência vence. Por exemplo, o campo `emailVerified` vai corresponder a `email`, e não a outra regra.

Campos como `uuid`, `avatar`, `image`, `title`, `description`, `bio`, `price`, `city`, `country`, `address`, `zip` **não** constam na lista de heurísticas — para eles é aplicado o tipo padrão (`faker.lorem.word()` para strings).

## Exemplo de saída

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

Arrays de esquemas relacionados dentro de outras factories são gerados por meio de uma chamada aninhada, e não como uma função separada:

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

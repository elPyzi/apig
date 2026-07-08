# faker()

Genera fábricas de [Faker.js](https://fakerjs.dev) para todos los esquemas de objeto y enums.

`faker()` no acepta opciones.

## Uso

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## Cómo se determina el valor de un campo

Orden de aplicación de las reglas para cada propiedad:

1. Si el tipo de la propiedad es una referencia a otro esquema (`$ref`) — se llama a la fábrica de ese esquema: `generate${Schema}()`
2. Si el tipo es un enum — `faker.helpers.arrayElement([...])` con los valores del enum
3. Si el tipo es un array de objetos/referencias — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. Si el tipo es un array de primitivos — `faker.helpers.multiple(() => <primitivo>, { count: 3 })`
5. En caso contrario — heurística según el nombre del campo (ver tabla más abajo)

## Heurísticas semánticas por nombre de campo

Se comprueba una **coincidencia exacta** o la **presencia de una subcadena** (sin distinguir mayúsculas/minúsculas) en el nombre del campo:

| Nombre del campo | Método Faker |
|----------|-------------|
| exactamente `username` o contiene `username` | `faker.internet.username()` |
| contiene `email` | `faker.internet.email()` |
| contiene `password` | `faker.internet.password()` |
| contiene `phone` | `faker.phone.number()` |
| contiene `url` o `photo` | `faker.internet.url()` |
| exactamente `firstName`/`first_name` | `faker.person.firstName()` |
| exactamente `lastName`/`last_name` | `faker.person.lastName()` |
| contiene `name` (excepto firstName/lastName) | `faker.person.fullName()` |
| contiene `date` | `faker.date.past().toISOString()` |
| contiene `status` | `faker.number.int()`, si el tipo del campo es numérico, en caso contrario `faker.lorem.word()` |
| contiene `id` | `faker.number.int()` |
| ninguna coincidencia | según el tipo del esquema: `string` → `faker.lorem.word()`, `number`/`integer` → `faker.number.int()`, `boolean` → `faker.datatype.boolean()` |

Las comprobaciones se ejecutan en este orden de arriba hacia abajo — gana la primera coincidencia. Por ejemplo, el campo `emailVerified` coincidirá con `email`, no con otra regla.

Campos como `uuid`, `avatar`, `image`, `title`, `description`, `bio`, `price`, `city`, `country`, `address`, `zip` **no** están en la lista de heurísticas, por lo que se les aplica el tipo por defecto (`faker.lorem.word()` para cadenas).

## Ejemplo de salida

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

Los arrays de esquemas relacionados dentro de otras fábricas se generan mediante una llamada anidada, no como una función independiente:

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

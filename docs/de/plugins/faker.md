# faker()

Generiert [Faker.js](https://fakerjs.dev)-Factories für alle Objektschemata und Enums.

`faker()` nimmt keine Optionen entgegen.

## Verwendung

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## Wie der Wert eines Felds bestimmt wird

Reihenfolge der angewendeten Regeln für jede Eigenschaft:

1. Ist der Typ der Eigenschaft eine Referenz auf ein anderes Schema (`$ref`) — wird die Factory dieses Schemas aufgerufen: `generate${Schema}()`
2. Ist der Typ ein Enum — `faker.helpers.arrayElement([...])` mit den Enum-Werten
3. Ist der Typ ein Array von Objekten/Referenzen — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. Ist der Typ ein Array von Primitiven — `faker.helpers.multiple(() => <Primitiv>, { count: 3 })`
5. Andernfalls — Heuristik anhand des Feldnamens (siehe Tabelle unten)

## Semantische Heuristiken anhand des Feldnamens

Geprüft wird eine **exakte Übereinstimmung** oder ein **Vorkommen als Teilzeichenfolge** (ohne Berücksichtigung der Groß-/Kleinschreibung) im Feldnamen:

| Feldname | Faker-Methode |
|----------|---------------|
| exakt `username` oder enthält `username` | `faker.internet.username()` |
| enthält `email` | `faker.internet.email()` |
| enthält `password` | `faker.internet.password()` |
| enthält `phone` | `faker.phone.number()` |
| enthält `url` oder `photo` | `faker.internet.url()` |
| exakt `firstName`/`first_name` | `faker.person.firstName()` |
| exakt `lastName`/`last_name` | `faker.person.lastName()` |
| enthält `name` (außer firstName/lastName) | `faker.person.fullName()` |
| enthält `date` | `faker.date.past().toISOString()` |
| enthält `status` | `faker.number.int()`, wenn der Feldtyp numerisch ist, sonst `faker.lorem.word()` |
| enthält `id` | `faker.number.int()` |
| nichts passt | je nach Schema-Typ: `string` → `faker.lorem.word()`, `number`/`integer` → `faker.number.int()`, `boolean` → `faker.datatype.boolean()` |

Die Prüfungen erfolgen in dieser Reihenfolge von oben nach unten — die erste Übereinstimmung gewinnt. Zum Beispiel passt das Feld `emailVerified` zu `email` und nicht zu etwas anderem.

Felder wie `uuid`, `avatar`, `image`, `title`, `description`, `bio`, `price`, `city`, `country`, `address`, `zip` sind **nicht** in der Heuristik-Liste enthalten — für sie gilt der Standardtyp (`faker.lorem.word()` für Strings).

## Ausgabebeispiel

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

Arrays verknüpfter Schemata innerhalb anderer Factories werden durch einen verschachtelten Aufruf generiert, nicht durch eine eigene Funktion:

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

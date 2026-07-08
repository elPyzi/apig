# faker()

Génère des fabriques [Faker.js](https://fakerjs.dev) pour tous les schémas objet et les enums.

`faker()` n'accepte pas d'options.

## Utilisation

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## Comment la valeur d'un champ est déterminée

Ordre d'application des règles pour chaque propriété :

1. Si le type de la propriété est une référence vers un autre schéma (`$ref`) — la fabrique de ce schéma est appelée : `generate${Schema}()`
2. Si le type est un enum — `faker.helpers.arrayElement([...])` avec les valeurs de l'enum
3. Si le type est un tableau d'objets/de références — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. Si le type est un tableau de primitifs — `faker.helpers.multiple(() => <primitif>, { count: 3 })`
5. Sinon — heuristique basée sur le nom du champ (voir le tableau ci-dessous)

## Heuristiques sémantiques basées sur le nom du champ

Une **correspondance exacte** ou une **sous-chaîne présente** (insensible à la casse) dans le nom du champ est vérifiée :

| Nom du champ | Méthode Faker |
|--------------|---------------|
| exactement `username` ou contient `username` | `faker.internet.username()` |
| contient `email` | `faker.internet.email()` |
| contient `password` | `faker.internet.password()` |
| contient `phone` | `faker.phone.number()` |
| contient `url` ou `photo` | `faker.internet.url()` |
| exactement `firstName`/`first_name` | `faker.person.firstName()` |
| exactement `lastName`/`last_name` | `faker.person.lastName()` |
| contient `name` (sauf firstName/lastName) | `faker.person.fullName()` |
| contient `date` | `faker.date.past().toISOString()` |
| contient `status` | `faker.number.int()` si le type du champ est numérique, sinon `faker.lorem.word()` |
| contient `id` | `faker.number.int()` |
| rien ne correspond | selon le type du schéma : `string` → `faker.lorem.word()`, `number`/`integer` → `faker.number.int()`, `boolean` → `faker.datatype.boolean()` |

Les vérifications s'effectuent dans cet ordre, de haut en bas — la première correspondance l'emporte. Par exemple, le champ `emailVerified` correspondra à `email`, et non à autre chose.

Des champs comme `uuid`, `avatar`, `image`, `title`, `description`, `bio`, `price`, `city`, `country`, `address`, `zip` **ne figurent pas** dans la liste des heuristiques — le type par défaut leur est appliqué (`faker.lorem.word()` pour les chaînes).

## Exemple de sortie

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

Les tableaux de schémas liés à l'intérieur d'autres fabriques sont générés via un appel imbriqué, et non par une fonction séparée :

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

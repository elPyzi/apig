# faker()

すべてのオブジェクトスキーマとenumに対して [Faker.js](https://fakerjs.dev) ファクトリーを生成する。

`faker()` はオプションを受け取らない。

## 使用方法

```ts
import { defineConfig, faker } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker()],
})
```

## フィールド値の決定方法

各プロパティに対するルール適用順序:

1. プロパティの型が他のスキーマへの参照（`$ref`）の場合 — そのスキーマのファクトリーが呼び出される: `generate${Schema}()`
2. 型がenumの場合 — enumの値を使った `faker.helpers.arrayElement([...])`
3. 型がオブジェクト/参照の配列の場合 — `faker.helpers.multiple(() => generate${Item}(), { count: 3 })`
4. 型がプリミティブの配列の場合 — `faker.helpers.multiple(() => <プリミティブ>, { count: 3 })`
5. それ以外 — フィールド名によるヒューリスティック（下の表を参照）

## フィールド名によるセマンティックヒューリスティック

フィールド名の**完全一致**または**部分文字列の包含**（大文字小文字を区別しない）をチェックする:

| フィールド名 | Fakerメソッド |
|----------|-------------|
| 完全一致 `username` または `username` を含む | `faker.internet.username()` |
| `email` を含む | `faker.internet.email()` |
| `password` を含む | `faker.internet.password()` |
| `phone` を含む | `faker.phone.number()` |
| `url` または `photo` を含む | `faker.internet.url()` |
| 完全一致 `firstName`/`first_name` | `faker.person.firstName()` |
| 完全一致 `lastName`/`last_name` | `faker.person.lastName()` |
| `name` を含む（firstName/lastNameを除く） | `faker.person.fullName()` |
| `date` を含む | `faker.date.past().toISOString()` |
| `status` を含む | フィールドの型が数値の場合 `faker.number.int()`、それ以外は `faker.lorem.word()` |
| `id` を含む | `faker.number.int()` |
| 何も一致しない場合 | スキーマの型による: `string` → `faker.lorem.word()`、`number`/`integer` → `faker.number.int()`、`boolean` → `faker.datatype.boolean()` |

チェックはこの順序で上から下に実行される — 最初に一致したものが優先される。例えば、フィールド `emailVerified` は他の何かではなく `email` に一致する。

`uuid`、`avatar`、`image`、`title`、`description`、`bio`、`price`、`city`、`country`、`address`、`zip` のようなフィールドは、ヒューリスティックのリストに**含まれない** — これらにはデフォルトの型（文字列の場合 `faker.lorem.word()`）が適用される。

## 出力例

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

他のスキーマの配列は、他のファクトリー内では別の関数としてではなく、ネストされた呼び出しとして生成される:

```ts
export const generateUserList = (): UserList => ({
  items: faker.helpers.multiple(() => generateUser(), { count: 3 }),
  total: faker.number.int(),
})
```

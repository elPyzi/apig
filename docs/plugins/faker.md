Generates Faker.js factories for every schema in the spec. Call the function, get an object with realistic fake data and the right types.

## Usage

```ts

import { defineConfig, typescript, faker } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), faker()],
});

```

> apig doesn't install `@faker-js/faker` — add it yourself. Types for the factories come from `typescript()`.

From the `Pet` schema you get this in `faker.ts`:

```ts
import { faker } from '@faker-js/faker';
import type { Pet } from './types';

export const generatePet = (overrides?: Partial<Pet>): Pet => ({
id: faker.string.uuid(),
name: faker.person.firstName(),
age: faker.number.int({ min: 0, max: 20 }),
...overrides,
});
```

Use it like any regular factory — in tests, Storybook, mocks:

```ts
const pet = generatePet();
const oldPet = generatePet({ age: 15 });
```

## Options

| Option   | Default | What it does                                                                                                                                       |
| -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `locale` | `"en"`  | `"en"` or `"ru"` — which language Faker generates names, addresses, and text in. Doesn't affect the factory structure, only the values themselves. |

```ts
faker({ locale: "ru" })
```

```ts
export const generatePet = (overrides?: Partial<Pet>): Pet => ({
id: faker.string.uuid(),
name: faker.person.firstName(), // now returns "Alexander", "Maria", etc.
...overrides,
});
```

## Enums

For enum schemas, the factory picks a random value from the set instead of a random string:

```ts
export const generateStatus = (): Status =>
faker.helpers.arrayElement(["available", "pending", "sold"]);
```

## Works well with

> `msw()` requires `faker()` — it pulls factories from here so mocks return believable data instead of stubs.

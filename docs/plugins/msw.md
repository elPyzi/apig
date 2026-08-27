Generates Mock Service Worker handlers for every operation. Tests and Storybook stories hit real API paths, and get back fake data from `faker()`.

## Usage

```ts

import { defineConfig, typescript, sdk, faker, msw } from "@travjek/apig";

export default defineConfig({
input: "./openapi.json",
output: "./src/api",
plugins: [typescript(), sdk(), faker(), msw()],
});

```

> **faker() is required**
>
> `msw()` without `faker()` in the plugin list fails right at generation time — the handlers have nowhere to get response data from. apig doesn't install the `msw` package, add it yourself.

From `GET /pets/{id}` you get this in `msw.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import { generatePet } from './faker';

export const handlers = [
http.get('/pets/:id', ({ params }) => {
  return HttpResponse.json(generatePet());
}),
];
```

Wire it up like regular MSW handlers — in tests, in a browser worker, anywhere:

```ts
import { setupServer } from 'msw/node';
import { handlers } from './api/msw';

export const server = setupServer(...handlers);
```

## No options

`msw()` doesn't configure anything itself — what gets generated is dictated by the spec and the data from `faker()`. Only the outside `defineConfig` options affect its behavior.

## What's decided outside the plugin

```ts
baseUrl: "https://api.example.com"
```

The path in a handler accounts for `baseUrl` — if it's set, the full URL is intercepted instead of a relative path:

```ts
http.get('https://api.example.com/pets/:id', ({ params }) => {
return HttpResponse.json(generatePet());
}),
```

## How different operations respond

DELETE and operations with no described response body return an empty 204:

```ts
http.delete('/pets/:id', () => {
return new HttpResponse(null, { status: 204 });
}),
```

Operations with a request body read it — MSW requires reading the body, or it complains in the console — and then return a fake response:

```ts
http.post('/pets', async ({ request }) => {
await request.json();
return HttpResponse.json(generatePet());
}),
```

## Works well with

> Requires `faker()` — without factories there's nothing to fill responses with. Paths are built from the operations in the spec, and the response shape comes from the same types `sdk()` uses.

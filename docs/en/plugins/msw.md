# msw()

Generates [Mock Service Worker](https://mswjs.io) request handlers from OpenAPI operations.

Requires the `faker()` plugin to be present in the plugins array — otherwise it throws an error during generation.

## Usage

```ts
import { defineConfig, faker, msw } from '@travjek/apig'

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [faker(), msw()],
})
```

## Output example

```ts
import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import { generateUser } from '@/plugins/faker';

export const handlers = [
  http.get('/users', () => {
    return HttpResponse.json([generateUser()]);
  }),
  http.post('/users', async ({ request }) => {
    await request.json();
    return HttpResponse.json(generateUser());
  }),
  http.get('/users/:id', ({ params }) => {
    return HttpResponse.json(generateUser());
  }),
  http.delete('/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

## Response generation rules

- A response that is an array of schema `X` is generated as `[generate${X}()]` — a separate function for lists (`generateUserList`, etc.) is not created unless it's a distinct named schema with `items`/`total` fields.
- Operations with no response schema, and all `DELETE` operations, return `new HttpResponse(null, { status: 204 })`.
- Operations with a request body (`requestBody`) read it via `await request.json()` without using the value.
- Path params (`{id}`) are automatically converted to MSW format (`:id`).

> **Known quirk:** the generated import for faker functions currently points to `@/plugins/faker` — this is an internal alias path from apig's own source code, not a relative path into your output directory. If the generated `msw.ts` fails to build because of this import, fix the path manually to point at the file with your faker factories in your output directory (e.g. `./faker`).
